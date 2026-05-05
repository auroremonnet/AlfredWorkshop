import { useMemo } from "react";
import { C, QUADRANTS, PHASES } from "../constants.js";
import { Avatar, FibBadge } from "./ui.jsx";

// ═══════════════════════════════════════════════════════════════
// EISENHOWER MATRIX VIEW
// ═══════════════════════════════════════════════════════════════
export const EisenhowerView = ({ tickets, onTicketClick }) => {
  const grouped = useMemo(() => {
    return QUADRANTS.reduce((acc, q) => ({ ...acc, [q.id]: tickets.filter((t) => t.quadrant === q.id) }), {});
  }, [tickets]);

  return (
    <div>
      <div style={{ marginBottom: 16, padding: "16px 20px", background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 8 }}>
        <div style={{ color: C.encre, fontSize: 16, fontWeight: 700, fontFamily: "'Georgia', serif", marginBottom: 4 }}>Matrice d'Eisenhower</div>
        <div style={{ color: C.textMuted, fontSize: 12 }}>Classement par urgence et importance — clique sur un ticket pour le modifier</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {QUADRANTS.map((q) => {
          const list = grouped[q.id] || [];
          return (
            <div key={q.id} style={{
              background: C.bgPanel, border: `1px solid ${q.color}30`, borderTop: `3px solid ${q.color}`,
              borderRadius: 10, padding: 16, minHeight: 200,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 18 }}>{q.emoji}</span>
                <div style={{ color: q.color, fontWeight: 800, fontSize: 14, fontFamily: "'Georgia', serif" }}>{q.label}</div>
                <div style={{ flex: 1 }} />
                <span style={{
                  background: `${q.color}15`, color: q.color, border: `1px solid ${q.color}40`,
                  padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                }}>{list.length}</span>
              </div>
              <div style={{ color: C.textMuted, fontSize: 11, marginBottom: 14, fontStyle: "italic" }}>{q.desc}</div>

              {list.length === 0 ? (
                <div style={{ color: C.textDim, fontSize: 12, textAlign: "center", padding: 20, opacity: 0.6 }}>Aucun ticket</div>
              ) : (
                list.map((t) => {
                  const phase = PHASES.find((p) => p.id === t.phase);
                  return (
                    <div key={t.id} onClick={() => onTicketClick(t)} style={{
                      padding: "10px 12px", background: C.bgSubtle, border: `1px solid ${C.borderSubtle}`,
                      borderRadius: 6, cursor: "pointer", marginBottom: 6, transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = q.color + "60"; e.currentTarget.style.background = C.bgHover; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.borderSubtle; e.currentTarget.style.background = C.bgSubtle; }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ color: C.champagneDeep, fontSize: 10, fontWeight: 700, fontFamily: "'Georgia', serif" }}>{t.id}</span>
                        {phase && <span style={{ color: phase.color, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", padding: "1px 5px", background: `${phase.color}12`, borderRadius: 3 }}>{phase.short}</span>}
                        <div style={{ flex: 1 }} />
                        <Avatar assigneeId={t.assignee} size={20} />
                        <FibBadge n={t.fib} size="sm" />
                      </div>
                      <div style={{ color: C.text, fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{t.title}</div>
                    </div>
                  );
                })
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
