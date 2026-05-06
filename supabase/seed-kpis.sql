-- ═══════════════════════════════════════════════════════════════
-- Seed des 5 KPIs business par défaut.
-- À exécuter UNE SEULE FOIS pour initialiser la table public.kpis
-- (équivalent du SEED_KPIS qui était hardcodé dans KpiBoard.jsx).
--
-- Champs id, created_at, updated_at : laissés aux valeurs par défaut.
-- ═══════════════════════════════════════════════════════════════

INSERT INTO public.kpis (name, unit, value) VALUES ('Entretiens utilisateurs / semaine', 'interviews', 0);
INSERT INTO public.kpis (name, unit, value) VALUES ('Inscriptions waitlist',             'personnes',  0);
INSERT INTO public.kpis (name, unit, value) VALUES ('Beta-testeurs recrutés',            'personnes',  0);
INSERT INTO public.kpis (name, unit, value) VALUES ('MRR',                               '€',          0);
INSERT INTO public.kpis (name, unit, value) VALUES ('Churn',                             '%',          0);
