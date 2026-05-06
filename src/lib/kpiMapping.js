// ═══════════════════════════════════════════════════════════════
// KPI MAPPING — pont entre la forme app (history inline) et la DB
// (table kpi_history séparée, jointe via FK kpi_id).
//
// Côté app : { id, name, unit, value, history: [{ date, value }] }
// Côté DB  : kpis (id uuid, name, unit, value)
//          + kpi_history (id uuid, kpi_id uuid, value, recorded_at)
//
// Utilisé uniquement dans src/hooks/useKpis.js.
// ═══════════════════════════════════════════════════════════════

// Slice ISO timestamp ou date → "YYYY-MM-DD" (compatible avec
// formatDateShort côté UI qui accepte les deux formats).
const isoDate = (ts) => (typeof ts === "string" ? ts.slice(0, 10) : ts);

// fromDb attend une row qui peut contenir kpi_history embarqué via
// nested select : `select *, kpi_history(value, recorded_at)`.
export function fromDb(row) {
  const history = (row.kpi_history || [])
    .map((h) => ({ date: isoDate(h.recorded_at), value: h.value }))
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  return {
    id: row.id,
    name: row.name ?? "",
    unit: row.unit ?? "",
    value: row.value ?? 0,
    history,
  };
}

// toDb sérialise les champs éditables d'un KPI. La table kpi_history
// est gérée séparément par le hook (snapshot avant update value).
export function toDb(kpi) {
  return {
    name: kpi.name ?? "",
    unit: kpi.unit ?? "",
    value: kpi.value ?? 0,
  };
}
