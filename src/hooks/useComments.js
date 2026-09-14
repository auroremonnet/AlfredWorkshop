import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase.js";
import { humanize } from "../lib/dbErrors.js";

// ═══════════════════════════════════════════════════════════════
// useComments — fil de commentaires d'un ticket (table
// public.ticket_comments, FK ticket_id → tickets.id UUID).
// Chargé à l'ouverture du ticket, rafraîchi en realtime.
// ═══════════════════════════════════════════════════════════════

const fromDb = (r) => ({
  id: r.id,
  author: r.author,
  authorEmail: r.author_email ?? "",
  body: r.body,
  createdAt: r.created_at,
});

export function useComments(ticketDbId) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!ticketDbId) { setComments([]); return; }
    setLoading(true);
    const { data, error: dbErr } = await supabase
      .from("ticket_comments")
      .select("*")
      .eq("ticket_id", ticketDbId)
      .order("created_at", { ascending: true });
    setLoading(false);
    if (dbErr) {
      console.error("[useComments]", dbErr);
      setError(humanize(dbErr, "Impossible de charger les commentaires."));
      return;
    }
    setError(null);
    setComments(data.map(fromDb));
  }, [ticketDbId]);

  useEffect(() => { load(); }, [load]);

  // Realtime ciblé sur ce ticket
  useEffect(() => {
    if (!ticketDbId) return;
    const channel = supabase
      .channel(`comments-${ticketDbId}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "ticket_comments", filter: `ticket_id=eq.${ticketDbId}` },
        () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [ticketDbId, load]);

  const addComment = useCallback(async ({ author, authorEmail, body }) => {
    const text = body.trim();
    if (!text || !ticketDbId) return false;
    const { data, error: dbErr } = await supabase
      .from("ticket_comments")
      .insert({ ticket_id: ticketDbId, author, author_email: authorEmail || null, body: text })
      .select()
      .single();
    if (dbErr) {
      console.error("[useComments]", dbErr);
      setError(humanize(dbErr, "Commentaire non envoyé. Réessaie."));
      return false;
    }
    setComments((prev) => (prev.some((c) => c.id === data.id) ? prev : [...prev, fromDb(data)]));
    return true;
  }, [ticketDbId]);

  const deleteComment = useCallback(async (id) => {
    const previous = comments;
    setComments((prev) => prev.filter((c) => c.id !== id));
    const { error: dbErr } = await supabase.from("ticket_comments").delete().eq("id", id);
    if (dbErr) {
      setComments(previous);
      setError(humanize(dbErr, "Suppression impossible."));
    }
  }, [comments]);

  return { comments, loading, error, addComment, deleteComment };
}
