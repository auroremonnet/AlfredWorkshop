-- ═══════════════════════════════════════════════════════════════
-- migration-003-statuts-familles.sql  (22/10/2026)
-- À exécuter dans Supabase > SQL Editor AVANT de pousser le code.
-- 1. Deux nouveaux statuts : « Gelé » (autre famille / après PFE, dégelable)
--    et « Ancienne version » (n'a plus lieu d'être avec le majordome).
-- 2. Nouvelle colonne famille : Socle, F1…F6, Après PFE.
-- Rien n'est supprimé.
-- ═══════════════════════════════════════════════════════════════
begin;

alter table public.tickets drop constraint if exists tickets_status_check;
alter table public.tickets add constraint tickets_status_check
  check (status in ('À faire','En cours','En revue','Terminé','Bloqué','Gelé','Ancienne version'));

alter table public.tickets add column if not exists famille text;
alter table public.tickets drop constraint if exists tickets_famille_check;
alter table public.tickets add constraint tickets_famille_check
  check (famille is null or famille in ('Socle','F1','F2','F3','F4','F5','F6','Après PFE'));

create index if not exists tickets_famille_idx on public.tickets (famille);

commit;
