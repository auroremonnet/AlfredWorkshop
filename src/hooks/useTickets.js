import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase.js";
import { fromDb, toDb } from "../lib/ticketMapping.js";
import { humanize } from "../lib/dbErrors.js";
import { DEFAULT_TICKETS } from "../constants.js";

// ═══════════════════════════════════════════════════════════════
// useTickets — source unique de vérité pour les tickets, branchée
// sur Supabase (table public.tickets).
//
// Retourne :
//   { tickets, loading, error,
//     addTicket, updateTicket, deleteTicket, moveTickets,
//     resetToDefaults, refetch, silentRefetch, clearError }
//
// Mutations OPTIMISTES : UI immédiate, revert + message FR si la DB
// refuse. silentRefetch() est appelé par le realtime / retour d'onglet
// pour récupérer les changements des autres membres sans loader.
// ═══════════════════════════════════════════════════════════════

// Filtre WHERE non-vide requis par Supabase pour les DELETE en masse.
const PLACEHOLDER_UUID = "00000000-0000-0000-0000-000000000000";

export function useTickets() {
  const [tickets, setTickets] = useState(null); // null = pas encore fetched
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const ticketsRef = useRef(null);
  ticketsRef.current = tickets;

  const reportError = useCallback((dbErr, fallbackMessage) => {
    console.error("[useTickets]", fallbackMessage, dbErr);
    setError(humanize(dbErr, fallbackMessage));
  }, []);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) { setLoading(true); setError(null); }
    const { data, error: dbErr } = await supabase
      .from("tickets")
      .select("*")
      .order("ticket_code");
    if (dbErr) {
      if (!silent) reportError(dbErr, "Impossible de charger les tickets. Réessaie.");
      setLoading(false);
      return;
    }
    setTickets(data.map(fromDb));
    setLoading(false);
  }, [reportError]);

  const fetchTickets = useCallback(() => load(), [load]);
  const silentRefetch = useCallback(() => load({ silent: true }), [load]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  // ─── CRUD avec UI optimiste + revert ───────────────────────────

  // INSERT : on récupère la row créée pour avoir le dbId (UUID),
  // nécessaire aux commentaires et au journal de décisions.
  const addTicket = useCallback(async (newTicket) => {
    const previous = ticketsRef.current;
    setTickets((prev) => (prev ? [...prev, newTicket] : [newTicket]));
    const { data: created, error: dbErr } = await supabase
      .from("tickets")
      .insert(toDb(newTicket))
      .select()
      .single();
    if (dbErr) {
      setTickets(previous);
      reportError(dbErr, "Impossible de créer le ticket. Réessaie.");
      return null;
    }
    const saved = fromDb(created);
    setTickets((prev) => prev.map((t) => (t.id === saved.id ? saved : t)));
    return saved;
  }, [reportError]);

  const updateTicket = useCallback(async (ticket) => {
    const previous = ticketsRef.current;
    setTickets((prev) => prev.map((t) => (t.id === ticket.id ? { ...t, ...ticket } : t)));
    const { data: saved, error: dbErr } = await supabase
      .from("tickets")
      .update(toDb(ticket))
      .eq("ticket_code", ticket.id)
      .select()
      .single();
    if (dbErr) {
      setTickets(previous);
      reportError(dbErr, "Impossible d'enregistrer le ticket. Réessaie.");
      return;
    }
    // Récupère done_at (posé par trigger) sans attendre le realtime
    if (saved) {
      const fresh = fromDb(saved);
      setTickets((prev) => prev.map((t) => (t.id === fresh.id ? fresh : t)));
    }
  }, [reportError]);

  const deleteTicket = useCallback(async (id) => {
    const previous = ticketsRef.current;
    setTickets((prev) => prev.filter((t) => t.id !== id));
    const { error: dbErr } = await supabase.from("tickets").delete().eq("ticket_code", id);
    if (dbErr) {
      setTickets(previous);
      reportError(dbErr, "Impossible de supprimer le ticket. Réessaie.");
    }
  }, [reportError]);

  // Déplace plusieurs tickets vers un sprint (ou le backlog si null).
  const moveTickets = useCallback(async (ticketCodes, sprintId) => {
    if (!ticketCodes.length) return true;
    const previous = ticketsRef.current;
    const set = new Set(ticketCodes);
    setTickets((prev) => prev.map((t) => (set.has(t.id) ? { ...t, sprintId: sprintId ?? null } : t)));
    const { error: dbErr } = await supabase
      .from("tickets")
      .update({ sprint_id: sprintId ?? null })
      .in("ticket_code", ticketCodes);
    if (dbErr) {
      setTickets(previous);
      reportError(dbErr, "Impossible de déplacer les tickets. Réessaie.");
      return false;
    }
    return true;
  }, [reportError]);

  // Reset : DELETE all + INSERT all DEFAULT_TICKETS.
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
    const payload = DEFAULT_TICKETS.map((t) => toDb({ ...t, sprintId: null }));
    const { error: insErr } = await supabase.from("tickets").insert(payload);
    if (insErr) reportError(insErr, "Réinitialisation incomplète. Vérifie l'état des tickets.");
    await load();
  }, [reportError, load]);

  const clearError = useCallback(() => setError(null), []);

  return {
    tickets,
    loading,
    error,
    addTicket,
    updateTicket,
    deleteTicket,
    moveTickets,
    resetToDefaults,
    refetch: fetchTickets,
    silentRefetch,
    clearError,
  };
}
