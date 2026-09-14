// ═══════════════════════════════════════════════════════════════
// DATES — helpers en heure LOCALE (jamais toISOString, qui décale
// d'un jour la nuit en France). Format pivot : "YYYY-MM-DD".
// ═══════════════════════════════════════════════════════════════

const pad = (n) => String(n).padStart(2, "0");

export const toISODate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// "YYYY-MM-DD" → Date à midi local (évite les soucis DST)
export const parseISODate = (iso) => {
  if (!iso) return null;
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
};

export const today = () => toISODate(new Date());

export const addDays = (iso, n) => {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
};

export const mondayOfISO = (iso = today()) => {
  const d = parseISODate(iso);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return toISODate(d);
};

// Numéro de semaine ISO 8601
export const isoWeek = (iso) => {
  const d = parseISODate(iso);
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayNr = (target.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const diff = (target - firstThursday) / 86400000;
  return 1 + Math.round((diff - 3 + ((firstThursday.getDay() + 6) % 7)) / 7);
};

// Nombre de jours entre deux dates ISO (b - a)
export const daysBetween = (a, b) => Math.round((parseISODate(b) - parseISODate(a)) / 86400000);

// Liste des dates ISO de a à b inclus
export const dateRange = (a, b) => {
  const out = [];
  if (!a || !b) return out;
  let cur = a;
  let guard = 0;
  while (cur <= b && guard < 400) {
    out.push(cur);
    cur = addDays(cur, 1);
    guard++;
  }
  return out;
};

const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const DAYS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];

// "7 → 13 sept." ou "28 sept. → 4 oct."
export const formatRange = (a, b) => {
  if (!a || !b) return "—";
  const da = parseISODate(a);
  const db = parseISODate(b);
  if (da.getMonth() === db.getMonth() && da.getFullYear() === db.getFullYear()) {
    return `${da.getDate()} → ${db.getDate()} ${MONTHS[db.getMonth()]}`;
  }
  return `${da.getDate()} ${MONTHS[da.getMonth()]} → ${db.getDate()} ${MONTHS[db.getMonth()]}`;
};

export const formatDay = (iso) => {
  const d = parseISODate(iso);
  return d ? `${DAYS[d.getDay()]} ${d.getDate()}` : "—";
};

export const formatDateTime = (ts) => {
  if (!ts) return "";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
};

// Proposition de sprint hebdo (lundi → dimanche)
export const weeklySprintDraft = (mondayISO) => {
  const start = mondayISO || mondayOfISO();
  const end = addDays(start, 6);
  return {
    name: `Sprint S${isoWeek(start)}`,
    goal: "",
    startDate: start,
    endDate: end,
  };
};
