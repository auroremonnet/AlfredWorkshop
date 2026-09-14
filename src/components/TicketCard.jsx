import { C, PHASES, QUADRANTS } from "../constants.js";
import { Avatar, FibBadge } from "./ui.jsx";

// ═══════════════════════════════════════════════════════════════
// TICKET CARD — carte du board Kanban (draggable)
// Le drag transporte le ticket_code dans dataTransfer "text/plain".
// ═══════════════════════════════════════════════════════════════
export const TicketCard = ({ t, onOpen, dragging, onDragStart, onDragEnd, highlight }) => {
  const phase = PHASES.find((p) => p.id === t.phase);
  const q = QUADRANTS.find((x) => x.id === t.quadrant);
  const depsCount = (t.deps || "").split(",").map((s) => s.trim()).filter(Boolean).length;

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", t.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart?.(t.id);
      }}
      onDragEnd={() => onDragEnd?.()}
      onClick={() => onOpen(t.id)}
      onKeyDown={(e) => { if (e.key === "Enter") onOpen(t.id); }}
      tabIndex={0}
      role="button"
      aria-label={`${t.id} ${t.title}`}
      style={{
        background: C.bgCard, borderRadius: 8, padding: "10px 12px", cursor: "grab",
        border: `1px solid ${highlight ? C.champagne : C.border}`,
        borderLeft: `3px solid ${q?.color || C.border}`,
        opacity: dragging ? 0.4 : 1,
        boxShadow: "0 1px 2px rgba(15,27,45,0.05)",
      }}
    >
      <div style={{ color: C.text, fontSize: 13, fontWeight: 600, lineHeight: 1.35, marginBottom: 8 }}>{t.title}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <span style={{ color: C.champagneDeep, fontSize: 11, fontWeight: 700, fontFamily: "'Georgia', serif" }}>{t.id}</span>
        {phase && (
          <span title={phase.label} style={{
            color: phase.color, fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em",
            padding: "1px 5px", background: `${phase.color}14`, borderRadius: 3,
          }}>{phase.short.split(" ")[0]}</span>
        )}
        {q && <span title={q.label} style={{ fontSize: 11 }}>{q.emoji}</span>}
        {t.notes?.trim() && <span title="A des notes" style={{ fontSize: 11, opacity: 0.7 }}>📝</span>}
        {depsCount > 0 && <span title={`Dépend de ${t.deps}`} style={{ fontSize: 10, color: C.textDim }}>⛓ {depsCount}</span>}
        <div style={{ flex: 1 }} />
        <FibBadge n={t.fib} size="sm" />
        <Avatar assigneeId={t.assignee} size={22} />
      </div>
    </div>
  );
};
