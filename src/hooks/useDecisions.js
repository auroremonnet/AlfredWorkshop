import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../lib/supabase.js";
import { fromDb, toDb } from "../lib/decisionMapping.js";

// ═══════════════════════════════════════════════════════════════
// useDecisions — source unique de vérité pour le journal de
// décisions, branché sur Supabase (table public.decisions).
//
// La FK ticket_id est un UUID vers tickets.id. Le hook reçoit la
// liste des tickets en argument (depuis le shell, qui a déjà fetched
// via useTickets) et résout ticket_code ↔ UUID via une lookup
// locale, sans roundtrip réseau supplémentaire.
//
// Au fetch : nested select `tickets(ticket_code)` ramène le code
// directement, donc pas de lookup nécessaire à l'affichage.
//
// Si un ticket lié est supprimé (ON DELETE SET NULL côté DB), la
// décision survit avec ticketId="" → l'UI ne montrera pas le badge.
// ═══════════════════════════════════════════════════════════════

const NETWORK_HINTS = ["Failed to fetch", "NetworkError", "network", "offline"];

const isNetworkError = (e) => {
  const msg = (e?.message || e?.toString() || "").toLowerCase();
  return NETWORK_HINTS.some((h) => msg.includes(h.toLowerCase()));
};

export function useDecisions(tickets) {
  const [decisions, setDecisions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Map ticket_code → UUID, recalculée quand tickets change.
  // Permet de résoudre la FK ticket_id sans requête supplémentaire.
  const ticketCodeToUuid = useMemo(() => {
    const map = new Map();
    if (tickets) {
      for (const t of tickets) {
        if (t.id && t.dbId) map.set(t.id, t.dbId);
      }
    }
    return map;
  }, [tickets]);

  const reportError = useCallback((dbErr, fallbackMessage) => {
    console.error("[useDecisions]", fallbackMessage, dbErr);
    setError(isNetworkError(dbErr) ? "Connexion perdue. Vérifie ton réseau." : fallbackMessage);
  }, []);

  const fetchDecisions = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: dbErr } = await supabase
      .from("decisions")
      .select("*, tickets(ticket_code)")
      .order("date", { ascending: false });
    if (dbErr) {
      reportError(dbErr, "Impossible de charger les décisions. Réessaie.");
      setLoading(false);
      return;
    }
    setDecisions(data.map(fromDb));
    setLoading(false);
  }, [reportError]);

  useEffect(() => {
    fetchDecisions();
  }, [fetchDecisions]);

  // ─── ADD ──────────────────────────────────────────────────────
  // INSERT non-optimiste pour récupérer l'UUID de la row créée.
  const addDecision = useCallback(async (decision) => {
    const ticketUuid = decision.ticketId ? (ticketCodeToUuid.get(decision.ticketId) ?? null) : null;
    const { data: created, error: dbErr } = await supabase
      .from("decisions")
      .insert(toDb(decision, ticketUuid))
      .select("*, tickets(ticket_code)")
      .single();
    if (dbErr) {
      reportError(dbErr, "Impossible de créer la décision. Réessaie.");
      return;
    }
    setDecisions((prev) => [fromDb(created), ...(prev || [])]);
  }, [ticketCodeToUuid, reportError]);

  // ─── UPDATE ───────────────────────────────────────────────────
  const updateDecision = useCallback(async (decision) => {
    const previous = decisions;
    setDecisions((prev) => prev.map((d) => (d.id === decision.id ? decision : d)));
    const ticketUuid = decision.ticketId ? (ticketCodeToUuid.get(decision.ticketId) ?? null) : null;
    const { error: dbErr } = await supabase
      .from("decisions")
      .update(toDb(decision, ticketUuid))
      .eq("id", decision.id);
    if (dbErr) {
      setDecisions(previous);
      reportError(dbErr, "Impossible d'enregistrer la décision. Réessaie.");
    }
  }, [decisions, ticketCodeToUuid, reportError]);

  // ─── DELETE ───────────────────────────────────────────────────
  const deleteDecision = useCallback(async (id) => {
    const previous = decisions;
    setDecisions((prev) => prev.filter((d) => d.id !== id));
    const { error: dbErr } = await supabase.from("decisions").delete().eq("id", id);
    if (dbErr) {
      setDecisions(previous);
      reportError(dbErr, "Impossible de supprimer la décision. Réessaie.");
    }
  }, [decisions, reportError]);

  const clearError = useCallback(() => setError(null), []);

  return {
    decisions,
    loading,
    error,
    addDecision,
    updateDecision,
    deleteDecision,
    refetch: fetchDecisions,
    clearError,
  };
}
