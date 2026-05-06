// ═══════════════════════════════════════════════════════════════
// DECISION MAPPING — convertit entre la forme app (camelCase,
// ticketId = ticket_code "T029") et la DB (snake_case, ticket_id
// = UUID FK vers tickets.id).
//
// Côté app : { id, date, title, context, choice, alternatives,
//              reason, ticketId: "T029" | "" }
// Côté DB  : decisions (id uuid, date, title, context, choice,
//                       alternatives, reason, ticket_id uuid FK)
//
// Le hook useDecisions résout le UUID via une lookup côté JS
// (à partir des tickets déjà en mémoire) avant d'appeler toDb.
// ═══════════════════════════════════════════════════════════════

// fromDb attend une row avec nested select sur tickets :
// `select *, tickets(ticket_code)`.
// Si le ticket lié a été supprimé (ON DELETE SET NULL), tickets
// est null → ticketId = "" côté app, et l'UI ne montre pas de badge.
export function fromDb(row) {
  return {
    id: row.id,
    date: row.date ?? "",
    title: row.title ?? "",
    context: row.context ?? "",
    choice: row.choice ?? "",
    alternatives: row.alternatives ?? "",
    reason: row.reason ?? "",
    ticketId: row.tickets?.ticket_code ?? "",
  };
}

// toDb sérialise les champs éditables. Le UUID du ticket est
// résolu en amont par le hook (ticket_code → uuid via map locale)
// et passé en second argument. Si la décision n'a pas de ticket lié,
// on passe null.
export function toDb(decision, ticketUuid) {
  return {
    date: decision.date || null,
    title: decision.title ?? "",
    context: decision.context ?? "",
    choice: decision.choice ?? "",
    alternatives: decision.alternatives ?? "",
    reason: decision.reason ?? "",
    ticket_id: ticketUuid ?? null,
  };
}
