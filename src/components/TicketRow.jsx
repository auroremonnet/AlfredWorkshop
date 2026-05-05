import { useState } from "react";
import { C, PHASES } from "../constants.js";
import { Avatar, QuadrantPill, FibBadge, StatusPill } from "./ui.jsx";

// ═══════════════════════════════════════════════════════════════
// TICKET ROW
// ═══════════════════════════════════════════════════════════════
export const TicketRow = ({ t, onClick, onStatusCycle }) => {
  const phase = PHASES.find((p) => p.id === t.phase);
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "55px 95px 1fr auto auto auto auto auto auto",
        gap: 12, alignItems: "center", padding: "12px 16px",
        background: hover ? C.bgHover : C.bgCard,
        border: `1px solid ${hover ? C.borderStrong : C.borderSubtle}`,
        borderRadius: 8, cursor: "pointer", marginBottom: 6,
        transition: "all 0.15s ease",
      }}
    >
      <span style={{ color: C.champagneDeep, fontSize: 11, fontWeight: 700, fontFamily: "'Georgia', serif" }}>{t.id}</span>
      {phase && (
        <span style={{
          color: phase.color, fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em",
          padding: "3px 6px", background: `${phase.color}12`, borderRadius: 3, textAlign: "center", whiteSpace: "nowrap",
        }}>{phase.short}</span>
      )}
      <div style={{ minWidth: 0 }}>
        <div style={{ color: C.text, fontSize: 14, fontWeight: 600, marginBottom: 2, lineHeight: 1.3 }}>{t.title}</div>
        {t.desc && (
          <div style={{ color: C.textDim, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {t.desc}
          </div>
        )}
      </div>
      <Avatar assigneeId={t.assignee} size={28} />
      <span title={t.notes?.trim() ? "A des notes" : ""} style={{
        fontSize: 13, opacity: t.notes?.trim() ? 0.7 : 0,
        color: C.champagneDeep, width: 16, textAlign: "center",
      }}>📝</span>
      <QuadrantPill quadrantId={t.quadrant} />
      <FibBadge n={t.fib} size="sm" />
      <StatusPill statusId={t.status} onClick={(e) => { e.stopPropagation(); onStatusCycle(t); }} />
    </div>
  );
};
