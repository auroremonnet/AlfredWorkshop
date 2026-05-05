import { useState, useEffect } from "react";
import { C, PHASES, inputStyle, lblStyle, todayISO, formatDateLong } from "../../constants.js";
import { usePersistedState } from "../../hooks/usePersistedState.js";
import { Btn } from "../../components/ui.jsx";

const EMPTY = {
  id: null, date: "", title: "", context: "",
  choice: "", alternatives: "", reason: "", ticketId: "",
};

// ═══════════════════════════════════════════════════════════════
// MODALE — création/édition d'une décision
// ═══════════════════════════════════════════════════════════════
const DecisionModal = ({ decision, tickets, onClose, onSave }) => {
  const [d, setD] = useState(decision);
  useEffect(() => setD(decision), [decision]);
  if (!d) return null;
  const isNew = !d.id;

  // Tickets groupés par phase pour le select
  const ticketsByPhase = PHASES.map((ph) => ({
    phase: ph,
    list: tickets.filter((t) => t.phase === ph.id),
  })).filter((g) => g.list.length > 0);

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(15,27,45,0.45)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: C.bgPanel, border: `1px solid ${C.borderStrong}`, borderRadius: 12,
        width: "100%", maxWidth: 640, maxHeight: "92vh", overflowY: "auto", padding: "24px 28px",
        boxShadow: `0 20px 60px rgba(15,27,45,0.25), 0 0 0 1px ${C.champagne}30`,
      }}>
        <div style={{ color: C.encre, fontSize: 18, fontWeight: 700, fontFamily: "'Georgia', serif", marginBottom: 16 }}>
          {isNew ? "Nouvelle décision" : "Éditer la décision"}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: 10, alignItems: "start", marginBottom: 14 }}>
          <label style={lblStyle}>Date</label>
          <input type="date" value={d.date} onChange={(e) => setD({ ...d, date: e.target.value })} style={inputStyle} />

          <label style={lblStyle}>Titre</label>
          <input value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} placeholder="Ex: Choix de l'agrégateur DSP2" style={inputStyle} />

          <label style={lblStyle}>Ticket associé</label>
          <select value={d.ticketId || ""} onChange={(e) => setD({ ...d, ticketId: e.target.value })} style={inputStyle}>
            <option value="">— Aucun —</option>
            {ticketsByPhase.map((g) => (
              <optgroup key={g.phase.id} label={g.phase.short}>
                {g.list.map((t) => (
                  <option key={t.id} value={t.id}>{t.id} — {t.title.slice(0, 60)}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <label style={{ ...lblStyle, marginBottom: 6, display: "block" }}>Contexte</label>
        <textarea value={d.context} onChange={(e) => setD({ ...d, context: e.target.value })}
          placeholder="Pourquoi cette décision se pose ? Quelle situation ?"
          style={{ ...inputStyle, minHeight: 70, resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }} />

        <label style={{ ...lblStyle, marginTop: 12, marginBottom: 6, display: "block" }}>Choix retenu</label>
        <textarea value={d.choice} onChange={(e) => setD({ ...d, choice: e.target.value })}
          placeholder="Ce qu'on a décidé de faire."
          style={{ ...inputStyle, minHeight: 60, resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }} />

        <label style={{ ...lblStyle, marginTop: 12, marginBottom: 6, display: "block" }}>Alternatives considérées</label>
        <textarea value={d.alternatives} onChange={(e) => setD({ ...d, alternatives: e.target.value })}
          placeholder="Les autres options qu'on aurait pu prendre."
          style={{ ...inputStyle, minHeight: 60, resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }} />

        <label style={{ ...lblStyle, marginTop: 12, marginBottom: 6, display: "block" }}>Raison</label>
        <textarea value={d.reason} onChange={(e) => setD({ ...d, reason: e.target.value })}
          placeholder="Pourquoi ce choix plutôt qu'un autre."
          style={{ ...inputStyle, minHeight: 60, resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }} />

        <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "flex-end" }}>
          <Btn variant="secondary" onClick={onClose}>Annuler</Btn>
          <Btn variant="primary" onClick={() => { onSave(d); onClose(); }}>Sauvegarder</Btn>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// CARD — décision unique
// ═══════════════════════════════════════════════════════════════
const DecisionCard = ({ decision, onEdit, onDelete, openTicket }) => {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = decision.context || decision.choice || decision.alternatives || decision.reason;
  return (
    <div style={{
      background: C.bgPanel, border: `1px solid ${C.borderSubtle}`,
      borderRadius: 8, padding: "14px 18px", marginBottom: 8,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{
          background: `${C.champagne}20`, color: C.champagneDeep, border: `1px solid ${C.champagne}50`,
          padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, fontFamily: "'Georgia', serif",
        }}>{formatDateLong(decision.date)}</span>
        <span style={{ color: C.encre, fontSize: 14, fontWeight: 700, flex: 1, minWidth: 0 }}>{decision.title || "Sans titre"}</span>
        {decision.ticketId && (
          <button onClick={() => openTicket(decision.ticketId)} style={{
            background: `${C.encre}10`, color: C.encre, border: `1px solid ${C.borderStrong}`,
            padding: "3px 10px", borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: "pointer",
            fontFamily: "'Georgia', serif",
          }}>→ {decision.ticketId}</button>
        )}
        <Btn variant="ghost" size="sm" onClick={() => setExpanded((x) => !x)}>{expanded ? "▴" : "▾"}</Btn>
        <Btn variant="ghost" size="sm" onClick={onEdit}>✎</Btn>
        <Btn variant="ghost" size="sm" onClick={onDelete}>🗑</Btn>
      </div>

      {expanded && hasDetails && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.borderSubtle}`, display: "grid", gap: 10 }}>
          {decision.context && <Field label="Contexte" value={decision.context} />}
          {decision.choice && <Field label="Choix retenu" value={decision.choice} accent={C.emeraude} />}
          {decision.alternatives && <Field label="Alternatives considérées" value={decision.alternatives} />}
          {decision.reason && <Field label="Raison" value={decision.reason} />}
        </div>
      )}
    </div>
  );
};

const Field = ({ label, value, accent = C.textMuted }) => (
  <div>
    <div style={{ color: accent, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>{label}</div>
    <div style={{ color: C.text, fontSize: 13, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{value}</div>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// DECISION LOG — section principale
// ═══════════════════════════════════════════════════════════════
export default function DecisionLog({ tickets, openTicket }) {
  const [decisions, setDecisions] = usePersistedState("alfred-decisions-v1", []);
  const [editing, setEditing] = useState(null);

  const sorted = [...decisions].sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  const saveDecision = (d) => {
    if (!d.id) {
      setDecisions((prev) => [...prev, { ...d, id: `dec-${Date.now()}` }]);
    } else {
      setDecisions((prev) => prev.map((x) => (x.id === d.id ? d : x)));
    }
  };

  const deleteDecision = (id) => {
    if (confirm("Supprimer cette décision ?")) {
      setDecisions((prev) => prev.filter((d) => d.id !== id));
    }
  };

  return (
    <section style={{ marginBottom: 32 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <h2 style={{ color: C.encre, fontSize: 18, fontWeight: 700, fontFamily: "'Georgia', serif", margin: 0 }}>📜 Journal de décisions</h2>
        <span style={{ color: C.textDim, fontSize: 12 }}>{decisions.length}</span>
        <div style={{ flex: 1 }} />
        <Btn variant="champagne" size="sm" onClick={() => setEditing({ ...EMPTY, date: todayISO() })}>+ Nouvelle décision</Btn>
      </div>

      {sorted.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: C.textDim, background: C.bgPanel, border: `1px solid ${C.borderSubtle}`, borderRadius: 8 }}>
          Aucune décision enregistrée pour le moment.
        </div>
      ) : (
        sorted.map((d) => (
          <DecisionCard
            key={d.id}
            decision={d}
            onEdit={() => setEditing(d)}
            onDelete={() => deleteDecision(d.id)}
            openTicket={openTicket}
          />
        ))
      )}

      {editing && (
        <DecisionModal
          decision={editing}
          tickets={tickets}
          onClose={() => setEditing(null)}
          onSave={saveDecision}
        />
      )}
    </section>
  );
}
