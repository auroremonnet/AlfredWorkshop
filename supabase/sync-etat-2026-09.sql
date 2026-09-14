-- ═══════════════════════════════════════════════════════════════
-- SYNC ÉTAT PROJET — septembre 2026 (OPTIONNEL)
--
-- Aligne la base sur les avancées et décisions actées hors workspace.
-- Prudent : ne touche un statut QUE s'il est encore "À faire",
-- et ajoute aux notes sans écraser l'existant.
-- À lancer après migration-002-sprints-maxence.sql.
-- ═══════════════════════════════════════════════════════════════

-- T018 — Recherche INPI : terminée (Alfred dispo en classe 36)
update public.tickets set status = 'Terminé'
 where ticket_code = 'T018' and status = 'À faire';

-- T019 — Domaines (alfred.fr / alfred.io recommandés) : en cours
update public.tickets set status = 'En cours'
 where ticket_code = 'T019' and status = 'À faire';

-- T002 — Entretiens utilisateurs : guide prêt, Google Form en ligne
update public.tickets set status = 'En cours'
 where ticket_code = 'T002' and status = 'À faire';

-- T024 — Dépôt INPI : bloqué tant qu'il n'y a pas de logo vectoriel propre
update public.tickets
   set notes = trim(both E'\n' from coalesce(notes, '') || E'\n' ||
       'Bloqué par l''absence de logo vectoriel propre (sourcer l''original ou commander un redraw). Classes visées : 35, 36, 42.')
 where ticket_code = 'T024' and coalesce(notes, '') not ilike '%logo vectoriel%';

-- T029 — Agrégateur : décision actée
update public.tickets
   set notes = trim(both E'\n' from coalesce(notes, '') || E'\n' ||
       'Décision : Powens. Bridge écarté (appartient à BPCE/Bankin'', conflit d''intérêts).')
 where ticket_code = 'T029' and coalesce(notes, '') not ilike '%Décision : Powens%';

-- T068 — Détection abonnements : règles pour le MVP, pas de ML
update public.tickets
   set title = 'Backend : Service détection abonnements (moteur de règles MVP)',
       description = 'Moteur de règles pour le MVP (pas de ML) : montants similaires, intervalles réguliers, même marchand normalisé. Whitelist marchands + fallback de classification via Claude API pour les cas ambigus. Le ML viendra quand on aura un dataset labellisé réel.'
 where ticket_code = 'T068' and title ilike '%algo ML%';

-- Contrôle
select ticket_code, status, title from public.tickets
 where ticket_code in ('T002', 'T018', 'T019', 'T024', 'T029', 'T068')
 order by ticket_code;
