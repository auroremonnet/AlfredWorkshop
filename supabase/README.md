# Supabase — scripts de migration

Ce dossier contient les scripts SQL et utilitaires pour préparer la
base Supabase d'Alfred Workspace.

## Fichiers

| Fichier | Rôle |
|---|---|
| `seed-tickets.sql` | 159 INSERTs pour initialiser la table `public.tickets` à partir de `DEFAULT_TICKETS` (`src/constants.js`). |
| `generate-seed.mjs` | Script Node qui régénère `seed-tickets.sql` à partir de `src/constants.js`. À relancer si on modifie les tickets par défaut. |

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
| `assignee` | `basile → "Basile"` · `greg → "Greg"` · `hippo → "Hippo"` · `aurore → "Aurore"` · `unassigned → NULL` |
| `fib` | renommé `fibonacci` (int inchangé) |
| `deps` | conservé tel quel (CSV de `ticket_code`, ex : `"T001,T015"`) |

Les colonnes `id`, `notes`, `created_at`, `updated_at`, `updated_by`
sont laissées aux valeurs par défaut de la table.

## Régénérer le seed après modification des tickets

```bash
node supabase/generate-seed.mjs
```
