import { useState, useEffect } from "react";
import { C, PHASES, QUADRANTS, TEAM, STATUSES, FIB_VALUES, FIB_COLORS, inputStyle, lblStyle } from "../constants.js";
import { formatRange, formatDateTime } from "../lib/dates.js";
import { Btn, Avatar, Modal } from "./ui.jsx";
import { Comments } from "./Comments.jsx";

// ═══════════════════════════════════════════════════════════════
// TICKET MODAL — édition complète + sprint + commentaires
//
// L'état local n'est réinitialisé que si on change de ticket (id),
// pour que les mises à jour realtime des autres membres n'effacent
// pas une saisie en cours.
// ═══════════════════════════════════════════════════════════════
export const TicketModal = ({ ticket, sprints = [], me, userEmail, onClose, onSave, onDelete }) => {
  const [t, setT] = useState(ticket);
  // Champs modifiés localement : à l'enregistrement, on les applique
  // sur la version la plus fraîche du ticket (pas d'écrasement des
  // changements faits entre-temps par un autre membre).
  const [changes, setChanges] = useState({});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setT(ticket); setChanges({}); }, [ticket?.id]);
  const edit = (patch) => {
    setT((prev) => ({ ...prev, ...patch }));
    setChanges((prev) => ({ ...prev, ...patch }));
  };
  const touched = Object.keys(changes).length > 0;

  // Récupère le dbId dès que l'INSERT d'un nouveau ticket est confirmé
  useEffect(() => {
    if (ticket?.dbId && t && !t.dbId) setT((prev) => ({ ...prev, dbId: ticket.dbId }));
  }, [ticket?.dbId, t]);

  if (!t) return null;
  const phase = PHASES.find((p) => p.id === t.phase);
  const selectableSprints = sprints.filter((s) => s.status !== "closed" || s.id === t.sprintId);

  const save = () => { if (touched) onSave({ ...ticket, ...changes }); onClose(); };
  const close = () => {
    if (touched && !confirm("Fermer sans enregistrer les modifications ?")) return;
    onClose();
  };

  return (
    <Modal onClose={close} maxWidth={760}>
      <div style={{ padding: "18px 28px", borderBottom: `1px solid ${C.borderSubtle}`, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{ color: C.champagneDeep, fontSize: 12, fontWeight: 700, fontFamily: "'Georgia', serif", letterSpacing: "0.1em" }}>{t.id}</span>
        {phase && (
          <span style={{ color: phase.color, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", padding: "3px 8px", background: `${phase.color}15`, borderRadius: 4 }}>
            {phase.short}
          </span>
        )}
        {t.doneAt && t.status === "done" && (
          <span style={{ color: C.emeraude, fontSize: 11, fontWeight: 600 }}>✓ Terminé le {formatDateTime(t.doneAt)}</span>
        )}
        <div style={{ flex: 1 }} />
        <Btn variant="ghost" size="sm" onClick={close}>✕ Fermer</Btn>
      </div>

      <div style={{ padding: "22px 28px" }}>
        <input
          value={t.title}
          onChange={(e) => edit({ title: e.target.value })}
          aria-label="Titre du ticket"
          style={{
            width: "100%", background: "transparent", color: C.text, border: "none", outline: "none",
            fontSize: 22, fontWeight: 700, fontFamily: "'Georgia', serif", marginBottom: 16, letterSpacing: "-0.01em",
          }}
          placeholder="Titre du ticket"
        />

        <div style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: 12, alignItems: "start", marginBottom: 18 }}>
          <label style={lblStyle}>Statut</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {STATUSES.map((s) => (
              <button key={s.id} onClick={() => edit({ status: s.id })} style={{
                padding: "6px 10px", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700,
                background: t.status === s.id ? `${s.color}18` : "transparent",
                color: t.status === s.id ? s.color : C.textMuted,
                border: `1px solid ${t.status === s.id ? s.color : C.border}`,
              }}>{s.icon} {s.label}</button>
            ))}
          </div>

          <label style={lblStyle}>Sprint</label>
          <select
            value={t.sprintId || ""}
            onChange={(e) => edit({ sprintId: e.target.value || null })}
            style={inputStyle}
          >
            <option value="">Backlog (hors sprint)</option>
            {selectableSprints.map((s) => (
              <option key={s.id} value={s.id}>
                {s.status === "active" ? "● " : s.status === "closed" ? "✓ " : ""}{s.name} — {formatRange(s.startDate, s.endDate)}
              </option>
            ))}
          </select>

          <label style={lblStyle}>Assigné à</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {TEAM.map((m) => (
              <button key={m.id} onClick={() => edit({ assignee: m.id })} title={m.role} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "4px 10px 4px 4px", borderRadius: 99, cursor: "pointer",
                background: t.assignee === m.id ? `${m.color}15` : "transparent",
                border: `1px solid ${t.assignee === m.id ? m.color : C.border}`,
                fontFamily: "inherit", color: C.text, fontSize: 12, fontWeight: 600,
              }}>
                <Avatar assigneeId={m.id} size={22} />
                {m.name}
              </button>
            ))}
            {me && t.assignee !== me && (
              <Btn size="sm" variant="champagne" onClick={() => edit({ assignee: me })}>Je prends</Btn>
            )}
          </div>

          <label style={lblStyle}>Points</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {FIB_VALUES.map((n) => (
              <button key={n} onClick={() => edit({ fib: n })} style={{
                padding: "6px 10px", borderRadius: 6, cursor: "pointer", fontWeight: 800, fontFamily: "'Georgia', serif",
                background: t.fib === n ? `${FIB_COLORS[n]}25` : "transparent",
                color: t.fib === n ? FIB_COLORS[n] : C.textMuted,
                border: `1px solid ${t.fib === n ? FIB_COLORS[n] : C.border}`,
                fontSize: 14, minWidth: 36,
              }}>{n}</button>
            ))}
          </div>

          <label style={lblStyle}>Priorité</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 8 }}>
            {QUADRANTS.map((q) => (
              <button key={q.id} onClick={() => edit({ quadrant: q.id })} style={{
                padding: "9px 12px", borderRadius: 6, cursor: "pointer", textAlign: "left",
                background: t.quadrant === q.id ? `${q.color}15` : "transparent",
                color: t.quadrant === q.id ? q.color : C.textMuted,
                border: `1px solid ${t.quadrant === q.id ? q.color : C.border}`,
                fontFamily: "inherit",
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{q.emoji} {q.label}</div>
                <div style={{ fontSize: 10, opacity: 0.75 }}>{q.desc}</div>
              </button>
            ))}
          </div>

          <label style={lblStyle}>Phase</label>
          <select value={t.phase} onChange={(e) => edit({ phase: e.target.value })} style={inputStyle}>
            {PHASES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>

          <label style={lblStyle}>Dépendances</label>
          <input value={t.deps || ""} onChange={(e) => edit({ deps: e.target.value })} placeholder="Ex : T001, T015" style={inputStyle} />
        </div>

        <label style={{ ...lblStyle, marginBottom: 8, display: "block" }}>Description</label>
        <textarea
          value={t.desc}
          onChange={(e) => edit({ desc: e.target.value })}
          placeholder="Ce qui doit être fait, livrables attendus, critères de fin…"
          style={{ ...inputStyle, minHeight: 120, resize: "vertical", lineHeight: 1.6 }}
        />

        <label style={{ ...lblStyle, marginTop: 16, marginBottom: 8, display: "block" }}>📝 Notes</label>
        <textarea
          value={t.notes || ""}
          onChange={(e) => edit({ notes: e.target.value })}
          placeholder="Décisions prises, blocages, contexte, liens…"
          style={{ ...inputStyle, minHeight: 80, resize: "vertical", lineHeight: 1.6 }}
        />

        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "space-between", flexWrap: "wrap" }}>
          <Btn variant="danger" onClick={() => { if (confirm(`Supprimer ${t.id} ? (commentaires inclus)`)) { onDelete(t.id); onClose(); } }}>🗑 Supprimer</Btn>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="secondary" onClick={close}>Annuler</Btn>
            <Btn variant="primary" onClick={save} disabled={!t.title.trim()}>Enregistrer</Btn>
          </div>
        </div>

        <Comments ticketDbId={t.dbId} me={me} userEmail={userEmail} />
      </div>
    </Modal>
  );
};
