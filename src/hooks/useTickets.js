import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase.js";
import { fromDb, toDb } from "../lib/ticketMapping.js";
import { DEFAULT_TICKETS } from "../constants.js";

// ═══════════════════════════════════════════════════════════════
// useTickets — source unique de vérité pour les tickets, branchée
// sur Supabase (table public.tickets).
//
// Retourne :
//   { tickets, loading, error,
//     addTicket, updateTicket, deleteTicket, resetToDefaults,
//     refetch, clearError }
//
// Le state est mis à jour de façon OPTIMISTE sur les mutations :
// l'UI est immédiate, et on revert + affiche un message en cas
// d'erreur DB. Les messages d'erreur exposés à l'utilisateur sont
// en français ; le détail technique est loggé via console.error.
// ═══════════════════════════════════════════════════════════════

const NETWORK_HINTS = ["Failed to fetch", "NetworkError", "network", "offline"];

const isNetworkError = (e) => {
  const msg = (e?.message || e?.toString() || "").toLowerCase();
  return NETWORK_HINTS.some((h) => msg.includes(h.toLowerCase()));
};

// Filtre WHERE non-vide requis par Supabase pour les DELETE en masse.
// Cet UUID factice ne matchera jamais une vraie ligne → DELETE full-table.
const PLACEHOLDER_UUID = "00000000-0000-0000-0000-000000000000";

export function useTickets() {
  const [tickets, setTickets] = useState(null); // null = pas encore fetched
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reportError = useCallback((dbErr, fallbackMessage) => {
    console.error("[useTickets]", fallbackMessage, dbErr);
    setError(isNetworkError(dbErr) ? "Connexion perdue. Vérifie ton réseau." : fallbackMessage);
  }, []);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: dbErr } = await supabase
      .from("tickets")
      .select("*")
      .order("ticket_code");
    if (dbErr) {
      reportError(dbErr, "Impossible de charger les tickets. Réessaie.");
      setLoading(false);
      return;
    }
    setTickets(data.map(fromDb));
    setLoading(false);
  }, [reportError]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // ─── CRUD avec UI optimiste + revert ───────────────────────────

  const addTicket = useCallback(async (newTicket) => {
    const previous = tickets;
    setTickets((prev) => (prev ? [...prev, newTicket] : [newTicket]));
    const { error: dbErr } = await supabase.from("tickets").insert(toDb(newTicket));
    if (dbErr) {
      setTickets(previous);
      reportError(dbErr, "Impossible de créer le ticket. Réessaie.");
    }
  }, [tickets, reportError]);

  const updateTicket = useCallback(async (ticket) => {
    const previous = tickets;
    setTickets((prev) => prev.map((t) => (t.id === ticket.id ? ticket : t)));
    const { error: dbErr } = await supabase
      .from("tickets")
      .update(toDb(ticket))
      .eq("ticket_code", ticket.id);
    if (dbErr) {
      setTickets(previous);
      reportError(dbErr, "Impossible d'enregistrer le ticket. Réessaie.");
    }
  }, [tickets, reportError]);

  const deleteTicket = useCallback(async (id) => {
    const previous = tickets;
    setTickets((prev) => prev.filter((t) => t.id !== id));
    const { error: dbErr } = await supabase.from("tickets").delete().eq("ticket_code", id);
    if (dbErr) {
      setTickets(previous);
      reportError(dbErr, "Impossible de supprimer le ticket. Réessaie.");
    }
  }, [tickets, reportError]);

  // Reset : DELETE all + INSERT all DEFAULT_TICKETS.
  // Pas de transaction client-side (Supabase JS SDK n'en expose pas) — si
  // l'INSERT échoue après un DELETE réussi, on refetch pour resynchroniser
  // le state local avec l'état réel (potentiellement vide).
  const resetToDefaults = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { error: delErr } = await supabase
      .from("tickets")
      .delete()
      .neq("id", PLACEHOLDER_UUID);
    if (delErr) {
      reportError(delErr, "Impossible de réinitialiser les tickets. Réessaie.");
      setLoading(false);
      return;
    }
    const payload = DEFAULT_TICKETS.map(toDb);
    const { error: insErr } = await supabase.from("tickets").insert(payload);
    if (insErr) {
      reportError(insErr, "Réinitialisation incomplète. Vérifie l'état des tickets.");
      // DELETE a réussi mais INSERT a échoué → DB potentiellement vide.
      // On refetch pour refléter l'état réel.
      await fetchTickets();
      return;
    }
    setTickets(DEFAULT_TICKETS.map((t) => ({ ...t, notes: t.notes ?? "" })));
    setLoading(false);
  }, [reportError, fetchTickets]);

  const clearError = useCallback(() => setError(null), []);

  return {
    tickets,
    loading,
    error,
    addTicket,
    updateTicket,
    deleteTicket,
    resetToDefaults,
    refetch: fetchTickets,
    clearError,
  };
}
