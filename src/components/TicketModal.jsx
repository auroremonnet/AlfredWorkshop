import { useState, useEffect } from "react";
import { C, PHASES, QUADRANTS, TEAM, STATUSES, FIB_VALUES, FIB_COLORS, inputStyle, lblStyle } from "../constants.js";
import { Btn, Avatar } from "./ui.jsx";

// ═══════════════════════════════════════════════════════════════
// TICKET MODAL (full edit — bowtie style)
// ═══════════════════════════════════════════════════════════════
export const TicketModal = ({ ticket, onClose, onSave, onDelete }) => {
  const [t, setT] = useState(ticket);
  useEffect(() => setT(ticket), [ticket]);
  if (!t) return null;
  const phase = PHASES.find((p) => p.id === t.phase);

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(15,27,45,0.45)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: C.bgPanel, border: `1px solid ${C.borderStrong}`, borderRadius: 12,
        width: "100%", maxWidth: 720, maxHeight: "92vh", overflowY: "auto",
        boxShadow: `0 20px 60px rgba(15,27,45,0.25), 0 0 0 1px ${C.champagne}30`,
      }}>
        <div style={{ padding: "20px 28px", borderBottom: `1px solid ${C.borderSubtle}`, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ color: C.champagneDeep, fontSize: 11, fontWeight: 700, fontFamily: "'Georgia', serif", letterSpacing: "0.1em" }}>{t.id}</span>
          {phase && (
            <span style={{ color: phase.color, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", padding: "3px 8px", background: `${phase.color}15`, borderRadius: 4 }}>
              {phase.short}
            </span>
          )}
          <div style={{ flex: 1 }} />
          <Btn variant="ghost" size="sm" onClick={onClose}>✕ Fermer</Btn>
        </div>

        <div style={{ padding: "24px 28px" }}>
          <input
            value={t.title}
            onChange={(e) => setT({ ...t, title: e.target.value })}
            style={{
              width: "100%", background: "transparent", color: C.text, border: "none", outline: "none",
              fontSize: 22, fontWeight: 700, fontFamily: "'Georgia', serif", marginBottom: 16, letterSpacing: "-0.01em",
            }}
            placeholder="Titre du ticket"
          />

          <div style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: 12, alignItems: "start", marginBottom: 18 }}>
            <label style={lblStyle}>Phase</label>
            <select value={t.phase} onChange={(e) => setT({ ...t, phase: e.target.value })} style={inputStyle}>
              {PHASES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>

            <label style={lblStyle}>Quadrant</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {QUADRANTS.map((q) => (
                <button key={q.id} onClick={() => setT({ ...t, quadrant: q.id })} style={{
                  padding: "10px 12px", borderRadius: 6, cursor: "pointer", textAlign: "left",
                  background: t.quadrant === q.id ? `${q.color}15` : "transparent",
                  color: t.quadrant === q.id ? q.color : C.textMuted,
                  border: `1px solid ${t.quadrant === q.id ? q.color : C.border}`,
                  transition: "all 0.15s", fontFamily: "inherit",
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{q.emoji} {q.label}</div>
                  <div style={{ fontSize: 10, opacity: 0.7 }}>{q.desc}</div>
                </button>
              ))}
            </div>

            <label style={lblStyle}>Assigné à</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {TEAM.map((m) => (
                <button key={m.id} onClick={() => setT({ ...t, assignee: m.id })} style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "5px 10px 5px 5px", borderRadius: 99, cursor: "pointer",
                  background: t.assignee === m.id ? `${m.color}15` : "transparent",
                  border: `1px solid ${t.assignee === m.id ? m.color : C.border}`,
                  fontFamily: "inherit", color: C.text, fontSize: 12, fontWeight: 600,
                  transition: "all 0.15s",
                }}>
                  <Avatar assigneeId={m.id} size={22} />
                  {m.name}
                </button>
              ))}
            </div>

            <label style={lblStyle}>Statut</label>
            <select value={t.status} onChange={(e) => setT({ ...t, status: e.target.value })} style={inputStyle}>
              {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>

            <label style={lblStyle}>Difficulté</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {FIB_VALUES.map((n) => (
                <button key={n} onClick={() => setT({ ...t, fib: n })} style={{
                  padding: "6px 10px", borderRadius: 6, cursor: "pointer", fontWeight: 800, fontFamily: "'Georgia', serif",
                  background: t.fib === n ? `${FIB_COLORS[n]}25` : "transparent",
                  color: t.fib === n ? FIB_COLORS[n] : C.textMuted,
                  border: `1px solid ${t.fib === n ? FIB_COLORS[n] : C.border}`,
                  fontSize: 14, minWidth: 36, transition: "all 0.15s",
                }}>{n}</button>
              ))}
            </div>

            <label style={lblStyle}>Dépendances</label>
            <input value={t.deps || ""} onChange={(e) => setT({ ...t, deps: e.target.value })} placeholder="Ex: T001, T015" style={inputStyle} />
          </div>

          <label style={{ ...lblStyle, marginBottom: 8, display: "block" }}>Description</label>
          <textarea
            value={t.desc}
            onChange={(e) => setT({ ...t, desc: e.target.value })}
            placeholder="Détails du ticket : ce qui doit être fait, livrables attendus, ressources, contraintes…"
            style={{ ...inputStyle, minHeight: 140, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }}
          />

          <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "space-between", flexWrap: "wrap" }}>
            <Btn variant="danger" onClick={() => { if (confirm("Supprimer ce ticket ?")) { onDelete(t.id); onClose(); } }}>🗑 Supprimer</Btn>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="secondary" onClick={onClose}>Annuler</Btn>
              <Btn variant="primary" onClick={() => { onSave(t); onClose(); }}>Sauvegarder</Btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
