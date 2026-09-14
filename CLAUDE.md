# Alfred — Contexte projet pour Claude Code

> Ce fichier est lu automatiquement par Claude Code au démarrage de chaque session
> dans ce repo. Il contient le contexte minimum pour que l'agent comprenne le
> produit, les conventions et les limites. À maintenir à jour à chaque évolution majeure.

---

## 1. Mission produit

**Alfred** est un agent IA personnel financier (B2C, mobile-first) qui surveille la vie
financière des utilisateurs en continu, propose les bonnes actions au bon moment, et
exécute les démarches à leur place après validation **en un tap**.

**Positionnement** : « L'IA qui se bat pour ton argent à ta place. »

**Règle d'or** : Alfred est un **copilote**, pas un pilote auto. Il propose, l'utilisateur
valide. Jamais d'action irréversible sans confirmation explicite.

**Promesse mesurable MVP** : faire économiser au moins 30€ en 30 jours à un nouvel utilisateur.

---

## 2. Stack technique

- **Mobile** : React Native + Expo
- **Backend** : Python FastAPI — monolithe modulaire pour le MVP
- **BDD** : PostgreSQL sur AWS RDS (encryption at rest obligatoire, RGPD) + Redis + Celery
- **Paiement** : Stripe
- **Agrégation bancaire DSP2** : **Powens** (décision actée — Bridge écarté : appartient à BPCE/Bankin', conflit d'intérêts)
- **Détection abonnements MVP** : moteur de règles, pas de ML (T068)
- **Hébergement** : AWS eu-west-1 (souveraineté UE pour données bancaires)
- **IA** : Claude API (Sonnet 4.6 pour le gros du trafic, Opus 4.7 pour négociation/raisonnement complexe)
- **Monitoring** : à définir (Datadog ou Sentry + Grafana)
- **Outil interne** (workspace de l'équipe) : React + Vite + Supabase, déployé sur Vercel (ce repo)

---

## 3. Équipe & responsabilités

| Membre  | Rôle principal                         | Domaine                           |
|---------|----------------------------------------|-----------------------------------|
| Basile  | Stratégie, fundraising, vision         | Pilotage global, investisseurs    |
| Greg    | Dev / tech / infra                     | Backend, sécurité, architecture   |
| Hippo   | Produit / ops                          | Roadmap, partenariats, conformité |
| Aurore  | Marketing / growth                     | Acquisition, content, retention   |
| Maxence | À définir                              | À définir                         |

---

## 4. Conventions de code

- **Commits** : impératif, < 72 chars en titre. Ex: `T042 add merchant matching for subscription detection`
- **Branches** : `feature/T###-short-desc` où `T###` = ID du ticket workspace
- **PR** : titre = `T### Titre du ticket`. Description avec : contexte / changes / risques / how to test
- **TypeScript** : mode strict, pas de `any` non justifié
- **Tests** : couverture > 70% sur le backend (cœur métier détection + négo)
- **Secrets** : jamais en clair, jamais dans le repo. Utiliser AWS Secrets Manager
- **PII** : toute manipulation de données bancaires doit passer par les helpers `lib/pii/*`

---

## 5. Workspace de tickets (ce repo)

Outil interne façon Jira, données dans Supabase :

- **Sprint** : board Kanban du sprint hebdo actif, burndown, charge par membre
- **Backlog** : planification des sprints (planned → active → closed), vélocité
- **Roadmap** : 159+ tickets en 12 phases (P0 → P11), liste + matrice Eisenhower
- **Résultats** : KPIs, journal de décisions, weekly reviews

Code : `src/AlfredWorkspace.jsx` (shell), `src/views/`, `src/components/`, `src/hooks/`
(un hook Supabase par table), `src/lib/*Mapping.js` (seule porte app ↔ DB).
Schéma : `supabase/migration-*.sql` — toute évolution de schéma = nouvelle migration,
exécutée dans Supabase **avant** de pousser le code qui l'utilise.
Équipe : `TEAM` dans `src/constants.js` + `ASSIGNEE_TO_DB` dans `src/lib/ticketMapping.js`.

**Rituel** : sprint d'une semaine (lundi → dimanche). Planning le lundi dans Backlog,
clôture le dimanche (non-finis → sprint suivant, weekly review pré-remplie).

**Convention critique** : toujours référencer l'ID ticket (T001…) dans les commits,
branches et PRs. Permet le tracking croisé code ↔ roadmap.

---

## 6. Phases et priorité actuelle

> ⚠️ Mettre à jour mensuellement.

- **P0** Validation & recherches (M0-M1)
- **P1** Légal & structuration (M1-M2)
- **P2** Design & UX (M2-M3)
- **P3** Infra & architecture (M2-M3)
- **P4** Dev MVP Backend (M3-M5) ← *cœur de la valeur livrée*
- **P5** Dev MVP Frontend (M3-M5)
- **P6** Sécurité & qualité (M4-M5)
- **P7** Pré-lancement & marketing (M4-M5)
- **P8** Lancement (M5-M6)
- **P9** V1 Automatisation négo (M5-M8)
- **P10** Scale & Série A (M8-M12)
- **P11** International & V3 (M12+)

**Phase active** : P0 Validation / P1 Légal — go/no-go T016 = premier vrai checkpoint

---

## 7. Périmètre produit — ce qu'Alfred FAIT

- **Détection passive** : abonnements morts/inutilisés, factures à venir, fraudes silencieuses, doublons
- **Négociation active** : forfait mobile, assurances (auto/habitation/mutuelle), énergie
- **Récupération de droits** : indemnisations vols (règlement CE 261/2004), retards, parrainages dormants
- **Simulation what-if temps réel** : impact d'une décision financière en direct
- **Lettres de réclamation auto** : avec review humaine en V1, full-auto à partir de V2 sur cas simples
- **Sécurité/urgence** : détection anomalies, blocage carte (lien vers la banque), dossier contestation

## 8. Périmètre produit — ce qu'Alfred NE FAIT PAS (V1-V2)

> Ces limites sont structurelles, pas temporaires. Toute feature demandée doit
> passer ce filtre avant d'être planifiée.

- **Pas de crédit/prêt** (sortie périmètre IOBSP/ACPR)
- **Pas de conseil en investissement actif** (sortie AMF, plusieurs années d'agrément)
- **Pas de coaching nutrition/sport/santé non-admin** (dilue la promesse argent)
- **Pas de gamification poussée** (badges, streaks) — public CSP+, sobriété > Duolingo
- **Pas de réseau social / partage public** des données financières
- **Pas d'autopilote** sur les actions irréversibles (résiliation, virement, etc.)

---

## 9. Contraintes conformité

- **RGPD** : Cnil notification 72h en cas de breach. PCA documenté. DPO désigné.
- **DSP2** : Strong Customer Authentication (SCA) sur chaque connexion bancaire. Réauth tous les 180j.
- **AI Act** : toute décision automatisée impactant matériellement l'utilisateur (négo, résiliation, contestation) doit avoir un human-in-the-loop traçable. Logs conservés 5 ans.
- **Banque-France / TRACFIN** : reporting suspicion blanchiment si applicable.

---

## 10. Concurrents de référence

À garder en tête pour le positionnement et le messaging :

- **Bankin'** (FR) — tracker passif, freemium. Différenciation : Alfred *agit*, eux *affichent*.
- **Rocket Money** (US) — modèle proche, mais conflit d'intérêts sur les abos partenaires.
- **Sumeria** (ex-Lydia, FR) — néobanque, plan d'attaque optimisation possible en 18-36 mois. Profiter du conflit d'intérêts structurel.
- **Linxo, Pilote Budget** (FR) — vieillissants, faibles barrières à l'entrée.

---

## 11. Commandes utiles

Workspace (ce repo) :

```bash
cp .env.example .env     # puis remplir VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
npm install
npm run dev              # http://localhost:5173
npm run build            # vérif avant PR
node supabase/generate-seed.mjs   # si DEFAULT_TICKETS change
```

App Alfred (mobile + backend) : commandes à définir au démarrage de P3.

---

## 12. Pour Claude Code — instructions de comportement

- **Toujours** lire le ticket référencé (workspace .jsx ou issue GitHub liée) avant de coder
- **Toujours** proposer un plan avant de modifier du code sur du non-trivial (mode plan)
- **Jamais** modifier les conventions PII, secrets, DSP2 sans validation explicite humaine
- **Jamais** push sur `main` directement, toujours PR
- Sur les tâches IA-sensibles (génération lettre réclamation, message à un opérateur), **toujours** logger l'input/output pour audit AI Act
- Quand un choix d'architecture engage du long terme, **demander** plutôt que décider

---

*Dernière maj : 10 septembre 2026 — sprints hebdo + arrivée de Maxence*
