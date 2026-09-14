import { useState } from "react";
import { C, inputStyle, lblStyle, memberById } from "../constants.js";
import { formatDateTime } from "../lib/dates.js";
import { useComments } from "../hooks/useComments.js";
import { Avatar, Btn } from "./ui.jsx";

// ═══════════════════════════════════════════════════════════════
// COMMENTS — fil de discussion d'un ticket (façon Jira)
// Signé avec l'identité « Je suis » ; Ctrl/⌘ + Entrée pour envoyer.
// ═══════════════════════════════════════════════════════════════
export const Comments = ({ ticketDbId, me, userEmail }) => {
  const { comments, loading, error, addComment, deleteComment } = useComments(ticketDbId);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  if (!ticketDbId) {
    return (
      <div style={{ color: C.textDim, fontSize: 12, fontStyle: "italic", marginTop: 18 }}>
        Les commentaires s'activent une fois le ticket enregistré.
      </div>
    );
  }

  const author = me ? memberById(me).name : null;
  const send = async () => {
    if (!author || !draft.trim()) return;
    setSending(true);
    const ok = await addComment({ author, authorEmail: userEmail, body: draft });
    setSending(false);
    if (ok) setDraft("");
  };

  return (
    <div style={{ marginTop: 22 }}>
      <label style={{ ...lblStyle, display: "block", marginBottom: 10 }}>
        💬 Commentaires {comments.length > 0 && `(${comments.length})`}
      </label>

      {loading && comments.length === 0 && <div style={{ color: C.textDim, fontSize: 12 }}>Chargement…</div>}
      {error && <div style={{ color: "#C73E47", fontSize: 12, marginBottom: 8 }}>{error}</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
        {comments.map((c) => {
          const authorId = c.author?.toLowerCase();
          const mine = author && c.author === author;
          return (
            <div key={c.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <Avatar assigneeId={authorId} size={26} />
              <div style={{ flex: 1, background: C.bgSubtle, border: `1px solid ${C.borderSubtle}`, borderRadius: 8, padding: "8px 12px" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 3 }}>
                  <strong style={{ fontSize: 12, color: C.text }}>{c.author}</strong>
                  <span style={{ fontSize: 11, color: C.textDim }}>{formatDateTime(c.createdAt)}</span>
                  <div style={{ flex: 1 }} />
                  {mine && (
                    <button onClick={() => { if (confirm("Supprimer ce commentaire ?")) deleteComment(c.id); }}
                      aria-label="Supprimer le commentaire"
                      style={{ border: "none", background: "transparent", color: C.textDim, cursor: "pointer", fontSize: 12 }}>✕</button>
                  )}
                </div>
                <div style={{ fontSize: 13, color: C.text, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{c.body}</div>
              </div>
            </div>
          );
        })}
      </div>

      {author ? (
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <Avatar assigneeId={me} size={26} />
          <div style={{ flex: 1 }}>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); send(); } }}
              placeholder="Ajouter un commentaire… (Ctrl + Entrée pour envoyer)"
              style={{ ...inputStyle, minHeight: 64, resize: "vertical", lineHeight: 1.5 }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
              <Btn size="sm" variant="primary" onClick={send} disabled={sending || !draft.trim()}>
                {sending ? "Envoi…" : "Commenter"}
              </Btn>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ color: C.textMuted, fontSize: 12, padding: "10px 12px", background: `${C.champagne}14`, borderRadius: 8 }}>
          Choisis qui tu es en haut à droite (« Qui es-tu ? ») pour commenter.
        </div>
      )}
    </div>
  );
};
