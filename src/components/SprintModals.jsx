import { useState } from "react";
import { C, inputStyle, lblStyle } from "../constants.js";
import { formatRange, daysBetween } from "../lib/dates.js";
import { Btn, Modal } from "./ui.jsx";

// ═══════════════════════════════════════════════════════════════
// SPRINT MODAL — créer / éditer un sprint
// ═══════════════════════════════════════════════════════════════
export const SprintModal = ({ sprint, onClose, onSave, onDelete }) => {
  const [s, setS] = useState(sprint);
  const isNew = !s.id;
  const invalid = !s.name.trim() || !s.startDate || !s.endDate || s.endDate < s.startDate;
  const length = !invalid ? daysBetween(s.startDate, s.endDate) + 1 : 0;

  return (
    <Modal onClose={onClose} maxWidth={560}>
      <div style={{ padding: "22px 26px" }}>
        <div style={{ color: C.encre, fontSize: 19, fontWeight: 700, fontFamily: "'Georgia', serif", marginBottom: 18 }}>
          {isNew ? "Nouveau sprint" : `Modifier ${sprint.name}`}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 12, alignItems: "center" }}>
          <label style={lblStyle} htmlFor="sp-name">Nom</label>
          <input id="sp-name" value={s.name} onChange={(e) => setS({ ...s, name: e.target.value })} style={inputStyle} />

          <label style={lblStyle} htmlFor="sp-start">Début</label>
          <input id="sp-start" type="date" value={s.startDate} onChange={(e) => setS({ ...s, startDate: e.target.value })} style={inputStyle} />

          <label style={lblStyle} htmlFor="sp-end">Fin</label>
          <input id="sp-end" type="date" value={s.endDate} onChange={(e) => setS({ ...s, endDate: e.target.value })} style={inputStyle} />
        </div>
        {!invalid && (
          <div style={{ color: C.textDim, fontSize: 12, margin: "8px 0 0 132px" }}>
            {formatRange(s.startDate, s.endDate)} · {length} jour{length > 1 ? "s" : ""}
          </div>
        )}

        <label style={{ ...lblStyle, display: "block", margin: "16px 0 6px" }} htmlFor="sp-goal">Objectif du sprint</label>
        <textarea id="sp-goal" value={s.goal} onChange={(e) => setS({ ...s, goal: e.target.value })}
          placeholder="Ex : boucler les 15 entretiens et trancher le go/no-go (T016)."
          style={{ ...inputStyle, minHeight: 80, resize: "vertical", lineHeight: 1.5 }} />

        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "space-between" }}>
          {!isNew && onDelete && s.status !== "active" ? (
            <Btn variant="danger" onClick={() => { if (confirm("Supprimer ce sprint ? Ses tickets repartent au backlog.")) { onDelete(s.id); onClose(); } }}>🗑 Supprimer</Btn>
          ) : <span />}
          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="secondary" onClick={onClose}>Annuler</Btn>
            <Btn variant="primary" disabled={invalid} onClick={() => { onSave(s); onClose(); }}>
              {isNew ? "Créer le sprint" : "Enregistrer"}
            </Btn>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════
// CLOSE SPRINT MODAL — bilan + destination des tickets non finis
// ═══════════════════════════════════════════════════════════════
export const CloseSprintModal = ({ sprint, tickets, sprints, reviewExists, onClose, onConfirm }) => {
  const inSprint = tickets.filter((t) => t.sprintId === sprint.id);
  const done = inSprint.filter((t) => t.status === "done");
  const left = inSprint.filter((t) => t.status !== "done");
  const pts = (list) => list.reduce((s, t) => s + (t.fib || 0), 0);
  const planned = sprints.filter((s) => s.status === "planned" && s.id !== sprint.id);

  const [moveTo, setMoveTo] = useState(planned[0]?.id || "new");
  const [createReview, setCreateReview] = useState(!reviewExists);
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    await onConfirm({ moveTo, createReview: createReview && !reviewExists });
    setBusy(false);
    onClose();
  };

  const radio = (value, label, sub) => (
    <label key={value} style={{
      display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 12px", borderRadius: 8, cursor: "pointer",
      border: `1px solid ${moveTo === value ? C.encre : C.border}`, background: moveTo === value ? C.bgSubtle : "transparent",
    }}>
      <input type="radio" name="moveTo" checked={moveTo === value} onChange={() => setMoveTo(value)} style={{ marginTop: 3 }} />
      <span>
        <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.text }}>{label}</span>
        {sub && <span style={{ display: "block", fontSize: 11, color: C.textDim, marginTop: 2 }}>{sub}</span>}
      </span>
    </label>
  );

  return (
    <Modal onClose={onClose} maxWidth={560}>
      <div style={{ padding: "22px 26px" }}>
        <div style={{ color: C.encre, fontSize: 19, fontWeight: 700, fontFamily: "'Georgia', serif" }}>Terminer {sprint.name}</div>
        <div style={{ color: C.textMuted, fontSize: 12, marginTop: 4 }}>{formatRange(sprint.startDate, sprint.endDate)}</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "18px 0" }}>
          <div style={{ padding: "12px 14px", borderRadius: 8, background: `${C.emeraude}10`, border: `1px solid ${C.emeraude}30` }}>
            <div style={{ color: C.emeraude, fontSize: 24, fontWeight: 800, fontFamily: "'Georgia', serif" }}>{done.length}</div>
            <div style={{ color: C.textMuted, fontSize: 12 }}>tickets terminés · {pts(done)} pts</div>
          </div>
          <div style={{ padding: "12px 14px", borderRadius: 8, background: C.bgSubtle, border: `1px solid ${C.border}` }}>
            <div style={{ color: C.encre, fontSize: 24, fontWeight: 800, fontFamily: "'Georgia', serif" }}>{left.length}</div>
            <div style={{ color: C.textMuted, fontSize: 12 }}>non terminés · {pts(left)} pts</div>
          </div>
        </div>

        {left.length > 0 && (
          <>
            <div style={{ ...lblStyle, paddingTop: 0, marginBottom: 8 }}>Où envoyer les {left.length} tickets non terminés ?</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {planned.map((p) => radio(p.id, p.name, formatRange(p.startDate, p.endDate)))}
              {radio("new", "Nouveau sprint la semaine suivante", "Créé automatiquement, lundi → dimanche")}
              {radio("backlog", "Backlog", "Ils seront replanifiés plus tard")}
            </div>
          </>
        )}

        <label style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 16, fontSize: 13, color: reviewExists ? C.textDim : C.text, cursor: reviewExists ? "default" : "pointer" }}>
          <input type="checkbox" checked={createReview && !reviewExists} disabled={reviewExists}
            onChange={(e) => setCreateReview(e.target.checked)} />
          {reviewExists
            ? "Une weekly review existe déjà pour cette semaine"
            : "Générer la weekly review pré-remplie (onglet Résultats)"}
        </label>

        <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "flex-end" }}>
          <Btn variant="secondary" onClick={onClose}>Annuler</Btn>
          <Btn variant="primary" onClick={handleConfirm} disabled={busy}>{busy ? "Clôture…" : "Terminer le sprint"}</Btn>
        </div>
      </div>
    </Modal>
  );
};
