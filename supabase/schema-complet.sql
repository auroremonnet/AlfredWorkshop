-- ═══════════════════════════════════════════════════════════════
-- ALFRED WORKSPACE — SCHÉMA COMPLET (nouvelle base Supabase)
--
-- Crée toutes les tables de l'app : tickets, sprints, commentaires,
-- KPIs + historique, décisions, weekly reviews, liste de l'équipe.
-- + triggers, sécurité (RLS réservée à l'équipe), realtime.
--
-- Idempotent : relançable sans casse. Ne contient AUCUNE donnée :
-- les données sont dans seed-tickets.sql et seed-kpis.sql
-- (ou tout-en-un : setup-nouvelle-base.sql).
-- ═══════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────
-- 1. ÉQUIPE AUTORISÉE — seuls ces emails voient et modifient les données
-- ───────────────────────────────────────────────────────────────
create table if not exists public.team_members (
  email      text primary key check (email = lower(email)),
  name       text not null default '',
  created_at timestamptz not null default now()
);

-- Vrai si l'utilisateur connecté est dans team_members.
-- SECURITY DEFINER : lit la table même si l'utilisateur n'a pas le droit.
create or replace function public.is_team_member()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.team_members
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;


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
  committed_points int,
  completed_points int,
  started_at       timestamptz,
  closed_at        timestamptz,
  created_at       timestamptz not null default now(),
  constraint sprints_dates_ok check (end_date >= start_date)
);

create unique index if not exists sprints_one_active
  on public.sprints ((status)) where status = 'active';


-- ───────────────────────────────────────────────────────────────
-- 3. TICKETS
-- ───────────────────────────────────────────────────────────────
create table if not exists public.tickets (
  id          uuid primary key default gen_random_uuid(),
  ticket_code text not null unique,                    -- "T001"
  title       text not null,
  description text not null default '',
  status      text not null default 'À faire'
              check (status in ('À faire', 'En cours', 'En revue', 'Terminé', 'Bloqué')),
  quadrant    text not null default 'Q2'
              check (quadrant in ('Q1', 'Q2', 'Q3', 'Q4')),
  fibonacci   int  not null default 3,
  phase       text not null default 'P0'
              check (phase ~ '^P([0-9]|1[01])$'),      -- P0 … P11
  assignee    text,                                    -- NULL = non assigné
  notes       text not null default '',
  deps        text not null default '',                -- "T001,T015"
  sprint_id   uuid references public.sprints(id) on delete set null,
  done_at     timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  updated_by  uuid
);

create index if not exists tickets_sprint_id_idx on public.tickets (sprint_id);
create index if not exists tickets_status_idx    on public.tickets (status);

-- updated_at / updated_by automatiques
create or replace function public.tickets_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end $$;

drop trigger if exists tickets_touch on public.tickets;
create trigger tickets_touch
  before insert or update on public.tickets
  for each row execute function public.tickets_touch();

-- done_at posé quand le ticket passe "Terminé", effacé s'il en ressort
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


-- ───────────────────────────────────────────────────────────────
-- 4. COMMENTAIRES
-- ───────────────────────────────────────────────────────────────
create table if not exists public.ticket_comments (
  id           uuid primary key default gen_random_uuid(),
  ticket_id    uuid not null references public.tickets(id) on delete cascade,
  author       text not null,
  author_email text,
  body         text not null check (length(trim(body)) > 0),
  created_at   timestamptz not null default now()
);

create index if not exists ticket_comments_ticket_idx
  on public.ticket_comments (ticket_id, created_at);


-- ───────────────────────────────────────────────────────────────
-- 5. KPIs + HISTORIQUE
-- ───────────────────────────────────────────────────────────────
create table if not exists public.kpis (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  unit       text not null default '',
  value      numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.kpi_history (
  id          uuid primary key default gen_random_uuid(),
  kpi_id      uuid not null references public.kpis(id) on delete cascade,
  value       numeric not null,
  recorded_at timestamptz not null default now()
);

create index if not exists kpi_history_kpi_idx on public.kpi_history (kpi_id, recorded_at);


-- ───────────────────────────────────────────────────────────────
-- 6. JOURNAL DE DÉCISIONS
-- ───────────────────────────────────────────────────────────────
create table if not exists public.decisions (
  id           uuid primary key default gen_random_uuid(),
  date         date,
  title        text not null default '',
  context      text not null default '',
  choice       text not null default '',
  alternatives text not null default '',
  reason       text not null default '',
  ticket_id    uuid references public.tickets(id) on delete set null,
  created_at   timestamptz not null default now()
);


-- ───────────────────────────────────────────────────────────────
-- 7. WEEKLY REVIEWS (une par semaine)
-- ───────────────────────────────────────────────────────────────
create table if not exists public.weekly_reviews (
  id              uuid primary key default gen_random_uuid(),
  week_of         date not null unique,
  progress        text not null default '',
  blockers        text not null default '',
  next_priorities text not null default '',
  created_at      timestamptz not null default now()
);


-- ───────────────────────────────────────────────────────────────
-- 8. SÉCURITÉ (RLS) — tout est réservé aux emails de team_members
-- ───────────────────────────────────────────────────────────────
do $$
declare tbl text;
begin
  foreach tbl in array array[
    'sprints', 'tickets', 'ticket_comments', 'kpis', 'kpi_history', 'decisions', 'weekly_reviews'
  ] loop
    execute format('alter table public.%I enable row level security', tbl);
    execute format('drop policy if exists "team_only" on public.%I', tbl);
    execute format(
      'create policy "team_only" on public.%I for all to authenticated
         using (public.is_team_member()) with check (public.is_team_member())', tbl);
  end loop;
end $$;

-- team_members : chaque membre peut voir la liste, personne ne la modifie
-- depuis l'app (on la gère dans le SQL Editor).
alter table public.team_members enable row level security;
drop policy if exists "team_read" on public.team_members;
create policy "team_read" on public.team_members
  for select to authenticated using (public.is_team_member());


-- ───────────────────────────────────────────────────────────────
-- 9. REALTIME — l'équipe voit les changements des autres en direct
-- ───────────────────────────────────────────────────────────────
do $$
declare tbl text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach tbl in array array['tickets', 'sprints', 'ticket_comments'] loop
      begin
        execute format('alter publication supabase_realtime add table public.%I', tbl);
      exception when duplicate_object then null;
      end;
    end loop;
  end if;
end $$;
