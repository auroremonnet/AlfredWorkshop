-- ═══════════════════════════════════════════════════════════════
-- RESET SPRINTS — efface les sprints de test
--
-- Les sprints créés jusqu'ici l'ont été pour valider le flux
-- (planned → active → closed). On repart d'une ardoise vierge
-- avant le premier vrai sprint hebdo.
--
-- À exécuter UNE FOIS dans Supabase → SQL Editor.
-- Script idempotent : relançable sans casse.
--
-- ⚠️ Ce script NE TOUCHE PAS aux tickets eux-mêmes : statut,
--    assignation, points et done_at sont conservés. Seul le
--    rattachement à un sprint est effacé.
-- ═══════════════════════════════════════════════════════════════

begin;

-- 1. État avant, pour vérification dans les logs
select 'avant' as moment,
       (select count(*) from public.sprints)                          as sprints,
       (select count(*) from public.tickets where sprint_id is not null) as tickets_rattaches;

-- 2. Détacher les tickets de leur sprint
--    (le FK est "on delete set null", mais on le fait explicitement
--     pour que le realtime pousse la mise à jour aux clients ouverts)
update public.tickets
   set sprint_id = null
 where sprint_id is not null;

-- 3. Supprimer tous les sprints
delete from public.sprints;

-- 4. État après
select 'après' as moment,
       (select count(*) from public.sprints)                          as sprints,
       (select count(*) from public.tickets where sprint_id is not null) as tickets_rattaches;

commit;
