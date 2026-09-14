// ═══════════════════════════════════════════════════════════════
// DB ERRORS — traduction des erreurs Supabase/Postgres en messages
// FR actionnables. Partagé par tous les hooks.
// ═══════════════════════════════════════════════════════════════

const NETWORK_HINTS = ["failed to fetch", "networkerror", "network", "offline"];

export const isNetworkError = (e) => {
  const msg = (e?.message || e?.toString() || "").toLowerCase();
  return NETWORK_HINTS.some((h) => msg.includes(h));
};

// 42703 = colonne inconnue, 42P01 = table inconnue,
// PGRST204/PGRST205 = colonne/table absente du cache PostgREST
const SCHEMA_CODES = ["42703", "42P01", "PGRST204", "PGRST205"];

export const isSchemaError = (e) =>
  SCHEMA_CODES.includes(e?.code) ||
  /sprint_id|done_at|sprints|ticket_comments/i.test(e?.message || "");

export const MIGRATION_MSG =
  "Base pas à jour : exécute supabase/migration-002-sprints-maxence.sql dans le SQL Editor Supabase, puis recharge.";

export const humanize = (e, fallback) => {
  if (isNetworkError(e)) return "Connexion perdue. Vérifie ton réseau.";
  if (isSchemaError(e)) return MIGRATION_MSG;
  if (e?.code === "23505") return "Conflit : cet élément existe déjà (doublon).";
  return fallback;
};
