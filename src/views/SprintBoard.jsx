import { useState, useMemo } from "react";
import { C, STATUSES, MEMBERS, memberById } from "../constants.js";
import { today, daysBetween, formatRange, weeklySprintDraft, mondayOfISO, isoWeek, addDays } from "../lib/dates.js";
import { Btn, Avatar, ProgressBar, ErrorBanner } from "../components/ui.jsx";
import { Header } from "../components/Header.jsx";
import { TicketCard } from "../components/TicketCard.jsx";
import { Burndown } from "../components/SprintCharts.jsx";

// ═══════════════════════════════════════════════════════════════
// SPRINT BOARD — le board Kanban du sprint actif (vue par défaut)
//
// Glisser une carte dans une colonne = changer son statut.
// En mode « Par membre », la glisser dans la ligne d'un autre membre
// la réassigne aussi.
// ═══════════════════════════════════════════════════════════════
const pts = (list) => list.reduce((s, t) => s + (t.fib || 0), 0);

export default function SprintBoard({
  nav, tickets, sprints, me,
  onOpenTicket, updateTicket, onQuickAdd,
  onCreateWeeklySprint, onStartSprint, onRequestClose, onEditSprint,
  error, clearError,
}) {
  const active = sprints.find((s) => s.status === "active");
  const [filterMember, setFilterMember] = useState("all");
  const [search, setSearch] = useState("");
  const [lanes, setLanes] = useState(false);
  const [dragId, setDragId] = useState(null);
  const [over, setOver] = useState(null);

  const sprintTickets = useMemo(
    () => (active ? tickets.filter((t) => t.sprintId === active.id) : []),
    [tickets, active],
  );

  const visible = useMemo(() => sprintTickets.filter((t) => {
    if (filterMember === "me" && t.assignee !== me) return false;
    if (filterMember !== "all" && filterMember !== "me" && t.assignee !== filterMember) return false;
    if (search && !`${t.id} ${t.title}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [sprintTickets, filterMember, search, me]);

  // ─── Drag & drop ─────────────────────────────────────────────
  const handleDrop = (e, status, assignee) => {
    e.preventDefault();
    setOver(null);
    const id = e.dataTransfer.getData("text/plain") || dragId;
    setDragId(null);
    const t = tickets.find((x) => x.id === id);
    if (!t) return;
    const patch = {};
    if (t.status !== status) patch.status = status;
    if (assignee !== undefined && t.assignee !== assignee) patch.assignee = assignee;
    if (Object.keys(patch).length) updateTicket({ ...t, ...patch });
  };

  const dropProps = (key, status, assignee) => ({
    onDragOver: (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (over !== key) setOver(key); },
    onDragLeave: (e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOver(null); },
    onDrop: (e) => handleDrop(e, status, assignee),
  });

  const headerNode = (
    <Header {...nav} title="Sprint en cours" subtitle={active ? active.name : "Aucun sprint actif"}>
      {active && <Btn variant="secondary" size="sm" onClick={() => onQuickAdd(active.id)}>+ Ticket</Btn>}
      {active && <Btn variant="champagne" size="sm" onClick={() => onRequestClose(active)}>Terminer le sprint</Btn>}
    </Header>
  );

  // ─── ÉTAT VIDE : pas de sprint actif ─────────────────────────
  if (!active) {
    const planned = sprints.filter((s) => s.status === "planned");
    // Semaine déjà couverte par un sprint clos → on propose la suivante
    const closedThisWeek = sprints.some((s) => s.status === "closed" && s.startDate <= today() && s.endDate >= today());
    const thisMonday = closedThisWeek ? addDays(mondayOfISO(), 7) : mondayOfISO();
    const thisWeekPlanned = planned.find((s) => s.startDate <= thisMonday && s.endDate >= thisMonday);
    const draft = weeklySprintDraft(thisMonday);
    return (
      <Page>
        {headerNode}
        <ErrorBanner error={error} onDismiss={clearError} />
        <div style={{ maxWidth: 720, margin: "48px auto", padding: "0 20px" }}>
          <div style={{ color: C.encre, fontSize: 26, fontWeight: 700, fontFamily: "'Georgia', serif", lineHeight: 1.25 }}>
            Pas de sprint en cours cette semaine.
          </div>
          <p style={{ color: C.textMuted, fontSize: 14, lineHeight: 1.6, maxWidth: 560 }}>
            Un sprint = une semaine, du lundi au dimanche. On y met les tickets qu'on s'engage à finir,
            on le démarre, on avance sur le board, et on le termine le dimanche.
          </p>

          {planned.length > 0 && (
            <div style={{ margin: "22px 0", display: "flex", flexDirection: "column", gap: 10 }}>
              {planned.map((s) => {
                const n = tickets.filter((t) => t.sprintId === s.id);
                return (
                  <div key={s.id} style={{
                    display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: C.bgPanel,
                    border: `1px solid ${s.id === thisWeekPlanned?.id ? C.champagne : C.border}`, borderRadius: 10, flexWrap: "wrap",
                  }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontWeight: 700, color: C.encre, fontSize: 15 }}>{s.name}</div>
                      <div style={{ color: C.textDim, fontSize: 12 }}>{formatRange(s.startDate, s.endDate)} · {n.length} tickets · {pts(n)} pts</div>
                    </div>
                    <Btn variant="secondary" size="sm" onClick={() => nav.setView("backlog")}>Préparer</Btn>
                    <Btn variant="primary" size="sm" onClick={() => onStartSprint(s)} disabled={n.length === 0}
                      title={n.length === 0 ? "Ajoute au moins un ticket depuis le Backlog" : ""}>▶ Démarrer</Btn>
                  </div>
                );
              })}
            </div>
          )}

          {!thisWeekPlanned && (
            <Btn variant="champagne" size="lg" onClick={() => onCreateWeeklySprint(thisMonday)} style={{ marginTop: 12 }}>
              + Planifier {draft.name} ({formatRange(draft.startDate, draft.endDate)})
            </Btn>
          )}
        </div>
      </Page>
    );
  }

  // ─── SPRINT ACTIF ────────────────────────────────────────────
  const now = today();
  const totalPts = pts(sprintTickets);
  const donePts = pts(sprintTickets.filter((t) => t.status === "done"));
  const daysLeft = daysBetween(now, active.endDate);
  const overdue = daysLeft < 0;
  const countdown = overdue
    ? `Terminé depuis ${-daysLeft} j`
    : daysLeft === 0 ? "Dernier jour" : `J-${daysLeft}`;

  const memberRows = MEMBERS
    .map((m) => ({ m, list: sprintTickets.filter((t) => t.assignee === m.id) }))
    .concat([{ m: memberById("unassigned"), list: sprintTickets.filter((t) => !t.assignee || t.assignee === "unassigned") }]);

  const columns = (list, laneKey, laneAssignee) => (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${STATUSES.length}, minmax(210px, 1fr))`, gap: 10 }}>
      {STATUSES.map((s) => {
        const colTickets = list.filter((t) => t.status === s.id);
        const key = `${laneKey}:${s.id}`;
        return (
          <div key={s.id} {...dropProps(key, s.id, laneAssignee)} style={{
            background: over === key ? `${s.color}12` : C.bgSubtle,
            border: `1px ${over === key ? "dashed" : "solid"} ${over === key ? s.color : C.borderSubtle}`,
            borderRadius: 10, padding: 8, minHeight: lanes ? 90 : 320,
          }}>
            {!lanes && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 4px 10px" }}>
                <span style={{ color: s.color, fontSize: 12 }}>{s.icon}</span>
                <span style={{ color: C.text, fontSize: 12, fontWeight: 700 }}>{s.label}</span>
                <span style={{ color: C.textDim, fontSize: 12 }}>{colTickets.length}</span>
                <div style={{ flex: 1 }} />
                <span style={{ color: C.textDim, fontSize: 11 }}>{pts(colTickets)} pts</span>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {colTickets.map((t) => (
                <TicketCard key={t.id} t={t} onOpen={onOpenTicket}
                  dragging={dragId === t.id} highlight={me && t.assignee === me}
                  onDragStart={setDragId} onDragEnd={() => { setDragId(null); setOver(null); }} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <Page>
      {headerNode}
      <ErrorBanner error={error} onDismiss={clearError} />

      <div style={{ padding: "20px 28px", maxWidth: 1500, margin: "0 auto" }}>
        {/* ═══ BANDEAU SPRINT ═══ */}
        <section style={{
          display: "grid", gridTemplateColumns: "minmax(0, 1.4fr) minmax(260px, 1fr)", gap: 24,
          padding: "20px 24px", background: C.encre, color: C.ivoire, borderRadius: 12, marginBottom: 16,
        }} className="sprint-hero">
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
              <h1 style={{ margin: 0, fontFamily: "'Georgia', serif", fontSize: 28, fontWeight: 400, letterSpacing: "-0.01em" }}>{active.name}</h1>
              <span style={{ color: C.champagneLight, fontSize: 13 }}>
                Semaine {isoWeek(active.startDate)} · {formatRange(active.startDate, active.endDate)}
              </span>
              <span style={{
                fontSize: 12, fontWeight: 700, padding: "2px 9px", borderRadius: 99,
                background: overdue ? "#C73E47" : `${C.champagne}30`, color: overdue ? C.ivoire : C.champagneLight,
              }}>{countdown}</span>
            </div>
            <button onClick={() => onEditSprint(active)} style={{
              display: "block", marginTop: 10, padding: 0, border: "none", background: "transparent", cursor: "pointer",
              color: active.goal ? C.ivoire : "rgba(247,243,235,0.5)", fontSize: 14, lineHeight: 1.55, textAlign: "left",
              fontFamily: "inherit", maxWidth: 640,
            }} title="Modifier l'objectif">
              {active.goal || "+ Fixer l'objectif du sprint"}
            </button>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
              <span style={{ fontFamily: "'Georgia', serif", fontSize: 30, color: C.champagne }}>{donePts}</span>
              <span style={{ color: "rgba(247,243,235,0.7)", fontSize: 13 }}>/ {totalPts} points livrés</span>
              {active.committedPoints != null && totalPts !== active.committedPoints && (
                <span title="Périmètre modifié depuis le démarrage" style={{ color: "rgba(247,243,235,0.55)", fontSize: 11 }}>
                  (engagé : {active.committedPoints})
                </span>
              )}
            </div>
            <ProgressBar value={donePts} max={totalPts} color={C.champagne} height={8} />
            <div style={{ display: "flex", gap: 14, marginTop: 10, flexWrap: "wrap" }}>
              {STATUSES.map((s) => {
                const n = sprintTickets.filter((t) => t.status === s.id).length;
                return (
                  <span key={s.id} style={{ fontSize: 12, color: "rgba(247,243,235,0.8)" }}>
                    <span style={{ color: s.id === "done" ? "#6FCF97" : s.id === "blocked" ? "#F28B8B" : C.ivoire, fontWeight: 700 }}>{n}</span> {s.label.toLowerCase()}
                  </span>
                );
              })}
            </div>
          </div>
        </section>

        {overdue && (
          <div style={{
            display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", marginBottom: 16, borderRadius: 8,
            background: `${C.champagne}18`, border: `1px solid ${C.borderGold}`, fontSize: 13, color: C.encre, flexWrap: "wrap",
          }}>
            <span style={{ flex: 1 }}>La semaine du sprint est passée. Termine-le pour faire le bilan et lancer le suivant.</span>
            <Btn size="sm" variant="primary" onClick={() => onRequestClose(active)}>Terminer le sprint</Btn>
          </div>
        )}

        {/* ═══ FILTRES ═══ */}
        <div style={{
          display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", padding: "10px 14px",
          background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 8, marginBottom: 14,
        }}>
          <Chip active={filterMember === "all"} onClick={() => setFilterMember("all")}>Tout le monde</Chip>
          {me && <Chip active={filterMember === "me"} onClick={() => setFilterMember(filterMember === "me" ? "all" : "me")}>Mes tickets</Chip>}
          {MEMBERS.map((m) => {
            const list = sprintTickets.filter((t) => t.assignee === m.id);
            return (
              <button key={m.id} onClick={() => setFilterMember(filterMember === m.id ? "all" : m.id)} title={`${m.name} — ${pts(list)} pts dans le sprint`}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "3px 10px 3px 3px", borderRadius: 99, cursor: "pointer",
                  border: `1px solid ${filterMember === m.id ? m.color : C.border}`,
                  background: filterMember === m.id ? `${m.color}15` : "transparent",
                  fontFamily: "inherit", fontSize: 12, fontWeight: 600, color: C.text,
                }}>
                <Avatar assigneeId={m.id} size={22} />{pts(list)}
              </button>
            );
          })}
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Filtrer le board…" aria-label="Filtrer le board"
            style={{ flex: 1, minWidth: 160, border: `1px solid ${C.border}`, borderRadius: 6, padding: "7px 12px", fontSize: 13, fontFamily: "inherit", outline: "none" }} />
          <Chip active={lanes} onClick={() => setLanes(!lanes)}>☰ Par membre</Chip>
        </div>

        {/* ═══ BOARD ═══ */}
        <div style={{ overflowX: "auto", paddingBottom: 6 }}>
          <div style={{ minWidth: STATUSES.length * 220 }}>
            {!lanes ? columns(visible, "all", undefined) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${STATUSES.length}, minmax(210px, 1fr))`, gap: 10, marginBottom: 6 }}>
                  {STATUSES.map((s) => (
                    <div key={s.id} style={{ padding: "0 8px", fontSize: 12, fontWeight: 700, color: C.text }}>
                      <span style={{ color: s.color }}>{s.icon}</span> {s.label}
                    </div>
                  ))}
                </div>
                {memberRows.map(({ m, list }) => {
                  const shown = list.filter((t) => visible.includes(t));
                  if (!shown.length && m.id === "unassigned") return null;
                  return (
                    <div key={m.id} style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "4px 2px 8px" }}>
                        <Avatar assigneeId={m.id} size={24} />
                        <strong style={{ fontSize: 13, color: C.encre }}>{m.name}</strong>
                        <span style={{ fontSize: 12, color: C.textDim }}>{shown.length} tickets · {pts(shown)} pts</span>
                      </div>
                      {columns(shown, m.id, m.id)}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {sprintTickets.length === 0 && (
          <div style={{ textAlign: "center", color: C.textMuted, fontSize: 13, padding: 20 }}>
            Sprint vide. Ajoute des tickets depuis le <button onClick={() => nav.setView("backlog")} style={linkBtn}>Backlog</button>.
          </div>
        )}

        {/* ═══ BURNDOWN + CHARGE ═══ */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 14, marginTop: 20 }}>
          <Panel title="Burndown" hint="Pointillés : rythme idéal. Vert : points restants réels.">
            <Burndown sprint={active} tickets={tickets} />
          </Panel>
          <Panel title="Charge par membre" hint="Points terminés / points assignés dans ce sprint.">
            <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 4 }}>
              {memberRows.filter(({ list }) => list.length).map(({ m, list }) => {
                const d = pts(list.filter((t) => t.status === "done"));
                const tot = pts(list);
                return (
                  <div key={m.id} style={{ display: "grid", gridTemplateColumns: "120px 1fr 64px", gap: 10, alignItems: "center" }}>
                    <Avatar assigneeId={m.id} size={22} showName />
                    <ProgressBar value={d} max={tot} color={m.id === "unassigned" ? C.textDim : m.color} />
                    <span style={{ fontSize: 12, color: C.textMuted, textAlign: "right" }}>{d} / {tot}</span>
                  </div>
                );
              })}
              {sprintTickets.length === 0 && <span style={{ color: C.textDim, fontSize: 12 }}>Rien d'assigné pour l'instant.</span>}
            </div>
          </Panel>
        </div>
      </div>
      <style>{`@media (max-width: 760px) { .sprint-hero { grid-template-columns: 1fr !important; } }`}</style>
    </Page>
  );
}

// ─── Petits composants locaux ──────────────────────────────────
const Page = ({ children }) => (
  <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
    {children}
  </div>
);

const Chip = ({ active, onClick, children }) => (
  <button onClick={onClick} aria-pressed={active} style={{
    padding: "5px 12px", borderRadius: 99, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600,
    border: `1px solid ${active ? C.encre : C.border}`, background: active ? C.encre : "transparent",
    color: active ? C.ivoire : C.textMuted,
  }}>{children}</button>
);

export const Panel = ({ title, hint, children, action }) => (
  <section style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 18px" }}>
    <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10 }}>
      <h2 style={{ margin: 0, color: C.encre, fontSize: 15, fontWeight: 700, fontFamily: "'Georgia', serif" }}>{title}</h2>
      {hint && <span style={{ color: C.textDim, fontSize: 11 }}>{hint}</span>}
      <div style={{ flex: 1 }} />
      {action}
    </div>
    {children}
  </section>
);

const linkBtn = {
  border: "none", background: "transparent", color: C.champagneDeep, fontWeight: 700,
  cursor: "pointer", padding: 0, fontFamily: "inherit", fontSize: "inherit", textDecoration: "underline",
};
