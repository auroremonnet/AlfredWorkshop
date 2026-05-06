// ═══════════════════════════════════════════════════════════════
// TICKET MAPPING — pont entre la forme app (ids stables) et la forme
// DB (labels lisibles côté Supabase).
//
// L'app raisonne en clés de domaine : "todo", "do", "p0", "basile".
// La DB stocke des libellés lisibles à l'œil nu : "À faire", "Q1",
// "P0", "Basile" (NULL si non assigné).
//
// Ces fonctions sont les SEULES portes entre les deux représentations
// (utilisées uniquement dans src/hooks/useTickets.js).
// ═══════════════════════════════════════════════════════════════

// ─── STATUS ───
export const STATUS_TO_DB = {
  todo: "À faire",
  doing: "En cours",
  review: "En revue",
  done: "Terminé",
  blocked: "Bloqué",
};
const STATUS_FROM_DB = invert(STATUS_TO_DB);

// ─── QUADRANT (Eisenhower) ───
export const QUADRANT_TO_DB = {
  do: "Q1",       // Urgent & Important
  schedule: "Q2", // Important, pas urgent
  delegate: "Q3", // Urgent, pas important
  drop: "Q4",     // Pas urgent, pas important
};
const QUADRANT_FROM_DB = invert(QUADRANT_TO_DB);

// ─── PHASE (mapping trivial : p0 ↔ P0) ───
const phaseToDb = (id) => (id ? id.toUpperCase() : id);
const phaseFromDb = (label) => (label ? label.toLowerCase() : label);

// ─── ASSIGNEE ───
export const ASSIGNEE_TO_DB = {
  basile: "Basile",
  greg: "Greg",
  hippo: "Hippo",
  aurore: "Aurore",
  unassigned: null, // NULL en DB (la colonne assignee est nullable)
};
const ASSIGNEE_FROM_DB = invert(ASSIGNEE_TO_DB);
// Cas particulier : NULL en DB → "unassigned" en app
ASSIGNEE_FROM_DB[null] = "unassigned";

// ═══════════════════════════════════════════════════════════════
// fromDb(row) — Supabase row → ticket app-shape
// ═══════════════════════════════════════════════════════════════
export function fromDb(row) {
  return {
    id: row.ticket_code,
    title: row.title,
    desc: row.description ?? "",
    status: STATUS_FROM_DB[row.status] ?? "todo",
    quadrant: QUADRANT_FROM_DB[row.quadrant] ?? "schedule",
    fib: row.fibonacci,
    phase: phaseFromDb(row.phase),
    assignee: row.assignee === null ? "unassigned" : (ASSIGNEE_FROM_DB[row.assignee] ?? "unassigned"),
    notes: row.notes ?? "",
    deps: row.deps ?? "",
  };
}

// ═══════════════════════════════════════════════════════════════
// toDb(ticket) — ticket app-shape → payload Supabase (INSERT/UPDATE)
//
// Sortie : ticket_code + tous les champs éditables. On exclut
// volontairement id (uuid auto), created_at, updated_at, updated_by.
// ═══════════════════════════════════════════════════════════════
export function toDb(t) {
  return {
    ticket_code: t.id,
    title: t.title,
    description: t.desc ?? "",
    status: STATUS_TO_DB[t.status] ?? "À faire",
    quadrant: QUADRANT_TO_DB[t.quadrant] ?? "Q2",
    fibonacci: t.fib,
    phase: phaseToDb(t.phase),
    assignee: ASSIGNEE_TO_DB[t.assignee] ?? null,
    notes: t.notes ?? "",
    deps: t.deps ?? "",
  };
}

// ─── Helper : inverse une map { k1: v1 } en { v1: k1 } ───
function invert(map) {
  const out = {};
  for (const [k, v] of Object.entries(map)) {
    if (v !== null && v !== undefined) out[v] = k;
  }
  return out;
}
