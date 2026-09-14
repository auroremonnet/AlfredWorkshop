// Générateur de seed SQL pour la table public.tickets.
// Lit DEFAULT_TICKETS depuis src/constants.js et écrit supabase/seed-tickets.sql.
// Exécuter une seule fois (ou à chaque mise à jour de DEFAULT_TICKETS) :
//   node supabase/generate-seed.mjs
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { DEFAULT_TICKETS } from "../src/constants.js";

const escape = (s) => String(s).replace(/'/g, "''");
const v = (val) => (val === null || val === undefined ? "NULL" : `'${escape(val)}'`);

const STATUS = { todo: "À faire", doing: "En cours", done: "Terminé", review: "En revue", blocked: "Bloqué" };
const QUAD = { do: "Q1", schedule: "Q2", delegate: "Q3", drop: "Q4" };
const phaseLabel = (p) => p.toUpperCase();
const ASSIGN = { basile: "Basile", greg: "Greg", hippo: "Hippo", aurore: "Aurore", maxence: "Maxence", unassigned: null };

const header = `-- ═══════════════════════════════════════════════════════════════
-- Seed des 159 tickets pré-définis (DEFAULT_TICKETS dans src/constants.js).
-- À exécuter UNE SEULE FOIS pour initialiser la table public.tickets.
--
-- ⚠️ PRÉREQUIS : la colonne \`deps\` doit avoir été ajoutée au préalable :
--   alter table public.tickets add column deps text default '';
--
-- Champs id, created_at, updated_at, updated_by, notes : laissés aux
-- valeurs par défaut de la table.
-- ═══════════════════════════════════════════════════════════════
`;

const rows = DEFAULT_TICKETS.map((t) => {
  const vals = [
    v(t.id),
    v(t.title),
    v(t.desc),
    v(STATUS[t.status]),
    v(QUAD[t.quadrant]),
    String(t.fib),
    v(phaseLabel(t.phase)),
    v(ASSIGN[t.assignee]),
    v(t.deps || ""),
  ];
  return `INSERT INTO public.tickets (ticket_code, title, description, status, quadrant, fibonacci, phase, assignee, deps) VALUES (${vals.join(", ")});`;
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(__dirname, "seed-tickets.sql");
fs.writeFileSync(out, header + "\n" + rows.join("\n") + "\n");
console.log(`Wrote ${rows.length} INSERTs to ${out}`);

// Fichier tout-en-un pour une base neuve : schéma + tickets + KPIs + sync
const read = (f) => fs.readFileSync(path.join(__dirname, f), "utf8");
const setup = [
  `-- ═══════════════════════════════════════════════════════════════
-- ALFRED WORKSPACE — SETUP NOUVELLE BASE (tout-en-un)
-- Généré par supabase/generate-seed.mjs — ne pas éditer à la main.
-- À coller UNE FOIS dans le SQL Editor d'un projet Supabase vide.
-- Ensuite : ajouter les emails de l'équipe dans public.team_members.
-- ═══════════════════════════════════════════════════════════════`,
  read("schema-complet.sql"),
  "-- ═══ DONNÉES : 159 tickets ═══",
  rows.map((r) => r.replace(");", ") on conflict (ticket_code) do nothing;")).join("\n"),
  "-- ═══ DONNÉES : KPIs (seulement si la table est vide) ═══",
  `insert into public.kpis (name, unit, value)
select * from (values
  ('Entretiens utilisateurs / semaine', 'interviews', 0),
  ('Inscriptions waitlist', 'personnes', 0),
  ('Beta-testeurs recrutés', 'personnes', 0),
  ('MRR', '€', 0),
  ('Churn', '%', 0)
) v(name, unit, value)
where not exists (select 1 from public.kpis);`,
  "-- ═══ ÉTAT PROJET (notes + décisions) ═══",
  read("sync-etat-2026-09.sql"),
].join("\n\n");
fs.writeFileSync(path.join(__dirname, "setup-nouvelle-base.sql"), setup + "\n");
console.log("Wrote setup-nouvelle-base.sql");
