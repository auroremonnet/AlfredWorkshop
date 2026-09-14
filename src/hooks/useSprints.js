import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase.js";
import { fromDb, toDb } from "../lib/sprintMapping.js";
import { humanize } from "../lib/dbErrors.js";

// ═══════════════════════════════════════════════════════════════
// useSprints — sprints hebdo (table public.sprints)
//
// Cycle de vie (comme Jira) : planned → active → closed
//   - un seul sprint "active" à la fois (index unique en BDD)
//   - startSprint fige committed_points (engagement de départ)
//   - closeSprint fige completed_points et renvoie les tickets
//     non terminés vers le backlog ou un autre sprint
//
// Les opérations qui touchent aux tickets reçoivent `ticketsApi`
// ({ tickets, moveTickets, silentRefetch }) depuis le shell.
// ═══════════════════════════════════════════════════════════════

const byStart = (a, b) => (a.startDate || "").localeCompare(b.startDate || "");

export function useSprints() {
  const [sprints, setSprints] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const sprintsRef = useRef(null);
  sprintsRef.current = sprints;

  const reportError = useCallback((dbErr, fallback) => {
    console.error("[useSprints]", fallback, dbErr);
    if (dbErr?.code === "23505") {
      setError("Un sprint est déjà actif. Termine-le avant d'en démarrer un autre.");
    } else {
      setError(humanize(dbErr, fallback));
    }
  }, []);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    const { data, error: dbErr } = await supabase
      .from("sprints")
      .select("*")
      .order("start_date", { ascending: true });
    if (dbErr) {
      if (!silent) reportError(dbErr, "Impossible de charger les sprints.");
      setSprints((prev) => prev ?? []);
      setLoading(false);
      return;
    }
    setSprints(data.map(fromDb));
    setLoading(false);
  }, [reportError]);

  useEffect(() => { load(); }, [load]);

  const silentRefetch = useCallback(() => load({ silent: true }), [load]);

  // ─── CREATE (non optimiste : on veut l'UUID) ─────────────────
  const addSprint = useCallback(async (draft) => {
    const { data, error: dbErr } = await supabase
      .from("sprints")
      .insert(toDb({ ...draft, status: "planned" }))
      .select()
      .single();
    if (dbErr) {
      reportError(dbErr, "Impossible de créer le sprint.");
      return null;
    }
    const created = fromDb(data);
    setSprints((prev) => [...(prev || []), created].sort(byStart));
    return created;
  }, [reportError]);

  // ─── UPDATE (optimiste) ──────────────────────────────────────
  const updateSprint = useCallback(async (sprint) => {
    const previous = sprintsRef.current;
    setSprints((prev) => prev.map((s) => (s.id === sprint.id ? sprint : s)).sort(byStart));
    const { error: dbErr } = await supabase.from("sprints").update(toDb(sprint)).eq("id", sprint.id);
    if (dbErr) {
      setSprints(previous);
      reportError(dbErr, "Impossible d'enregistrer le sprint.");
      return false;
    }
    return true;
  }, [reportError]);

  // ─── DELETE — les tickets repartent au backlog (FK on delete set null)
  const deleteSprint = useCallback(async (id, ticketsApi) => {
    const previous = sprintsRef.current;
    setSprints((prev) => prev.filter((s) => s.id !== id));
    const { error: dbErr } = await supabase.from("sprints").delete().eq("id", id);
    if (dbErr) {
      setSprints(previous);
      reportError(dbErr, "Impossible de supprimer le sprint.");
      return false;
    }
    await ticketsApi?.silentRefetch?.();
    return true;
  }, [reportError]);

  // ─── START ───────────────────────────────────────────────────
  const startSprint = useCallback(async (sprint, ticketsApi) => {
    const already = (sprintsRef.current || []).find((s) => s.status === "active" && s.id !== sprint.id);
    if (already) {
      setError(`« ${already.name} » est encore actif. Termine-le avant d'en démarrer un autre.`);
      return false;
    }
    const committed = (ticketsApi?.tickets || [])
      .filter((t) => t.sprintId === sprint.id)
      .reduce((sum, t) => sum + (t.fib || 0), 0);
    return updateSprint({
      ...sprint,
      status: "active",
      committedPoints: committed,
      startedAt: new Date().toISOString(),
    });
  }, [updateSprint]);

  // ─── CLOSE ───────────────────────────────────────────────────
  // moveTo : null (backlog) | uuid d'un sprint existant
  const closeSprint = useCallback(async (sprint, { moveTo = null } = {}, ticketsApi) => {
    const inSprint = (ticketsApi?.tickets || []).filter((t) => t.sprintId === sprint.id);
    const done = inSprint.filter((t) => t.status === "done");
    const leftover = inSprint.filter((t) => t.status !== "done").map((t) => t.id);

    if (leftover.length) {
      const ok = await ticketsApi.moveTickets(leftover, moveTo);
      if (!ok) return false;
    }
    const ok = await updateSprint({
      ...sprint,
      status: "closed",
      committedPoints: sprint.committedPoints ?? inSprint.reduce((s, t) => s + (t.fib || 0), 0),
      completedPoints: done.reduce((s, t) => s + (t.fib || 0), 0),
      closedAt: new Date().toISOString(),
    });
    return ok;
  }, [updateSprint]);

  const clearError = useCallback(() => setError(null), []);

  return {
    sprints,
    loading,
    error,
    addSprint,
    updateSprint,
    deleteSprint,
    startSprint,
    closeSprint,
    refetch: load,
    silentRefetch,
    clearError,
  };
}
