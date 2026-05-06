import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase.js";
import { fromDb, toDb } from "../lib/kpiMapping.js";
import { todayISO } from "../constants.js";

// ═══════════════════════════════════════════════════════════════
// useKpis — source unique de vérité pour les KPIs business,
// branchée sur Supabase (table public.kpis + public.kpi_history).
//
// Retourne :
//   { kpis, loading, error,
//     addKpi, updateKpi, deleteKpi,
//     refetch, clearError }
//
// Spécificité : kpi_history est une table séparée. Le hook
// reconstruit la shape app (history inline) au fetch via nested
// select, et insère une ligne d'history avant chaque update si
// la value a changé.
// ═══════════════════════════════════════════════════════════════

const NETWORK_HINTS = ["Failed to fetch", "NetworkError", "network", "offline"];

const isNetworkError = (e) => {
  const msg = (e?.message || e?.toString() || "").toLowerCase();
  return NETWORK_HINTS.some((h) => msg.includes(h.toLowerCase()));
};

export function useKpis() {
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reportError = useCallback((dbErr, fallbackMessage) => {
    console.error("[useKpis]", fallbackMessage, dbErr);
    setError(isNetworkError(dbErr) ? "Connexion perdue. Vérifie ton réseau." : fallbackMessage);
  }, []);

  const fetchKpis = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: dbErr } = await supabase
      .from("kpis")
      .select("*, kpi_history(value, recorded_at)")
      .order("created_at", { ascending: true });
    if (dbErr) {
      reportError(dbErr, "Impossible de charger les KPIs. Réessaie.");
      setLoading(false);
      return;
    }
    setKpis(data.map(fromDb));
    setLoading(false);
  }, [reportError]);

  useEffect(() => {
    fetchKpis();
  }, [fetchKpis]);

  // ─── ADD ──────────────────────────────────────────────────────
  // Insert non-optimiste (la DB génère le UUID, on récupère la row
  // créée pour avoir l'id réel). Délai ~200ms acceptable.
  const addKpi = useCallback(async (newKpi) => {
    const { data: created, error: dbErr } = await supabase
      .from("kpis")
      .insert(toDb(newKpi))
      .select("*, kpi_history(value, recorded_at)")
      .single();
    if (dbErr) {
      reportError(dbErr, "Impossible de créer le KPI. Réessaie.");
      return;
    }
    setKpis((prev) => [...(prev || []), fromDb(created)]);
  }, [reportError]);

  // ─── UPDATE ───────────────────────────────────────────────────
  // Si la value change : on INSERT d'abord dans kpi_history avec
  // l'ancienne valeur (snapshot), puis on UPDATE kpis.value.
  // Optimistic UI : on push localement la nouvelle valeur ET on
  // ajoute un point dans history (date du jour) ; sur erreur on
  // revert le state local et on refetch pour resynchroniser.
  const updateKpi = useCallback(async (kpi) => {
    const previous = kpis;
    const oldKpi = previous?.find((k) => k.id === kpi.id);
    if (!oldKpi) {
      reportError(new Error("KPI introuvable"), "Impossible d'enregistrer le KPI. Réessaie.");
      return;
    }
    const valueChanged = oldKpi.value !== kpi.value;

    // Optimistic local update
    setKpis((prev) => prev.map((k) => {
      if (k.id !== kpi.id) return k;
      const newHistory = valueChanged
        ? [...k.history, { date: todayISO(), value: oldKpi.value }]
        : k.history;
      return { ...kpi, history: newHistory };
    }));

    // 1. Snapshot de l'ancienne valeur dans kpi_history (si la value a changé)
    if (valueChanged) {
      const { error: histErr } = await supabase
        .from("kpi_history")
        .insert({ kpi_id: kpi.id, value: oldKpi.value });
      if (histErr) {
        setKpis(previous);
        reportError(histErr, "Impossible de sauvegarder l'historique. Réessaie.");
        return;
      }
    }

    // 2. Update de la row kpis
    const { error: kpiErr } = await supabase
      .from("kpis")
      .update(toDb(kpi))
      .eq("id", kpi.id);
    if (kpiErr) {
      // History a peut-être déjà été inséré → refetch pour resync
      setKpis(previous);
      reportError(kpiErr, "Impossible d'enregistrer le KPI. Réessaie.");
      await fetchKpis();
    }
  }, [kpis, reportError, fetchKpis]);

  // ─── DELETE ───────────────────────────────────────────────────
  // ON DELETE CASCADE configuré côté DB : la suppression de la row
  // kpis efface automatiquement les rows kpi_history liées.
  const deleteKpi = useCallback(async (id) => {
    const previous = kpis;
    setKpis((prev) => prev.filter((k) => k.id !== id));
    const { error: dbErr } = await supabase.from("kpis").delete().eq("id", id);
    if (dbErr) {
      setKpis(previous);
      reportError(dbErr, "Impossible de supprimer le KPI. Réessaie.");
    }
  }, [kpis, reportError]);

  const clearError = useCallback(() => setError(null), []);

  return {
    kpis,
    loading,
    error,
    addKpi,
    updateKpi,
    deleteKpi,
    refetch: fetchKpis,
    clearError,
  };
}
