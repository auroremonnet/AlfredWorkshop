import { useState, useEffect } from "react";
import { C, inputStyle, lblStyle, todayISO, mondayOf, formatDateLong } from "../../constants.js";
import { usePersistedState } from "../../hooks/usePersistedState.js";
import { Btn } from "../../components/ui.jsx";

const EMPTY = { id: null, weekOf: "", progress: "", blockers: "", nextPriorities: "" };

// ═══════════════════════════════════════════════════════════════
// MODALE — création/édition d'une weekly review
// ═══════════════════════════════════════════════════════════════
const ReviewModal = ({ review, onClose, onSave }) => {
  const [r, setR] = useState(review);
  useEffect(() => setR(review), [review]);
  if (!r) return null;
  const isNew = !r.id;
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
          {isNew ? "Nouvelle weekly review" : "Éditer la review"}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: 10, alignItems: "center", marginBottom: 14 }}>
          <label style={lblStyle}>Semaine du (lundi)</label>
          <input type="date" value={r.weekOf} onChange={(e) => setR({ ...r, weekOf: e.target.value })} style={inputStyle} />
        </div>

        <label style={{ ...lblStyle, marginBottom: 6, display: "block" }}>✅ Ce qui a avancé</label>
        <textarea value={r.progress} onChange={(e) => setR({ ...r, progress: e.target.value })}
          placeholder="Tickets terminés, milestones atteintes, succès."
          style={{ ...inputStyle, minHeight: 80, resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }} />

        <label style={{ ...lblStyle, marginTop: 12, marginBottom: 6, display: "block" }}>🚧 Ce qui bloque</label>
        <textarea value={r.blockers} onChange={(e) => setR({ ...r, blockers: e.target.value })}
          placeholder="Blocages, dépendances en attente, problèmes techniques."
          style={{ ...inputStyle, minHeight: 80, resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }} />

        <label style={{ ...lblStyle, marginTop: 12, marginBottom: 6, display: "block" }}>🎯 Priorités semaine prochaine</label>
        <textarea value={r.nextPriorities} onChange={(e) => setR({ ...r, nextPriorities: e.target.value })}
          placeholder="Les 2-3 chantiers qui doivent avancer la semaine prochaine."
          style={{ ...inputStyle, minHeight: 80, resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }} />

        <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "flex-end" }}>
          <Btn variant="secondary" onClick={onClose}>Annuler</Btn>
          <Btn variant="primary" onClick={() => { onSave(r); onClose(); }}>Sauvegarder</Btn>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// CARD — review unique
// ═══════════════════════════════════════════════════════════════
const ReviewCard = ({ review, onEdit, onDelete }) => (
  <div style={{
    background: C.bgPanel, border: `1px solid ${C.borderSubtle}`,
    borderRadius: 8, padding: "16px 20px", marginBottom: 10,
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
      <span style={{ color: C.encre, fontSize: 15, fontWeight: 700, fontFamily: "'Georgia', serif" }}>
        Semaine du {formatDateLong(review.weekOf)}
      </span>
      <div style={{ flex: 1 }} />
      <Btn variant="ghost" size="sm" onClick={onEdit}>✎</Btn>
      <Btn variant="ghost" size="sm" onClick={onDelete}>🗑</Btn>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
      <Section title="✅ Avancées" value={review.progress} accent={C.emeraude} />
      <Section title="🚧 Blocages" value={review.blockers} accent="#C73E47" />
      <Section title="🎯 Priorités" value={review.nextPriorities} accent={C.champagneDeep} />
    </div>
  </div>
);

const Section = ({ title, value, accent }) => (
  <div style={{ background: C.bgSubtle, border: `1px solid ${C.borderSubtle}`, borderTop: `2px solid ${accent}`, borderRadius: 6, padding: "10px 12px" }}>
    <div style={{ color: accent, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{title}</div>
    <div style={{ color: C.text, fontSize: 12, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{value || <span style={{ color: C.textDim, fontStyle: "italic" }}>—</span>}</div>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// WEEKLY REVIEWS — section principale
// ═══════════════════════════════════════════════════════════════
export default function WeeklyReviews() {
  const [reviews, setReviews] = usePersistedState("alfred-reviews-v1", []);
  const [editing, setEditing] = useState(null);

  const sorted = [...reviews].sort((a, b) => (b.weekOf || "").localeCompare(a.weekOf || ""));

  const saveReview = (r) => {
    if (!r.id) {
      setReviews((prev) => [...prev, { ...r, id: `wr-${Date.now()}` }]);
    } else {
      setReviews((prev) => prev.map((x) => (x.id === r.id ? r : x)));
    }
  };

  const deleteReview = (id) => {
    if (confirm("Supprimer cette weekly review ?")) {
      setReviews((prev) => prev.filter((r) => r.id !== id));
    }
  };

  return (
    <section style={{ marginBottom: 32 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <h2 style={{ color: C.encre, fontSize: 18, fontWeight: 700, fontFamily: "'Georgia', serif", margin: 0 }}>🗓 Weekly reviews</h2>
        <span style={{ color: C.textDim, fontSize: 12 }}>{reviews.length}</span>
        <div style={{ flex: 1 }} />
        <Btn variant="champagne" size="sm" onClick={() => setEditing({ ...EMPTY, weekOf: mondayOf(todayISO()) })}>+ Nouvelle review</Btn>
      </div>

      {sorted.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: C.textDim, background: C.bgPanel, border: `1px solid ${C.borderSubtle}`, borderRadius: 8 }}>
          Aucune review pour le moment.
        </div>
      ) : (
        sorted.map((r) => (
          <ReviewCard key={r.id} review={r} onEdit={() => setEditing(r)} onDelete={() => deleteReview(r.id)} />
        ))
      )}

      {editing && <ReviewModal review={editing} onClose={() => setEditing(null)} onSave={saveReview} />}
    </section>
  );
}
