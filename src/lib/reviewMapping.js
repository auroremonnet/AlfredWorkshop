// ═══════════════════════════════════════════════════════════════
// REVIEW MAPPING — convertit entre la forme app (camelCase) et
// la DB (snake_case).
//
// Côté app : { id, weekOf, progress, blockers, nextPriorities }
// Côté DB  : weekly_reviews (id, week_of, progress, blockers,
//                            next_priorities)
//
// La colonne week_of a une contrainte UNIQUE en BDD : tenter
// d'insérer une 2e review pour la même semaine renvoie l'erreur
// Postgres 23505, gérée côté hook avec un message FR explicite.
// ═══════════════════════════════════════════════════════════════

export function fromDb(row) {
  return {
    id: row.id,
    weekOf: row.week_of ?? "",
    progress: row.progress ?? "",
    blockers: row.blockers ?? "",
    nextPriorities: row.next_priorities ?? "",
  };
}

export function toDb(review) {
  return {
    week_of: review.weekOf,
    progress: review.progress ?? "",
    blockers: review.blockers ?? "",
    next_priorities: review.nextPriorities ?? "",
  };
}
