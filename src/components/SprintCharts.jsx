import { C } from "../constants.js";
import { dateRange, today, formatDay } from "../lib/dates.js";

// ═══════════════════════════════════════════════════════════════
// BURNDOWN — points restants jour par jour sur le sprint
//
// Périmètre = points des tickets actuellement dans le sprint.
// Réel      = périmètre − points terminés (done_at) à la fin de chaque jour.
// Idéal     = droite du périmètre à 0 sur la durée du sprint.
// ═══════════════════════════════════════════════════════════════
export const Burndown = ({ sprint, tickets }) => {
  const days = dateRange(sprint.startDate, sprint.endDate);
  if (days.length < 2) return null;
  const inSprint = tickets.filter((t) => t.sprintId === sprint.id);
  const scope = inSprint.reduce((s, t) => s + (t.fib || 0), 0);
  const now = today();

  const doneBy = (iso) =>
    inSprint
      .filter((t) => t.status === "done" && t.doneAt && localDay(t.doneAt) <= iso)
      .reduce((s, t) => s + (t.fib || 0), 0);
  // Tickets terminés sans date (anciens) : comptés dès le 1er jour
  const doneNoDate = inSprint.filter((t) => t.status === "done" && !t.doneAt).reduce((s, t) => s + (t.fib || 0), 0);

  const actual = days.filter((d) => d <= now).map((d) => scope - doneBy(d) - doneNoDate);

  const W = 520, H = 190, P = { l: 34, r: 12, t: 12, b: 26 };
  const maxY = Math.max(scope, 1);
  const x = (i) => P.l + (i / (days.length - 1)) * (W - P.l - P.r);
  const y = (v) => P.t + (1 - v / maxY) * (H - P.t - P.b);
  const ticks = [0, Math.round(maxY / 2), maxY];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Burndown : ${actual[actual.length - 1] ?? scope} points restants sur ${scope}`}
      style={{ width: "100%", height: "auto", display: "block" }}>
      {ticks.map((v) => (
        <g key={v}>
          <line x1={P.l} x2={W - P.r} y1={y(v)} y2={y(v)} stroke={C.border} />
          <text x={P.l - 6} y={y(v) + 4} textAnchor="end" fontSize="10" fill={C.textDim}>{v}</text>
        </g>
      ))}
      {days.map((d, i) => (
        <text key={d} x={x(i)} y={H - 8} textAnchor="middle" fontSize="10"
          fill={d === now ? C.encre : C.textDim} fontWeight={d === now ? 700 : 400}>
          {formatDay(d).replace(".", "")}
        </text>
      ))}
      <line x1={x(0)} y1={y(scope)} x2={x(days.length - 1)} y2={y(0)} stroke={C.champagne} strokeWidth="2" strokeDasharray="5 4" />
      {actual.length > 0 && (
        <>
          <polyline fill="none" stroke={C.emeraude} strokeWidth="2.5" strokeLinejoin="round"
            points={actual.map((v, i) => `${x(i)},${y(v)}`).join(" ")} />
          {actual.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="3" fill={C.emeraude} />)}
        </>
      )}
    </svg>
  );
};

const localDay = (ts) => {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// ═══════════════════════════════════════════════════════════════
// VELOCITY — engagé vs livré sur les derniers sprints clos
// ═══════════════════════════════════════════════════════════════
export const Velocity = ({ sprints }) => {
  const closed = sprints.filter((s) => s.status === "closed").slice(-8);
  if (!closed.length) return null;
  const max = Math.max(1, ...closed.map((s) => Math.max(s.committedPoints || 0, s.completedPoints || 0)));
  const W = 520, H = 170, P = { l: 30, r: 10, t: 14, b: 30 };
  const slot = (W - P.l - P.r) / closed.length;
  const bw = Math.min(22, slot / 3);
  const y = (v) => P.t + (1 - v / max) * (H - P.t - P.b);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Vélocité des derniers sprints"
      style={{ width: "100%", height: "auto", display: "block" }}>
      <line x1={P.l} x2={W - P.r} y1={y(0)} y2={y(0)} stroke={C.borderStrong} />
      {closed.map((s, i) => {
        const cx = P.l + slot * i + slot / 2;
        const c = s.committedPoints || 0;
        const d = s.completedPoints || 0;
        return (
          <g key={s.id}>
            <rect x={cx - bw - 2} y={y(c)} width={bw} height={y(0) - y(c)} fill={C.ivoireDeeper} rx="2" />
            <rect x={cx + 2} y={y(d)} width={bw} height={y(0) - y(d)} fill={C.emeraude} rx="2" />
            <text x={cx + 2 + bw / 2} y={y(d) - 4} textAnchor="middle" fontSize="10" fontWeight="700" fill={C.emeraude}>{d}</text>
            <text x={cx} y={H - 10} textAnchor="middle" fontSize="10" fill={C.textMuted}>{s.name.replace("Sprint ", "")}</text>
          </g>
        );
      })}
    </svg>
  );
};
