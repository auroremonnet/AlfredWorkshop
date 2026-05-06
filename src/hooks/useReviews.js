import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase.js";
import { fromDb, toDb } from "../lib/reviewMapping.js";
import { formatDateLong } from "../constants.js";

// ═══════════════════════════════════════════════════════════════
// useReviews — source unique de vérité pour les weekly reviews,
// branché sur Supabase (table public.weekly_reviews).
//
// La colonne week_of a une contrainte UNIQUE en BDD (une seule
// review par semaine). Si l'utilisateur tente d'insérer/modifier
// vers un week_of déjà pris, Postgres renvoie l'erreur 23505 —
// le hook intercepte ce code et affiche un message FR explicite
// "Une review existe déjà pour la semaine du DD mois YYYY."
// ═══════════════════════════════════════════════════════════════

const NETWORK_HINTS = ["Failed to fetch", "NetworkError", "network", "offline"];
const UNIQUE_VIOLATION = "23505";

const isNetworkError = (e) => {
  const msg = (e?.message || e?.toString() || "").toLowerCase();
  return NETWORK_HINTS.some((h) => msg.includes(h.toLowerCase()));
};

const isUniqueViolation = (e) => e?.code === UNIQUE_VIOLATION;

export function useReviews() {
  const [reviews, setReviews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reportError = useCallback((dbErr, fallbackMessage) => {
    console.error("[useReviews]", fallbackMessage, dbErr);
    if (isNetworkError(dbErr)) {
      setError("Connexion perdue. Vérifie ton réseau.");
    } else {
      setError(fallbackMessage);
    }
  }, []);

  const reportDuplicate = useCallback((weekOf, dbErr) => {
    console.error("[useReviews] duplicate week_of", weekOf, dbErr);
    setError(`Une review existe déjà pour la semaine du ${formatDateLong(weekOf)}.`);
  }, []);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: dbErr } = await supabase
      .from("weekly_reviews")
      .select("*")
      .order("week_of", { ascending: false });
    if (dbErr) {
      reportError(dbErr, "Impossible de charger les reviews. Réessaie.");
      setLoading(false);
      return;
    }
    setReviews(data.map(fromDb));
    setLoading(false);
  }, [reportError]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // ─── ADD ──────────────────────────────────────────────────────
  // INSERT non-optimiste : on attend la row créée pour avoir le UUID.
  // Si la semaine est déjà prise → message FR explicite.
  const addReview = useCallback(async (review) => {
    const { data: created, error: dbErr } = await supabase
      .from("weekly_reviews")
      .insert(toDb(review))
      .select()
      .single();
    if (dbErr) {
      if (isUniqueViolation(dbErr)) reportDuplicate(review.weekOf, dbErr);
      else reportError(dbErr, "Impossible de créer la review. Réessaie.");
      return;
    }
    setReviews((prev) => [fromDb(created), ...(prev || [])]);
  }, [reportError, reportDuplicate]);

  // ─── UPDATE ───────────────────────────────────────────────────
  // Cas tordu : si on change weekOf vers une semaine déjà prise
  // par une autre review, Postgres renvoie aussi 23505. Géré pareil.
  const updateReview = useCallback(async (review) => {
    const previous = reviews;
    setReviews((prev) => prev.map((r) => (r.id === review.id ? review : r)));
    const { error: dbErr } = await supabase
      .from("weekly_reviews")
      .update(toDb(review))
      .eq("id", review.id);
    if (dbErr) {
      setReviews(previous);
      if (isUniqueViolation(dbErr)) reportDuplicate(review.weekOf, dbErr);
      else reportError(dbErr, "Impossible d'enregistrer la review. Réessaie.");
    }
  }, [reviews, reportError, reportDuplicate]);

  // ─── DELETE ───────────────────────────────────────────────────
  const deleteReview = useCallback(async (id) => {
    const previous = reviews;
    setReviews((prev) => prev.filter((r) => r.id !== id));
    const { error: dbErr } = await supabase.from("weekly_reviews").delete().eq("id", id);
    if (dbErr) {
      setReviews(previous);
      reportError(dbErr, "Impossible de supprimer la review. Réessaie.");
    }
  }, [reviews, reportError]);

  const clearError = useCallback(() => setError(null), []);

  return {
    reviews,
    loading,
    error,
    addReview,
    updateReview,
    deleteReview,
    refetch: fetchReviews,
    clearError,
  };
}
