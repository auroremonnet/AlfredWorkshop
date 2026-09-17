# Supabase — scripts de migration

## 🆕 Nouvelle base (recommandé)

Un seul fichier : [`setup-nouvelle-base.sql`](./setup-nouvelle-base.sql) — schéma complet
(`schema-complet.sql`) + 159 tickets + 5 KPIs + état projet. Idempotent.
Puis ajouter les emails de l'équipe :

```sql
insert into public.team_members (email, name) values
  ('prenom.nom@exemple.fr', 'Prénom');
```

Seuls ces emails voient/modifient les données (RLS `is_team_member()`).
Les scripts ci-dessous ne servent que pour l'ancienne base.

Ce dossier contient les scripts SQL et utilitaires pour préparer la
base Supabase d'Alfred Workspace.

## Fichiers

| Fichier | Rôle |
|---|---|
| `seed-tickets.sql` | 159 INSERTs pour initialiser la table `public.tickets` à partir de `DEFAULT_TICKETS` (`src/constants.js`). |
| `seed-kpis.sql` | 5 INSERTs pour initialiser la table `public.kpis` avec les KPIs business par défaut (Entretiens/sem, Waitlist, Beta-testeurs, MRR, Churn). |
| `migration-002-sprints-maxence.sql` | Sprints hebdo, rattachement ticket → sprint, `done_at` (burndown), commentaires, realtime, déblocage de Maxence comme assigné. **À lancer avant de déployer la branche sprints.** |
| `sync-etat-2026-09.sql` | Optionnel. Aligne quelques statuts/notes sur l'état réel du projet (T002, T018, T019, T024, T029, T068). |
| `reset-sprints.sql` | Efface tous les sprints et détache les tickets qui y étaient rattachés. Les tickets (statut, assignation, points, `done_at`) ne sont pas touchés. À lancer pour repartir d'une ardoise vierge après les sprints de test. |
| `generate-seed.mjs` | Script Node qui régénère `seed-tickets.sql` à partir de `src/constants.js`. À relancer si on modifie les tickets par défaut. |

## Migration 002 — sprints (septembre 2026)

1. Supabase → **SQL Editor** → coller [`migration-002-sprints-maxence.sql`](./migration-002-sprints-maxence.sql) → **Run**.
   La dernière requête doit lister `tickets`, `sprints`, `ticket_comments`.
2. (Optionnel) coller [`sync-etat-2026-09.sql`](./sync-etat-2026-09.sql) → **Run**.
3. Seulement ensuite : merger / pousser le code (Vercel redéploie).

Si le code part avant la migration, l'app affiche « Base pas à jour » au lieu de planter.

Le script est idempotent (relançable sans risque). Il ajoute :

| Élément | Détail |
|---|---|
| `public.sprints` | `name, goal, start_date, end_date, status (planned/active/closed), committed_points, completed_points, started_at, closed_at`. Un seul sprint `active` à la fois (index unique). |
| `tickets.sprint_id` | FK → `sprints.id`, `ON DELETE SET NULL` (supprimer un sprint renvoie ses tickets au backlog). |
| `tickets.done_at` | Posé par le trigger `tickets_done_at` quand le statut passe à `Terminé`, effacé sinon. |
| `public.ticket_comments` | `ticket_id` FK → `tickets.id` `ON DELETE CASCADE`, `author`, `author_email`, `body`. |
| RLS | Policies `team_all_*` : lecture/écriture pour tout utilisateur connecté. |
| Realtime | `tickets`, `sprints`, `ticket_comments` ajoutées à la publication `supabase_realtime`. |

## Initialiser la table kpis — UNE SEULE FOIS

Copier-coller [`seed-kpis.sql`](./seed-kpis.sql) dans le SQL Editor.
5 KPIs créés à valeur 0 (à mettre à jour ensuite via l'UI).

## Initialiser la table tickets — UNE SEULE FOIS

⚠️ **AVANT** de lancer `seed-tickets.sql`, il faut d'abord ajouter
la colonne `deps` à la table — elle n'est pas dans le schéma initial :

```sql
alter table public.tickets add column deps text default '';
```

Puis copier-coller le contenu de [`seed-tickets.sql`](./seed-tickets.sql)
dans le **SQL Editor** du dashboard Supabase et exécuter. Les 159
INSERTs s'enchaînent en une seule transaction.

## Mappings appliqués

Les tickets stockés en localStorage utilisent des ids courts (`todo`,
`do`, `p0`, `basile`). En base, ils sont stockés sous forme lisible :

| Champ | id local → valeur DB |
|---|---|
| `status` | `todo → "À faire"` · `doing → "En cours"` · `done → "Terminé"` |
| `quadrant` | `do → "Q1"` · `schedule → "Q2"` · `delegate → "Q3"` · `drop → "Q4"` |
| `phase` | `p0 → "P0"` … `p11 → "P11"` |
| `assignee` | `basile → "Basile"` · `greg → "Greg"` · `hippo → "Hippo"` · `aurore → "Aurore"` · `maxence → "Maxence"` · `unassigned → NULL` |
| `fib` | renommé `fibonacci` (int inchangé) |
| `deps` | conservé tel quel (CSV de `ticket_code`, ex : `"T001,T015"`) |

Les colonnes `id`, `notes`, `created_at`, `updated_at`, `updated_by`
sont laissées aux valeurs par défaut de la table.

## Régénérer le seed après modification des tickets

```bash
node supabase/generate-seed.mjs
```
