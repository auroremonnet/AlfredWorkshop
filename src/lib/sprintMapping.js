// ═══════════════════════════════════════════════════════════════
// SPRINT MAPPING — app (camelCase) ↔ DB (snake_case)
//
// Côté app : { id, name, goal, startDate, endDate, status,
//              committedPoints, completedPoints, startedAt, closedAt }
// Côté DB  : sprints (id, name, goal, start_date, end_date, status,
//                     committed_points, completed_points,
//                     started_at, closed_at, created_at)
// status : "planned" | "active" | "closed"
// ═══════════════════════════════════════════════════════════════

export function fromDb(row) {
  return {
    id: row.id,
    name: row.name ?? "",
    goal: row.goal ?? "",
    startDate: row.start_date ?? "",
    endDate: row.end_date ?? "",
    status: row.status ?? "planned",
    committedPoints: row.committed_points ?? null,
    completedPoints: row.completed_points ?? null,
    startedAt: row.started_at ?? null,
    closedAt: row.closed_at ?? null,
  };
}

export function toDb(s) {
  return {
    name: s.name?.trim() || "Sprint",
    goal: s.goal ?? "",
    start_date: s.startDate,
    end_date: s.endDate,
    status: s.status ?? "planned",
    committed_points: s.committedPoints ?? null,
    completed_points: s.completedPoints ?? null,
    started_at: s.startedAt ?? null,
    closed_at: s.closedAt ?? null,
  };
}
