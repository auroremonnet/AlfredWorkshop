-- ═══════════════════════════════════════════════════════════════
-- MIGRATION 002 — Sprints hebdo (mode Jira) + Maxence + commentaires
--
-- À exécuter UNE FOIS dans Supabase → SQL Editor, AVANT de déployer
-- le code de la branche feature/sprints-maxence.
-- Script idempotent : peut être relancé sans casse.
-- ═══════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────
-- 1. MAXENCE — lever les éventuelles restrictions sur tickets.assignee
--    (CHECK constraint ou type ENUM, selon comment la table a été créée)
-- ───────────────────────────────────────────────────────────────
do $$
declare r record;
begin
  for r in
    select c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public' and t.relname = 'tickets'
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%assignee%'
  loop
    execute format('alter table public.tickets drop constraint %I', r.conname);
  end loop;
end $$;

do $$
declare typ text;
begin
  select ty.typname into typ
  from pg_attribute a
  join pg_class c on c.oid = a.attrelid
  join pg_namespace n on n.oid = c.relnamespace
  join pg_type ty on ty.oid = a.atttypid
  where n.nspname = 'public' and c.relname = 'tickets'
    and a.attname = 'assignee' and ty.typtype = 'e';
  if typ is not null then
    execute format('alter type %I add value if not exists %L', typ, 'Maxence');
  end if;
end $$;

-- Pas de nouvelle contrainte : la liste des membres vit dans le code
-- (src/constants.js → TEAM). Ajouter un membre = 1 ligne de code, 0 SQL.


-- ───────────────────────────────────────────────────────────────
-- 2. SPRINTS
-- ───────────────────────────────────────────────────────────────
create table if not exists public.sprints (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  goal             text not null default '',
  start_date       date not null,
  end_date         date not null,
  status           text not null default 'planned'
                   check (status in ('planned', 'active', 'closed')),
  committed_points int,          -- snapshot au démarrage
  completed_points int,          -- snapshot à la clôture
  started_at       timestamptz,
  closed_at        timestamptz,
  created_at       timestamptz not null default now(),
  constraint sprints_dates_ok check (end_date >= start_date)
);

-- Un seul sprint actif à la fois (comme Jira)
create unique index if not exists sprints_one_active
  on public.sprints ((status)) where status = 'active';


-- ───────────────────────────────────────────────────────────────
-- 3. TICKETS — rattachement sprint + date de fin (burndown)
-- ───────────────────────────────────────────────────────────────
alter table public.tickets
  add column if not exists sprint_id uuid references public.sprints(id) on delete set null;
alter table public.tickets
  add column if not exists done_at timestamptz;

create index if not exists tickets_sprint_id_idx on public.tickets (sprint_id);

-- done_at posé automatiquement quand un ticket passe "Terminé",
-- effacé s'il en ressort. Alimente le burndown.
create or replace function public.tickets_set_done_at()
returns trigger language plpgsql as $$
begin
  if new.status = 'Terminé' then
    if tg_op = 'INSERT' or old.status is distinct from 'Terminé' then
      new.done_at := now();
    end if;
  else
    new.done_at := null;
  end if;
  return new;
end $$;

drop trigger if exists tickets_done_at on public.tickets;
create trigger tickets_done_at
  before insert or update of status on public.tickets
  for each row execute function public.tickets_set_done_at();

-- Backfill des tickets déjà terminés
update public.tickets
   set done_at = coalesce(updated_at, now())
 where status = 'Terminé' and done_at is null;


-- ───────────────────────────────────────────────────────────────
-- 4. COMMENTAIRES DE TICKETS
-- ───────────────────────────────────────────────────────────────
create table if not exists public.ticket_comments (
  id           uuid primary key default gen_random_uuid(),
  ticket_id    uuid not null references public.tickets(id) on delete cascade,
  author       text not null,        -- membre : Basile, Greg, Hippo, Aurore, Maxence
  author_email text,
  body         text not null check (length(trim(body)) > 0),
  created_at   timestamptz not null default now()
);

create index if not exists ticket_comments_ticket_idx
  on public.ticket_comments (ticket_id, created_at);


-- ───────────────────────────────────────────────────────────────
-- 5. RLS — accès complet aux membres connectés (même règle que le reste)
-- ───────────────────────────────────────────────────────────────
alter table public.sprints enable row level security;
drop policy if exists "team_all_sprints" on public.sprints;
create policy "team_all_sprints" on public.sprints
  for all to authenticated using (true) with check (true);

alter table public.ticket_comments enable row level security;
drop policy if exists "team_all_ticket_comments" on public.ticket_comments;
create policy "team_all_ticket_comments" on public.ticket_comments
  for all to authenticated using (true) with check (true);


-- ───────────────────────────────────────────────────────────────
-- 6. REALTIME — l'équipe voit les changements des autres en direct
-- ───────────────────────────────────────────────────────────────
do $$
declare tbl text;
begin
  foreach tbl in array array['tickets', 'sprints', 'ticket_comments'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', tbl);
    exception when duplicate_object then null;  -- déjà publiée
    end;
  end loop;
end $$;


-- ───────────────────────────────────────────────────────────────
-- Vérif rapide (doit renvoyer 3 lignes)
-- ───────────────────────────────────────────────────────────────
select table_name from information_schema.tables
 where table_schema = 'public' and table_name in ('tickets', 'sprints', 'ticket_comments');
