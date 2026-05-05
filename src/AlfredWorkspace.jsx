import { useState, useEffect, useMemo } from "react";

// ═══════════════════════════════════════════════════════════════
// ALFRED — Brand System (charte officielle bowtie)
// ═══════════════════════════════════════════════════════════════
const C = {
  // Couleurs principales (charte Alfred)
  encre: "#0F1B2D",          // Couleur principale
  champagne: "#D4A95C",      // Accent premium · CTA
  ivoire: "#F7F3EB",         // Fonds et surfaces
  emeraude: "#1F6B4A",       // Économies · gains

  // Variations
  encreLight: "#1A2A42",
  encreDeep: "#0A1320",
  champagneLight: "#E5C285",
  champagneDeep: "#A8843F",
  ivoireDeep: "#EFEADD",
  ivoireDeeper: "#E5DECC",
  emeraudeLight: "#2D8B62",

  // Système light theme
  bg: "#F7F3EB",             // ivoire
  bgPanel: "#FFFFFF",
  bgCard: "#FFFFFF",
  bgSubtle: "#FBF8F1",
  bgHover: "#F1ECE0",
  bgInput: "#FFFFFF",

  border: "rgba(15, 27, 45, 0.08)",
  borderStrong: "rgba(15, 27, 45, 0.18)",
  borderSubtle: "rgba(15, 27, 45, 0.04)",
  borderGold: "rgba(212, 169, 92, 0.4)",

  text: "#0F1B2D",           // encre
  textMuted: "#5A6478",
  textDim: "#8B92A3",

  // Statuts
  todo: "#8B92A3",
  doing: "#3B82F6",
  review: "#A855F7",
  done: "#1F6B4A",           // émeraude
  blocked: "#C73E47",
};

const FIB_VALUES = [1, 2, 3, 5, 8, 13, 21];
const FIB_COLORS = { 1: "#1F6B4A", 2: "#2D8B62", 3: "#84BD56", 5: "#D4A95C", 8: "#E08D3C", 13: "#D45F4A", 21: "#A82E2E" };
const FIB_LABEL = { 1: "Trivial", 2: "Très facile", 3: "Facile", 5: "Moyen", 8: "Difficile", 13: "Très difficile", 21: "Énorme" };

const STATUSES = [
  { id: "todo",    label: "À faire",   color: C.todo,    icon: "○" },
  { id: "doing",   label: "En cours",  color: C.doing,   icon: "◐" },
  { id: "review",  label: "En revue",  color: C.review,  icon: "◑" },
  { id: "done",    label: "Terminé",   color: C.done,    icon: "●" },
  { id: "blocked", label: "Bloqué",    color: C.blocked, icon: "✕" },
];

// ═══ MATRICE EISENHOWER — 4 quadrants ═══
const QUADRANTS = [
  { id: "do",       label: "Urgent & Important",       short: "À faire maintenant",       color: "#C73E47", emoji: "🔥", desc: "Crise, échéance, blocant" },
  { id: "schedule", label: "Important, pas urgent",    short: "À planifier",              color: "#1F6B4A", emoji: "📅", desc: "Stratégique, à programmer" },
  { id: "delegate", label: "Urgent, pas important",    short: "À déléguer",               color: "#D4A95C", emoji: "👥", desc: "Pression mais peu de valeur" },
  { id: "drop",     label: "Pas urgent, pas important", short: "À éliminer ou plus tard", color: "#8B92A3", emoji: "🗑️", desc: "Distractions, faible ROI" },
];

// ═══ ÉQUIPE ═══
const TEAM = [
  { id: "basile", name: "Basile", color: "#0F1B2D", initials: "B" },
  { id: "greg",   name: "Greg",   color: "#1F6B4A", initials: "G" },
  { id: "hippo",  name: "Hippo",  color: "#D4A95C", initials: "H" },
  { id: "aurore", name: "Aurore", color: "#A82E2E", initials: "A" },
  { id: "unassigned", name: "Non assigné", color: "#8B92A3", initials: "?" },
];

const PHASES = [
  { id: "p0",  label: "Phase 0 — Validation & Recherches",   short: "P0 Validation",  period: "Mois 0-1",  color: "#A855F7" },
  { id: "p1",  label: "Phase 1 — Légal & Structuration",     short: "P1 Légal",       period: "Mois 1-2",  color: "#3B82F6" },
  { id: "p2",  label: "Phase 2 — Design & UX",               short: "P2 Design",      period: "Mois 2-3",  color: "#EC4899" },
  { id: "p3",  label: "Phase 3 — Infra & Architecture",      short: "P3 Infra",       period: "Mois 2-3",  color: "#06B6D4" },
  { id: "p4",  label: "Phase 4 — Dev MVP Backend",           short: "P4 Backend",     period: "Mois 3-5",  color: "#10B981" },
  { id: "p5",  label: "Phase 5 — Dev MVP Frontend",          short: "P5 Frontend",    period: "Mois 3-5",  color: "#84CC16" },
  { id: "p6",  label: "Phase 6 — Sécurité & Qualité",        short: "P6 Sécurité",    period: "Mois 4-5",  color: "#F59E0B" },
  { id: "p7",  label: "Phase 7 — Pré-lancement & Marketing", short: "P7 Marketing",   period: "Mois 4-5",  color: "#F97316" },
  { id: "p8",  label: "Phase 8 — Lancement",                 short: "P8 Lancement",   period: "Mois 5-6",  color: "#EF4444" },
  { id: "p9",  label: "Phase 9 — V1 Automatisation",         short: "P9 V1",          period: "Mois 5-8",  color: "#D4A95C" },
  { id: "p10", label: "Phase 10 — Scale & Série A",          short: "P10 Scale",      period: "Mois 8-12", color: "#A855F7" },
  { id: "p11", label: "Phase 11 — International & V3",       short: "P11 Intl",       period: "Mois 12+",  color: "#3B82F6" },
];

// ═══════════════════════════════════════════════════════════════
// 159 TICKETS — chacun avec quadrant Eisenhower + assignee
// ═══════════════════════════════════════════════════════════════
const DEFAULT_TICKETS = [
  // === P0 — VALIDATION ===
  { id: "T001", phase: "p0", title: "Définir l'ICP précis et 3 personas détaillés", desc: "Profil démographique, psychographique, comportemental. Inclure : âge, revenu, profession, douleurs, motivations, freins, canaux de découverte. Créer 3 personas distincts (ex: salarié 30 ans, freelance 35 ans, jeune cadre 26 ans).", fib: 3, status: "todo", deps: "", quadrant: "do",       assignee: "basile" },
  { id: "T002", phase: "p0", title: "Mener 15 entretiens utilisateurs ciblés", desc: "Recruter via LinkedIn, Reddit, réseau perso. Script Mom Test : 'Parle-moi de la dernière fois où tu as eu un problème d'argent', 'Comment tu gères tes abonnements ?'. Enregistrer + transcrire. Identifier patterns récurrents.", fib: 5, status: "todo", deps: "T001", quadrant: "do",   assignee: "basile" },
  { id: "T003", phase: "p0", title: "Sondage en ligne 200+ répondants", desc: "Typeform/Tally. 15 questions max : douleurs financières, WTP, apps utilisées, freins. Diffuser sur Reddit (r/vosfinances), Twitter, Facebook groups. Budget pub Meta 100€ pour booster.", fib: 5, status: "todo", deps: "T001", quadrant: "schedule", assignee: "aurore" },
  { id: "T004", phase: "p0", title: "Analyse approfondie Bankin' (concurrent #1)", desc: "Télécharger l'app, créer un compte, tester toutes les fonctionnalités. Documenter : tarifs, onboarding, UX, modules, points faibles. Lire 100+ avis App Store/Play Store. Identifier les frustrations récurrentes.", fib: 5, status: "todo", deps: "", quadrant: "do",        assignee: "hippo" },
  { id: "T005", phase: "p0", title: "Analyse approfondie Lydia/Sumeria", desc: "Test complet, mapping features, lecture reviews. Focus sur leur stratégie de monétisation et leur conflit d'intérêts en tant que néobanque vs Alfred neutre.", fib: 5, status: "todo", deps: "", quadrant: "schedule",                               assignee: "hippo" },
  { id: "T006", phase: "p0", title: "Analyse approfondie Linxo + Cleo + Origin", desc: "Trois apps PFM avec touches d'IA. Tester Linxo (FR), Cleo (UK avec tone fun), Origin (US wealth). Identifier ce qui manque chez chacun et pourquoi ils ne convertissent pas.", fib: 5, status: "todo", deps: "", quadrant: "schedule",      assignee: "hippo" },
  { id: "T007", phase: "p0", title: "Étude de cas Rocket Money (modèle US à dupliquer)", desc: "Étudier en détail leur modèle 'négociation as a service', leurs partenariats, leur pricing (3-12$/mois + 40% économie mois 1). Comprendre pourquoi ils ne viennent pas en EU. Lire toutes leurs interviews fondateurs.", fib: 3, status: "todo", deps: "", quadrant: "schedule", assignee: "aurore" },
  { id: "T008", phase: "p0", title: "Analyse concurrents indirects (Selectra, Papernest, AirHelp)", desc: "Comparateurs et services de récupération. Comprendre leurs commissions, leurs partenariats, leurs taux de conversion. Sources d'opportunités de partenariats pour Alfred.", fib: 3, status: "todo", deps: "", quadrant: "schedule",  assignee: "hippo" },
  { id: "T009", phase: "p0", title: "Veille Reddit r/vosfinances + r/JeuneActif", desc: "Lire les 200 derniers posts populaires. Documenter douleurs récurrentes : abos, banques, fiscalité, énergie, vols, négociation. Créer un fichier de citations utilisables en marketing.", fib: 2, status: "todo", deps: "", quadrant: "delegate",          assignee: "aurore" },
  { id: "T010", phase: "p0", title: "Veille TikTok/Instagram sur la finance perso FR", desc: "Identifier les hooks qui marchent, les créateurs influents, les formats viraux. Cartographier les comptes 50k-500k followers en finance perso pour partenariats futurs.", fib: 2, status: "todo", deps: "", quadrant: "delegate",                  assignee: "aurore" },
  { id: "T011", phase: "p0", title: "Calcul TAM/SAM/SOM affiné avec sources", desc: "Croiser sources : Statista, IBISWorld, Grand View Research, Banque de France. Méthodologie top-down + bottom-up. Justifier chaque hypothèse. Document partagé pour pitch deck VC.", fib: 3, status: "todo", deps: "", quadrant: "schedule",            assignee: "basile" },
  { id: "T012", phase: "p0", title: "Définir la VRAIE proposition de valeur (PVU)", desc: "Pas une description marketing — une équation : 'Pour [ICP] qui [douleur], Alfred est [catégorie] qui [bénéfice unique], contrairement à [alternative]'. Itérer 10 versions. Tester en interviews.", fib: 5, status: "todo", deps: "T001,T002", quadrant: "do", assignee: "basile" },
  { id: "T013", phase: "p0", title: "Identifier 3 différenciateurs durables (moats)", desc: "Pas des features — des barrières à l'entrée : données accumulées, partenariats exclusifs, neutralité structurelle, compliance avancée. Documenter pourquoi un concurrent ne peut pas copier en 6 mois.", fib: 3, status: "todo", deps: "T012", quadrant: "do",  assignee: "basile" },
  { id: "T014", phase: "p0", title: "Test A/B 3 messages publicitaires sur landing fictive", desc: "3 variantes de landing simple (Webflow). 100€ Meta Ads vers chaque. Mesurer CTR + taux d'inscription waitlist. Le gagnant définit le messaging principal.", fib: 5, status: "todo", deps: "T012", quadrant: "schedule",                       assignee: "greg" },
  { id: "T015", phase: "p0", title: "Mesure WTP via 50 mini-interviews", desc: "Question-clé : 'Si je te garantissais 600€ d'économies par an, combien serais-tu prêt à payer par mois ?'. Distribution des réponses → pricing optimal entre 4,99 et 14,99€.", fib: 5, status: "todo", deps: "T002", quadrant: "do",                       assignee: "basile" },
  { id: "T016", phase: "p0", title: "Validation problem-solution fit (go/no-go)", desc: "Critère : 70%+ des interviewés disent 'oui je paierais pour ça'. Si non → pivoter le concept ou l'ICP. Décision écrite avant phase 1.", fib: 3, status: "todo", deps: "T002,T015", quadrant: "do",                                                  assignee: "basile" },
  { id: "T017", phase: "p0", title: "Élevator pitch + tagline finalisés", desc: "30 secondes max. Doit faire comprendre : qui (ICP), quoi (Alfred fait X), pourquoi unique (vs Y), preuve (économie moyenne). Tester sur 10 personnes hors cible.", fib: 1, status: "todo", deps: "T012", quadrant: "do",                                       assignee: "basile" },

  // === P1 — LÉGAL ===
  { id: "T018", phase: "p1", title: "Recherche INPI : disponibilité 'Alfred' (classes 9, 36, 42)", desc: "Vérifier sur la base INPI que 'Alfred' n'est pas déposé en classe 9 (apps), 36 (services financiers), 42 (services techno). Si conflit → trouver alternative. Coût : 0€.", fib: 1, status: "todo", deps: "", quadrant: "do",                       assignee: "basile" },
  { id: "T019", phase: "p1", title: "Réservation domaines (.com, .fr, .app, .io)", desc: "Acheter sur OVH ou Gandi. Budget ~100-300€ selon disponibilité. Si .com pas dispo, alternatives : alfred.fr, alfred.app, getalfred.com, alfred-app.com.", fib: 1, status: "todo", deps: "T018", quadrant: "do",                                          assignee: "basile" },
  { id: "T020", phase: "p1", title: "Réservation handles sociaux", desc: "Instagram, TikTok, Twitter/X, LinkedIn, YouTube, Facebook. Tous en @alfred ou @alfredapp ou @getalfred. Cohérence absolue. Faire vite avant qu'un autre les prenne.", fib: 1, status: "todo", deps: "T018", quadrant: "do",                                                  assignee: "aurore" },
  { id: "T021", phase: "p1", title: "Choix structure juridique : SAS vs SASU", desc: "SAS si 2+ associés, SASU si solo. Consulter expert-comptable (1h gratuite). Avantages SAS : flexibilité, image pro, levée de fonds facile. Coût création ~500-1500€.", fib: 2, status: "todo", deps: "", quadrant: "do",                                       assignee: "basile" },
  { id: "T022", phase: "p1", title: "Création de l'entité légale + statuts", desc: "Via LegalStart, Captain Contrat ou notaire. Capital minimum 1€ (recommandé 1000-10000€). Définir parts sociales, dirigeants, siège social. Délai 2-3 semaines.", fib: 3, status: "todo", deps: "T021", quadrant: "do",                                       assignee: "basile" },
  { id: "T023", phase: "p1", title: "Ouverture compte bancaire pro", desc: "Qonto ou Shine pour rapidité (24-48h). Frais ~9-20€/mois. Lié au K-bis de la société. Nécessaire pour tous les contrats fournisseurs et facturation.", fib: 1, status: "todo", deps: "T022", quadrant: "do",                                                                  assignee: "basile" },
  { id: "T024", phase: "p1", title: "Dépôt INPI : marque + logo", desc: "Une fois logo finalisé. ~250€ pour 1 classe, +42€ par classe additionnelle. Couvrir classes 9, 36, 42. Protection 10 ans renouvelable.", fib: 3, status: "todo", deps: "T018", quadrant: "schedule",                                                                            assignee: "basile" },
  { id: "T025", phase: "p1", title: "Étude juridique : licence AISP propre vs partenariat agrégateur", desc: "Décision stratégique majeure. AISP propre = 50-150k€ + 6 mois. Partenariat (Powens/Bridge) = délégation, plus rapide, moins coûteux. Recommandation MVP : partenariat. Documenter pour pitch VC.", fib: 5, status: "todo", deps: "", quadrant: "do", assignee: "greg" },
  { id: "T026", phase: "p1", title: "Demo + tarification Powens", desc: "Contacter sales Powens (ex-Budget Insight). Demander : pricing par user, par appel API, SLA, support, qualité matching merchants, banques couvertes. Demander accès sandbox.", fib: 2, status: "todo", deps: "", quadrant: "do",                                                  assignee: "greg" },
  { id: "T027", phase: "p1", title: "Demo + tarification Bridge by Bankin'", desc: "Contacter sales Bridge. Mêmes critères. Avantage Bridge : qualité matching réputée meilleure. Inconvénient : owned by Bankin' = concurrent indirect. À évaluer.", fib: 2, status: "todo", deps: "", quadrant: "do",                                              assignee: "greg" },
  { id: "T028", phase: "p1", title: "Demo + tarification Tink (Visa)", desc: "Pour couverture EU élargie (V2/V3). Plus cher mais coverage paneuropéen. Utile si lancement BE/LU/DE prévu rapidement.", fib: 2, status: "todo", deps: "", quadrant: "schedule",                                                                                          assignee: "greg" },
  { id: "T029", phase: "p1", title: "Choix final agrégateur DSP2", desc: "Décision basée sur : pricing au volume, qualité matching, banques FR couvertes (>95%), API moderne, support technique, SLA >99.5%. Documenter le scoring.", fib: 1, status: "todo", deps: "T026,T027,T028", quadrant: "do",                                                  assignee: "greg" },
  { id: "T030", phase: "p1", title: "Négociation et signature contrat agrégateur", desc: "Cycle 2-4 semaines. Points clés : volumes minimums, prix dégressifs, clauses d'exclusivité (à éviter), SLA, RGPD compliance, transferts de données, durée d'engagement.", fib: 5, status: "todo", deps: "T029", quadrant: "do",                       assignee: "basile" },
  { id: "T031", phase: "p1", title: "Rédaction CGU avec avocat fintech", desc: "Avocat spécialisé (Dechert, August Debouzy, ou cabinet boutique). Budget 3-6k€. Couvrir : nature du service (information, pas de conseil financier), responsabilité, traitement erreurs IA, résiliation.", fib: 8, status: "todo", deps: "", quadrant: "schedule", assignee: "basile" },
  { id: "T032", phase: "p1", title: "Politique de confidentialité RGPD complète", desc: "Avec l'avocat. Documenter : données collectées, finalités, durée de conservation, sous-traitants (Powens, AWS, Stripe), droits utilisateurs, transferts hors UE.", fib: 5, status: "todo", deps: "T031", quadrant: "schedule",                       assignee: "basile" },
  { id: "T033", phase: "p1", title: "Désignation DPO (interne ou externe)", desc: "Obligatoire si traitement à grande échelle de données financières. DPO externe ~3-8k€/an chez Privacy Tech, Lexing, Dastra. Plus simple en early-stage qu'un DPO salarié.", fib: 3, status: "todo", deps: "T032", quadrant: "schedule",                       assignee: "basile" },
  { id: "T034", phase: "p1", title: "Mise en place registre RGPD (Article 30)", desc: "Document obligatoire. Lister tous les traitements de données, finalités, catégories de personnes, durées, sous-traitants. Outil : Dastra, OneTrust ou Notion structuré.", fib: 3, status: "todo", deps: "T033", quadrant: "schedule",                   assignee: "basile" },
  { id: "T035", phase: "p1", title: "Préparation dossier conformité AI Act", desc: "AI Act EU entré en vigueur en 2024-2026. Alfred = 'limited risk AI'. Obligations : transparence, explicabilité des décisions automatisées, droit de contester. Préparer documentation technique.", fib: 5, status: "todo", deps: "T032", quadrant: "schedule",  assignee: "greg" },
  { id: "T036", phase: "p1", title: "Souscription cyber-assurance", desc: "Couvre : data breach, RC pro, atteinte à l'image, frais de notification CNIL. ~2-5k€/an pour démarrage. Hiscox, AIG, Stoïk (spécialiste tech). Indispensable dès qu'on traite des données financières.", fib: 3, status: "todo", deps: "T022", quadrant: "schedule",     assignee: "basile" },
  { id: "T037", phase: "p1", title: "Mentions légales + Conditions de vente complètes", desc: "Sur la landing et l'app. Inclure : éditeur, hébergeur, médiateur de la consommation, droit de rétractation, conditions de remboursement (garantie 90j).", fib: 2, status: "todo", deps: "T031", quadrant: "schedule",                                  assignee: "basile" },

  // === P2 — DESIGN ===
  { id: "T038", phase: "p2", title: "Création du logo Alfred (designer ou Fiverr)", desc: "Brief : élégant, classe, encre/champagne, nœud papillon (charte Alfred). Budget : 200-2000€ selon designer. 3 variantes minimum, livrables vectoriels (SVG, PDF, AI).", fib: 3, status: "done", deps: "", quadrant: "do",                              assignee: "hippo" },
  { id: "T039", phase: "p2", title: "Brand book Alfred complet", desc: "Document Figma 20-30 pages : logo + variantes, palette couleurs (encre #0F1B2D, champagne #D4A95C, ivoire #F7F3EB, émeraude #1F6B4A), typographie, iconographie, ton de voix.", fib: 5, status: "doing", deps: "T038", quadrant: "do",                                       assignee: "hippo" },
  { id: "T040", phase: "p2", title: "User personas détaillés (3 minimum)", desc: "Format Figma ou Notion. Chaque persona : photo, citation, démographique, contexte, douleurs, objectifs, freins, déclencheurs d'achat, canaux préférés. Basé sur les entretiens utilisateurs réels.", fib: 5, status: "todo", deps: "T002", quadrant: "do",          assignee: "hippo" },
  { id: "T041", phase: "p2", title: "User journey mapping de bout en bout", desc: "Du premier contact (TikTok/SEO) → onboarding → première économie → fidélisation → recommandation. Identifier touchpoints, émotions, frictions à chaque étape.", fib: 5, status: "todo", deps: "T040", quadrant: "schedule",                                  assignee: "hippo" },
  { id: "T042", phase: "p2", title: "Wireframes basse fidélité (Whimsical)", desc: "Tous les écrans de l'app en simple wireframe. Pas de design final. Objectif : valider la structure et la navigation. Couvrir 100% du parcours MVP.", fib: 5, status: "todo", deps: "T041", quadrant: "schedule",                                              assignee: "hippo" },
  { id: "T043", phase: "p2", title: "Maquettes haute fidélité — Onboarding", desc: "Figma. 8-12 écrans : welcome, explication valeur, demande permissions, connexion bancaire DSP2, premier scan, premier insight. Animations clés. Mode clair + sombre.", fib: 8, status: "todo", deps: "T039,T042", quadrant: "do",                              assignee: "hippo" },
  { id: "T044", phase: "p2", title: "Maquettes haute fidélité — Dashboard principal", desc: "Vue d'ensemble : économies du mois, alertes en attente, actions récentes, modules actifs. Design system rigoureux, cohérent avec le brand.", fib: 8, status: "todo", deps: "T039,T042", quadrant: "do",                                                assignee: "hippo" },
  { id: "T045", phase: "p2", title: "Maquettes module factures à venir", desc: "Liste des factures détectées, alertes 5j avant, action 'Mettre de côté' en un tap, historique.", fib: 5, status: "todo", deps: "T044", quadrant: "schedule",                                                                                                            assignee: "hippo" },
  { id: "T046", phase: "p2", title: "Maquettes module abonnements morts", desc: "Liste avec score d'utilisation, propositions de résiliation, lettres préremplies, suivi des résiliations en cours.", fib: 5, status: "todo", deps: "T044", quadrant: "schedule",                                                                                       assignee: "hippo" },
  { id: "T047", phase: "p2", title: "Design system Alfred (composants Figma)", desc: "Bibliothèque de composants réutilisables : boutons, inputs, cards, modals, alerts, navigation, charts. Naming convention rigoureuse. Auto-layout systématique.", fib: 8, status: "todo", deps: "T039", quadrant: "schedule",                                  assignee: "hippo" },
  { id: "T048", phase: "p2", title: "Prototype interactif Figma (clickable)", desc: "Tous les écrans liés avec interactions. Doit pouvoir simuler le parcours complet 'install → première économie' sans coder.", fib: 5, status: "todo", deps: "T043,T044,T045,T046", quadrant: "schedule",                                                          assignee: "hippo" },
  { id: "T049", phase: "p2", title: "Tests utilisateurs sur prototype (10 personnes)", desc: "Sessions 30 min via Maze ou Lookback. Identifier frictions, malentendus, abandons. Itérer 2 fois avant de coder. Chaque test évite 50h de dev.", fib: 5, status: "todo", deps: "T048", quadrant: "do",                                                  assignee: "aurore" },
  { id: "T050", phase: "p2", title: "Itération design selon feedback tests", desc: "Documenter chaque itération avec versions. Critère go/no-go : 80%+ des testeurs comprennent la valeur en <60s.", fib: 5, status: "todo", deps: "T049", quadrant: "schedule",                                                                                       assignee: "hippo" },

  // === P3 — INFRA ===
  { id: "T051", phase: "p3", title: "Choix stack backend (Node.js vs Python FastAPI)", desc: "Critères : écosystème IA (Python > Node), perf (équivalent), recrutement (Node plus large), expérience équipe. Recommandation : Python FastAPI si IA-heavy, Node si team JS.", fib: 3, status: "todo", deps: "", quadrant: "do",                       assignee: "greg" },
  { id: "T052", phase: "p3", title: "Choix stack frontend mobile (React Native vs Flutter)", desc: "RN : écosystème JS, recrutement facile. Flutter : perf supérieures, plus jeune. Pour Alfred (UX mobile + recrutement) : RN + Expo recommandé.", fib: 3, status: "todo", deps: "", quadrant: "do",                                                  assignee: "greg" },
  { id: "T053", phase: "p3", title: "Choix cloud provider (AWS eu-west vs OVH vs Scaleway)", desc: "AWS = leader, écosystème, eu-west-1 RGPD compliant. OVH/Scaleway = souveraineté FR, moins cher. Trade-off à arbitrer. Coût MVP : 200-500€/mois.", fib: 3, status: "todo", deps: "", quadrant: "do",                                              assignee: "greg" },
  { id: "T054", phase: "p3", title: "Architecture système globale (diagram + ADR)", desc: "Schéma archi : mobile → API gateway → microservices → DB. Documenter chaque décision en ADR. Minimum 5 ADR : monolithe vs micro, BDD, queue, cache, secrets.", fib: 8, status: "todo", deps: "T051,T053", quadrant: "do",                              assignee: "greg" },
  { id: "T055", phase: "p3", title: "Schéma base de données PostgreSQL", desc: "Tables : users, accounts, transactions, subscriptions, alerts, actions, savings_history, payments. Contraintes, index, relations, triggers. Considérer le sharding futur.", fib: 5, status: "todo", deps: "T054", quadrant: "do",                                  assignee: "greg" },
  { id: "T056", phase: "p3", title: "Spécifications API (OpenAPI/Swagger)", desc: "Documenter tous les endpoints : auth, users, accounts, transactions, actions. Versionning v1. Réponses standardisées. Codes d'erreur. À utiliser pour générer les SDK mobile.", fib: 5, status: "todo", deps: "T054", quadrant: "schedule",                  assignee: "greg" },
  { id: "T057", phase: "p3", title: "Setup repo GitHub (mono ou multi)", desc: "Mono-repo avec Turborepo recommandé pour solo/petite équipe. Branches : main (prod), staging, develop. Branch protection rules.", fib: 1, status: "todo", deps: "", quadrant: "do",                                                                                          assignee: "greg" },
  { id: "T058", phase: "p3", title: "Setup CI/CD GitHub Actions", desc: "Pipelines : tests automatiques sur PR, lint, type-check, build, déploiement automatique sur staging, déploiement manuel sur prod. Secrets via GitHub.", fib: 3, status: "todo", deps: "T057", quadrant: "schedule",                                                            assignee: "greg" },
  { id: "T059", phase: "p3", title: "Setup environnements (dev, staging, prod)", desc: "3 envs distincts sur AWS. Variables d'env via Doppler ou AWS Secrets Manager. Bases de données isolées. URLs distinctes.", fib: 5, status: "todo", deps: "T053", quadrant: "schedule",                                                                          assignee: "greg" },
  { id: "T060", phase: "p3", title: "Setup monitoring (Sentry + Datadog/Grafana)", desc: "Sentry pour les erreurs (front + back), Datadog ou Grafana Cloud pour metrics + logs. Alertes Slack en cas d'incident.", fib: 3, status: "todo", deps: "T059", quadrant: "schedule",                                                                       assignee: "greg" },
  { id: "T061", phase: "p3", title: "Setup analytics produit (Mixpanel ou PostHog)", desc: "PostHog cloud recommandé : open source, pricing fair, RGPD compliant en EU. Setup events tracking dès J1 du dev. Dashboards de cohortes.", fib: 2, status: "todo", deps: "", quadrant: "schedule",                                                          assignee: "greg" },
  { id: "T062", phase: "p3", title: "Configuration DNS et certificats SSL", desc: "Cloudflare ou Route53 pour DNS. Let's Encrypt via AWS Certificate Manager. Wildcard pour sous-domaines (api.alfred.app, admin.alfred.app).", fib: 2, status: "todo", deps: "T019", quadrant: "schedule",                                                          assignee: "greg" },

  // === P4 — BACKEND ===
  { id: "T063", phase: "p4", title: "Backend : API Gateway + middleware globaux", desc: "Setup FastAPI/Express. Middleware : auth, rate limiting, CORS, request logging, error handling. Health check endpoint. Versionning /v1.", fib: 5, status: "todo", deps: "T056", quadrant: "do",                                                                  assignee: "greg" },
  { id: "T064", phase: "p4", title: "Backend : Service authentification (JWT + refresh)", desc: "Sign up, sign in, refresh token, password reset, magic link. Hash bcrypt. JWT 15 min + refresh 30j. Email vérification obligatoire.", fib: 8, status: "todo", deps: "T063", quadrant: "do",                                                          assignee: "greg" },
  { id: "T065", phase: "p4", title: "Backend : Intégration agrégateur DSP2 (Powens/Bridge)", desc: "Onboarding flow : SDK / WebView pour connexion bancaire, callback de validation, stockage tokens chiffrés, refresh consent tous les 90j (DSP2). Gestion erreurs.", fib: 13, status: "todo", deps: "T030,T063", quadrant: "do",                  assignee: "greg" },
  { id: "T066", phase: "p4", title: "Backend : Service utilisateurs + profils", desc: "CRUD user, gestion préférences, paramètres notifications, consentements RGPD, suppression compte (droit à l'oubli).", fib: 5, status: "todo", deps: "T064", quadrant: "schedule",                                                                                  assignee: "greg" },
  { id: "T067", phase: "p4", title: "Backend : Service transactions (parsing + normalisation)", desc: "Récupération via agrégateur, normalisation merchants (Spotify vs SPOTIFY*123), classification automatique, détection récurrences, enrichissement (logos, types).", fib: 8, status: "todo", deps: "T065", quadrant: "do",                  assignee: "greg" },
  { id: "T068", phase: "p4", title: "Backend : Service détection abonnements (algo ML)", desc: "Algorithme de détection de récurrence : montants similaires, intervalles réguliers, mêmes merchants. ML classifier pour 'abonnement vs paiement ponctuel'. Dataset training : 10k transactions labellisées.", fib: 13, status: "todo", deps: "T067", quadrant: "do", assignee: "greg" },
  { id: "T069", phase: "p4", title: "Backend : Service détection factures à venir", desc: "Prédiction : sur la base des récurrences passées, prévoir factures EDF, internet, etc. Alerter 5 jours avant. Adaptable selon le pattern utilisateur.", fib: 8, status: "todo", deps: "T067", quadrant: "do",                                          assignee: "greg" },
  { id: "T070", phase: "p4", title: "Backend : Service notifications (Firebase FCM + emails)", desc: "Push notifications mobile (Firebase), emails transactionnels (Resend ou SendGrid). Templates customisés. Préférences user respectées.", fib: 5, status: "todo", deps: "T066", quadrant: "schedule",                                          assignee: "greg" },
  { id: "T071", phase: "p4", title: "Backend : Intégration Stripe (abonnements)", desc: "Stripe Subscriptions API. Plans Free/Alfred+/Pro. Webhooks pour gérer renouvellements, échecs de paiement, annulations. Période d'essai 14j.", fib: 5, status: "todo", deps: "T064", quadrant: "do",                                                          assignee: "greg" },
  { id: "T072", phase: "p4", title: "Backend : Service consentements DSP2 (re-auth 90j)", desc: "Détection des consentements qui expirent dans 7-14j, notification user, flow de renouvellement, fallback si expiré (mode dégradé).", fib: 8, status: "todo", deps: "T065", quadrant: "schedule",                                                  assignee: "greg" },
  { id: "T073", phase: "p4", title: "Backend : API publique pour app mobile", desc: "Endpoints REST pour tous les besoins mobile. Réponses optimisées (pagination, filtrage, projection). GraphQL en option pour V2.", fib: 5, status: "todo", deps: "T067,T068,T069", quadrant: "schedule",                                                          assignee: "greg" },
  { id: "T074", phase: "p4", title: "Backend : Webhook handlers (Powens, Stripe)", desc: "Endpoints pour recevoir events agrégateur (nouvelles transactions) et Stripe (paiements). Validation signatures. Idempotence. Retry automatique.", fib: 5, status: "todo", deps: "T065,T071", quadrant: "schedule",                                       assignee: "greg" },
  { id: "T075", phase: "p4", title: "Backend : Tests unitaires (couverture > 70%)", desc: "Pytest ou Jest. Mocks pour services externes. CI bloque les PR avec coverage en baisse. Focus sur la logique métier critique.", fib: 8, status: "todo", deps: "T063", quadrant: "schedule",                                                                  assignee: "greg" },
  { id: "T076", phase: "p4", title: "Backend : Documentation API (Swagger UI)", desc: "Documentation auto-générée via OpenAPI. Hébergée sur api.alfred.app/docs. Examples de requests/responses. Versionning visible.", fib: 3, status: "todo", deps: "T056,T073", quadrant: "delegate",                                                                  assignee: "greg" },

  // === P5 — FRONTEND ===
  { id: "T077", phase: "p5", title: "Setup React Native + Expo", desc: "Init projet avec Expo. Config TypeScript. Linting (ESLint), formatting (Prettier). Config build iOS + Android. Test sur simulateurs.", fib: 2, status: "todo", deps: "T052", quadrant: "do",                                                                                            assignee: "greg" },
  { id: "T078", phase: "p5", title: "Frontend : Système de navigation (React Navigation)", desc: "Stack + Tab navigation. Routes typées. Deep linking (alfred://). Gestion auth state (logged in vs out).", fib: 5, status: "todo", deps: "T077", quadrant: "do",                                                                                          assignee: "greg" },
  { id: "T079", phase: "p5", title: "Frontend : Composants design system (Storybook)", desc: "Implémenter tous les composants du design system Figma. Storybook pour les visualiser. Tests visuels. ~30-50 composants.", fib: 8, status: "todo", deps: "T047,T077", quadrant: "schedule",                                                            assignee: "greg" },
  { id: "T080", phase: "p5", title: "Frontend : Écrans d'onboarding", desc: "5-8 écrans : welcome, valeur prop, permissions, connexion bancaire, premier scan, configuration alertes. Animations Reanimated. Skip possible.", fib: 5, status: "todo", deps: "T043,T079", quadrant: "do",                                                              assignee: "greg" },
  { id: "T081", phase: "p5", title: "Frontend : Écran connexion bancaire DSP2", desc: "WebView pour SDK Powens/Bridge. Loader pendant scan. Gestion erreurs (banque indispo, user refuse). Confirmation succès.", fib: 8, status: "todo", deps: "T065,T080", quadrant: "do",                                                                          assignee: "greg" },
  { id: "T082", phase: "p5", title: "Frontend : Dashboard principal", desc: "Vue d'ensemble : économies cumulées, alertes en cours, actions à valider, modules actifs. Pull-to-refresh. Charts économies (Victory ou Recharts).", fib: 8, status: "todo", deps: "T044,T079", quadrant: "do",                                                          assignee: "greg" },
  { id: "T083", phase: "p5", title: "Frontend : Module factures à venir", desc: "Liste avec dates, montants, action 'mettre de côté'. Filtre par type. Historique des factures passées.", fib: 5, status: "todo", deps: "T045,T082", quadrant: "schedule",                                                                                                  assignee: "greg" },
  { id: "T084", phase: "p5", title: "Frontend : Module abonnements morts", desc: "Liste avec score d'utilisation, dernière utilisation, montant cumulé perdu, action 'résilier'. Confirmation avant action.", fib: 5, status: "todo", deps: "T046,T082", quadrant: "schedule",                                                                          assignee: "greg" },
  { id: "T085", phase: "p5", title: "Frontend : Module prélèvements suspects", desc: "Liste des transactions inconnues. Action 'reconnaître' (false positive) ou 'contester' (génère lettre). Historique des contestations.", fib: 5, status: "todo", deps: "T082", quadrant: "schedule",                                                            assignee: "greg" },
  { id: "T086", phase: "p5", title: "Frontend : Notifications push (config)", desc: "Setup Firebase. Demande permission au bon moment (pas à l'install). Préférences granulaires. Deep linking depuis notif.", fib: 3, status: "todo", deps: "T070,T077", quadrant: "schedule",                                                                       assignee: "greg" },
  { id: "T087", phase: "p5", title: "Frontend : Système de validation tap (1 tap action)", desc: "Composant réutilisable : 'Voici ce qu'Alfred propose, je lance ?'. Animation loading. Feedback succès. Undo possible 30s.", fib: 3, status: "todo", deps: "T079", quadrant: "do",                                                                  assignee: "greg" },
  { id: "T088", phase: "p5", title: "Frontend : Écran historique des actions", desc: "Timeline des actions Alfred : résiliations, alertes, contestations. Statut de chaque action. Économie réalisée cumulée.", fib: 3, status: "todo", deps: "T082", quadrant: "schedule",                                                                            assignee: "greg" },
  { id: "T089", phase: "p5", title: "Frontend : Écran paramètres utilisateur", desc: "Profil, préférences notifications, consentements RGPD, abonnement, comptes bancaires connectés (déconnecter), suppression compte.", fib: 3, status: "todo", deps: "T066", quadrant: "schedule",                                                                  assignee: "greg" },
  { id: "T090", phase: "p5", title: "Frontend : Écran abonnement Stripe (in-app)", desc: "Comparatif Free/Alfred+/Pro. CTA upgrade. Stripe Payment Sheet (RN SDK). Confirmation. Gestion downgrade/cancel.", fib: 5, status: "todo", deps: "T071,T079", quadrant: "do",                                                                              assignee: "greg" },
  { id: "T091", phase: "p5", title: "Frontend : Tests E2E (Detox ou Maestro)", desc: "Maestro recommandé : plus simple, YAML. Couvrir les 5 parcours critiques : signup, connexion bancaire, validation action, upgrade payment, suppression compte.", fib: 8, status: "todo", deps: "T080,T081,T082,T087,T090", quadrant: "schedule",              assignee: "greg" },
  { id: "T092", phase: "p5", title: "Frontend : Optimisation performances", desc: "Bundle size, lazy loading, image optimization, animations 60fps, démarrage app < 2s. Profiling avec Flipper.", fib: 5, status: "todo", deps: "T091", quadrant: "delegate",                                                                                              assignee: "greg" },

  // === P6 — SÉCURITÉ ===
  { id: "T093", phase: "p6", title: "Audit sécurité OWASP (interne)", desc: "Checklist OWASP Top 10. Test injection SQL, XSS, CSRF, broken auth, sensitive data exposure. Outils : OWASP ZAP, Burp Suite Community.", fib: 8, status: "todo", deps: "T063,T080", quadrant: "do",                                                                          assignee: "greg" },
  { id: "T094", phase: "p6", title: "Pentests externes (prestataire spécialisé)", desc: "Mandater un cabinet (Synacktiv, Wavestone, Almond). Coût 5-15k€. Test boîte noire + grise. Rapport d'audit obligatoire pour pitch VC.", fib: 8, status: "todo", deps: "T093", quadrant: "do",                                                                  assignee: "basile" },
  { id: "T095", phase: "p6", title: "Chiffrement AES-256 des données sensibles", desc: "Toutes les données financières en BDD chiffrées at-rest. Tokens bancaires dans AWS KMS. Clés rotation automatique 90j.", fib: 5, status: "todo", deps: "T055", quadrant: "do",                                                                              assignee: "greg" },
  { id: "T096", phase: "p6", title: "TLS 1.3 partout + HSTS", desc: "API en HTTPS only. HSTS preload. Certificats validés. Test SSLLabs Grade A+. Préparer la transition vers TLS 1.4 quand dispo.", fib: 2, status: "todo", deps: "T062", quadrant: "schedule",                                                                                            assignee: "greg" },
  { id: "T097", phase: "p6", title: "Rate limiting + anti-abuse", desc: "Limites par IP, par user, par endpoint. Cloudflare ou rate limiter custom. Anti-scraping. Détection de comportements anormaux.", fib: 3, status: "todo", deps: "T063", quadrant: "schedule",                                                                                      assignee: "greg" },
  { id: "T098", phase: "p6", title: "Plan de continuité d'activité (PCA)", desc: "Que se passe-t-il si AWS eu-west-1 down ? Si Powens down ? Documenter procédures, responsables, communications. Test annuel.", fib: 3, status: "todo", deps: "", quadrant: "schedule",                                                                                  assignee: "basile" },
  { id: "T099", phase: "p6", title: "Procédure incident RGPD (notification CNIL 72h)", desc: "Workflow documenté : détection breach, évaluation, notification CNIL, notification users. Templates prêts. Responsable identifié.", fib: 3, status: "todo", deps: "T033", quadrant: "schedule",                                                       assignee: "basile" },
  { id: "T100", phase: "p6", title: "Backup automatique BDD (daily + retention 30j)", desc: "Snapshots PostgreSQL automatiques. Backups crossregion. Test de restoration mensuel. Documenter le RTO/RPO.", fib: 3, status: "todo", deps: "T055", quadrant: "schedule",                                                                                  assignee: "greg" },

  // === P7 — PRÉ-LANCEMENT ===
  { id: "T101", phase: "p7", title: "Création landing page Webflow", desc: "Headline + sub, valeur prop, démo (GIF ou vidéo), social proof, FAQ, CTA waitlist. Mobile-first. Performance Lighthouse > 90.", fib: 5, status: "todo", deps: "T012,T038", quadrant: "do",                                                                                  assignee: "aurore" },
  { id: "T102", phase: "p7", title: "Système liste d'attente (Tally + Mailchimp)", desc: "Form Tally simple : email + 2 questions de qualification. Auto-add Mailchimp. Welcome email avec promesse de l'invitation bêta.", fib: 2, status: "todo", deps: "T101", quadrant: "do",                                                                  assignee: "aurore" },
  { id: "T103", phase: "p7", title: "Setup comptes sociaux (TikTok, Instagram, X, LinkedIn)", desc: "Bio cohérente, avatar = logo, lien vers landing. Suivre 50 comptes pertinents par plateforme pour amorcer.", fib: 1, status: "todo", deps: "T020,T038", quadrant: "do",                                                                            assignee: "aurore" },
  { id: "T104", phase: "p7", title: "Tournage 15 vidéos TikTok (3 hooks x 5 variantes)", desc: "Studio simple : phone, lumière LED, micro lavalier. Hooks : 'J'ai économisé X€', 'POV: ton banquier déteste cette app', 'Tu perds 1800€/an sans le savoir'.", fib: 8, status: "todo", deps: "T020", quadrant: "schedule",                          assignee: "aurore" },
  { id: "T105", phase: "p7", title: "5 articles SEO premiers (pillars)", desc: "Sujets : 'Comment résilier Free Mobile', 'Combien coûte une assurance habitation moyenne', 'Indemnisation vol annulé : guide 2026', 'Crédits d'impôts oubliés', 'Apps de finance perso comparées'.", fib: 5, status: "todo", deps: "", quadrant: "schedule",      assignee: "aurore" },
  { id: "T106", phase: "p7", title: "Setup newsletter (Substack ou Beehiiv)", desc: "Beehiiv recommandé : monétisation possible, design pro. Welcome series 5 emails automatiques. Premier numéro à J0 du launch.", fib: 2, status: "todo", deps: "", quadrant: "schedule",                                                                              assignee: "aurore" },
  { id: "T107", phase: "p7", title: "Identification 30 créateurs cibles (20 micro + 10 medium)", desc: "Excel : nom, plateforme, followers, engagement rate, contact, alignement. Cibler 50k-300k followers en finance/lifestyle FR.", fib: 3, status: "todo", deps: "", quadrant: "schedule",                                                          assignee: "aurore" },
  { id: "T108", phase: "p7", title: "Préparation kit créateurs (brief + assets)", desc: "PDF brief : valeurs Alfred, do's & don'ts, hooks suggérés, exemples de bons posts. Assets : logos, screenshots app, vidéos brutes utilisables.", fib: 3, status: "todo", deps: "T039,T107", quadrant: "schedule",                                          assignee: "aurore" },
  { id: "T109", phase: "p7", title: "Setup tracking publicitaire (UTM + pixels)", desc: "UTM par canal/campagne. Meta Pixel + TikTok Pixel installés. Conversions trackées (waitlist, install, abonnement).", fib: 2, status: "todo", deps: "T101", quadrant: "do",                                                                                      assignee: "aurore" },
  { id: "T110", phase: "p7", title: "Setup support client (Crisp ou Intercom)", desc: "Chat in-app + email. Auto-réponses pour questions fréquentes. Heures de réponse : <4h ouvrées au début.", fib: 3, status: "todo", deps: "", quadrant: "schedule",                                                                                                  assignee: "aurore" },
  { id: "T111", phase: "p7", title: "Création FAQ + docs aide (Notion ou Crisp)", desc: "30-50 questions courantes : sécurité, fonctionnement, tarifs, résiliation, RGPD. Search-friendly.", fib: 5, status: "todo", deps: "T110", quadrant: "schedule",                                                                                                    assignee: "aurore" },
  { id: "T112", phase: "p7", title: "Recrutement 100 bêta-testeurs (Reddit + waitlist)", desc: "Reddit (r/vosfinances, r/JeuneActif), Twitter, waitlist filtrée. Critères : ICP exact, engagés, pas concurrents. Inviter par email.", fib: 5, status: "todo", deps: "T102", quadrant: "do",                                                          assignee: "aurore" },

  // === P8 — LANCEMENT ===
  { id: "T113", phase: "p8", title: "Soft launch bêta privée (100 users)", desc: "TestFlight (iOS) + Firebase App Distribution (Android). Onboarding personnalisé. Slack ou Discord pour la communauté bêta.", fib: 5, status: "todo", deps: "T091,T112", quadrant: "do",                                                                                  assignee: "basile" },
  { id: "T114", phase: "p8", title: "Collecte feedback intensive bêta (NPS + interviews)", desc: "NPS automatique J7 et J30. 20 interviews 1-1 de 30 min. Categorisation feedback : bugs, UX, features manquantes, valeur perçue.", fib: 3, status: "todo", deps: "T113", quadrant: "do",                                                              assignee: "basile" },
  { id: "T115", phase: "p8", title: "Itération produit selon feedback bêta", desc: "Sprint de 2 semaines après collecte. Fix bugs critiques, améliore onboarding (top friction), simplifie messaging si besoin.", fib: 8, status: "todo", deps: "T114", quadrant: "do",                                                                                  assignee: "greg" },
  { id: "T116", phase: "p8", title: "Validation des unit economics initiaux", desc: "Calculer sur la cohorte bêta : % users qui économisent 30€+ en 30j, conversion free→payant, NPS, time to first value. Go/no-go avant launch public.", fib: 3, status: "todo", deps: "T114", quadrant: "do",                                                  assignee: "basile" },
  { id: "T117", phase: "p8", title: "Public launch sur App Store + Play Store", desc: "Soumission. Délais : iOS 24-72h, Android 7-14j. App Store Optimization : keywords, screenshots, description, vidéo. Premier rating ASAP.", fib: 5, status: "todo", deps: "T115", quadrant: "do",                                                              assignee: "basile" },
  { id: "T118", phase: "p8", title: "Activation Meta Ads (200€/jour, 3 creatives)", desc: "Audiences : Lookalike sur waitlist, intérêts finance/économie 25-45 ans FR. 3 creatives en A/B. Optimisation conversion (install + signup).", fib: 3, status: "todo", deps: "T109,T117", quadrant: "do",                                                  assignee: "aurore" },
  { id: "T119", phase: "p8", title: "Activation des partenariats créateurs", desc: "Contrats signés, briefs envoyés, calendrier publication coordonné (pas tout le même jour). Tracking codes promo uniques.", fib: 5, status: "todo", deps: "T108,T117", quadrant: "do",                                                                              assignee: "aurore" },
  { id: "T120", phase: "p8", title: "Lancement programme de parrainage", desc: "1 mois offert au parrain + 1 mois au filleul. Tracking via codes uniques. Limite anti-fraude. Partage facilité (lien WhatsApp).", fib: 3, status: "todo", deps: "T117", quadrant: "schedule",                                                                          assignee: "aurore" },
  { id: "T121", phase: "p8", title: "Pitch PR (Sifted, Maddyness, FrenchWeb, BFM Business)", desc: "Press release perso à chaque journaliste, pas de mass mail. Angle différencié pour chacun. Embargos coordonnés.", fib: 3, status: "todo", deps: "T117", quadrant: "schedule",                                                                  assignee: "basile" },
  { id: "T122", phase: "p8", title: "Suivi cohortes : rétention + conversion", desc: "Dashboard quotidien : D1/D7/D30 retention, conversion free→paid par cohorte, churn. Alerte si dégradation > 10%.", fib: 3, status: "todo", deps: "T061,T117", quadrant: "do",                                                                                  assignee: "basile" },

  // === P9 — V1 AUTOMATISATION ===
  { id: "T123", phase: "p9", title: "Module négociation forfaits mobile", desc: "Comparer le forfait actuel vs 5 offres marché. Si gap > 10€/mois, proposer portabilité auto (lettre + RIO). Partenariat avec courtiers (Selectra-like).", fib: 13, status: "todo", deps: "", quadrant: "do",                                                                  assignee: "greg" },
  { id: "T124", phase: "p9", title: "Module négociation assurances (auto, habitation, mutuelle)", desc: "À l'échéance annuelle, comparer + proposer changement. Loi Hamon pour résiliation. Lettres types personnalisées via Claude API. Partenariats courtiers.", fib: 13, status: "todo", deps: "", quadrant: "do",                                  assignee: "greg" },
  { id: "T125", phase: "p9", title: "Module indemnisations vols (EU 261/2004)", desc: "Détecter vols (transactions billets) → cross-référence avec API FlightStats pour annulations/retards > 3h → proposer réclamation 250-600€. Lettre type + suivi.", fib: 13, status: "todo", deps: "", quadrant: "schedule",                                  assignee: "greg" },
  { id: "T126", phase: "p9", title: "Système de commissions (tracking + 30% mois 1)", desc: "Pour chaque négociation gagnée, calculer économie mensuelle, prélever 30% du gain mois 1 sur la prochaine échéance Stripe. Transparence totale.", fib: 8, status: "todo", deps: "T071,T123", quadrant: "do",                                          assignee: "greg" },
  { id: "T127", phase: "p9", title: "LLM pour génération lettres de réclamation (Claude API)", desc: "Templates dynamiques : forfait, assurance, indemnisation vol, frais bancaires abusifs. Personnalisation contexte user. Validation humaine avant envoi (pour V1).", fib: 8, status: "todo", deps: "T123,T124,T125", quadrant: "do",          assignee: "greg" },
  { id: "T128", phase: "p9", title: "Interface human-in-loop (Retool)", desc: "Backoffice pour l'équipe ops. Voir les actions en attente de validation, réviser les lettres LLM, valider/rejeter avec un commentaire. Stats par opérateur.", fib: 5, status: "todo", deps: "T127", quadrant: "schedule",                                              assignee: "hippo" },
  { id: "T129", phase: "p9", title: "Partenariat 1 : courtier mobile (Selectra ou direct opérateur)", desc: "Négociation : commission 20-40€ par portabilité. Setup API ou flow manuel pour démarrer. Premier flux de revenus commissions.", fib: 5, status: "todo", deps: "", quadrant: "do",                                                          assignee: "basile" },
  { id: "T130", phase: "p9", title: "Partenariat 2 : courtier assurances", desc: "Réassurez-moi, Lovys, Leocare. Commissions 40-80€ par souscription. Intégration via API ou redirection.", fib: 5, status: "todo", deps: "", quadrant: "do",                                                                                                            assignee: "basile" },
  { id: "T131", phase: "p9", title: "Partenariat 3 : courtier énergie", desc: "Selectra, OVS, Papernest. Commissions 30-60€. Cycle de signature long (4-8 semaines).", fib: 5, status: "todo", deps: "", quadrant: "schedule",                                                                                                                              assignee: "basile" },
  { id: "T132", phase: "p9", title: "Module simulation what-if V1 (modèle prédictif)", desc: "Q : 'Je peux m'acheter une PS5 ?' → modèle Prophet + LLM pour répondre en langage naturel sur la base des dépenses réelles. C'est LE différenciateur produit.", fib: 21, status: "todo", deps: "T067", quadrant: "schedule",                          assignee: "greg" },
  { id: "T133", phase: "p9", title: "Module gestion couple/coloc (dépenses partagées)", desc: "User indique coloc/conjoint (sans data sharing au début). Tag transactions partagées. Calcul du 'vrai' budget perso. Critique pour 60% de l'ICP.", fib: 13, status: "todo", deps: "T067", quadrant: "schedule",                                       assignee: "greg" },
  { id: "T134", phase: "p9", title: "Module détection fraude/transactions louches", desc: "ML anomalie detection : montant inhabituel, merchant inconnu, géo improbable. Notification immédiate + action 'bloquer ma carte' (lien banque).", fib: 8, status: "todo", deps: "T068", quadrant: "schedule",                                          assignee: "greg" },
  { id: "T135", phase: "p9", title: "Module veille voyages & hôtels", desc: "User saisit dates + destination → surveillance prix Skyscanner/Booking. Alerte au creux, achat en un tap (commission affiliée).", fib: 8, status: "todo", deps: "", quadrant: "drop",                                                                                          assignee: "unassigned" },
  { id: "T136", phase: "p9", title: "Dashboard utilisateur V2 (économies + ROI)", desc: "Évolution des économies cumulées, ROI vs abonnement, breakdown par module. Preuve de valeur permanente.", fib: 5, status: "todo", deps: "T126", quadrant: "schedule",                                                                                              assignee: "hippo" },
  { id: "T137", phase: "p9", title: "Onboarding optimisé v2 (A/B test)", desc: "Tester 3 versions : long (10 écrans), court (4 écrans), avec démo sur compte fictif. Mesurer conversion onboarding completion + first action.", fib: 5, status: "todo", deps: "T080", quadrant: "schedule",                                                          assignee: "aurore" },

  // === P10 — SCALE & SÉRIE A ===
  { id: "T138", phase: "p10", title: "Recrutement CTO (si solo founder)", desc: "Profil : 8-15 ans XP, fintech ou data, leadership. 5-10% equity. Process : 30+ candidats sourcés, 10 entretiens, 2 finalistes, 1 hire.", fib: 8, status: "todo", deps: "", quadrant: "do",                                                                                  assignee: "basile" },
  { id: "T139", phase: "p10", title: "Recrutement Head of Growth", desc: "Profil : 5+ ans XP growth marketing B2C. Track record acquisition payante + organique. Maîtrise Meta, TikTok, SEO. 0,5-1% equity.", fib: 5, status: "todo", deps: "", quadrant: "schedule",                                                                                  assignee: "basile" },
  { id: "T140", phase: "p10", title: "Recrutement Data Scientist (ML)", desc: "Profil : 3-5 ans XP. Expertise détection patterns, NLP, séries temporelles. Aide à industrialiser les modèles ML détection abos + what-if.", fib: 5, status: "todo", deps: "T132", quadrant: "schedule",                                                              assignee: "basile" },
  { id: "T141", phase: "p10", title: "Recrutement Lead Designer", desc: "Profil : 5+ ans XP, mobile-first, design system. Maîtrise Figma. Idéalement portfolio fintech ou consumer apps premium.", fib: 5, status: "todo", deps: "", quadrant: "schedule",                                                                                                  assignee: "basile" },
  { id: "T142", phase: "p10", title: "Recrutement Customer Success (1-2 personnes)", desc: "Profil : empathique, écrit bien, comprend les enjeux financiers. Gère support + feedback + churn prevention.", fib: 3, status: "todo", deps: "", quadrant: "schedule",                                                                                          assignee: "basile" },
  { id: "T143", phase: "p10", title: "Recrutement Ops Légal/Compliance", desc: "Profil : juriste fintech ou compliance officer. Suit la réglementation (DSP2, AI Act, RGPD). Gère relations CNIL, ACPR.", fib: 5, status: "todo", deps: "", quadrant: "schedule",                                                                                          assignee: "basile" },
  { id: "T144", phase: "p10", title: "Programme de rétention anti-churn (cohort analysis)", desc: "Identifier signaux de churn : baisse d'engagement, peu d'économies, no-show notifications. Triggers : email perso, offre upgrade, call CS.", fib: 8, status: "todo", deps: "T122", quadrant: "schedule",                                          assignee: "aurore" },
  { id: "T145", phase: "p10", title: "Email J29 personnalisé 'économies du mois'", desc: "Auto à J29 : 'Alfred t'a économisé X€ ce mois. Voici le détail.' Réduit churn de 15-30% (benchmark Rocket Money).", fib: 3, status: "todo", deps: "T070", quadrant: "schedule",                                                                              assignee: "aurore" },
  { id: "T146", phase: "p10", title: "SEO blog : 20 articles longue traîne", desc: "Pillar + cluster strategy. Sujets : guides résiliation par opérateur, comparatifs, calculateurs. Domain authority cible 30+ en M12.", fib: 8, status: "todo", deps: "T105", quadrant: "schedule",                                                                  assignee: "aurore" },
  { id: "T147", phase: "p10", title: "Machine acquisition TikTok systémique (5 vidéos/sem)", desc: "Process : weekly briefing, batch tournage 1x/sem, edit, post. Embaucher creator/intern dédié. Outil : CapCut, Notion calendrier.", fib: 5, status: "todo", deps: "T104", quadrant: "schedule",                                                  assignee: "aurore" },
  { id: "T148", phase: "p10", title: "Scaling Meta Ads (lookalike, budget x5)", desc: "À CAC payback < 6 mois confirmé : 200€/j → 1000€/j. Audiences lookalike 1% des best customers. 5+ creatives en A/B continu.", fib: 3, status: "todo", deps: "T118", quadrant: "schedule",                                                                      assignee: "aurore" },
  { id: "T149", phase: "p10", title: "Préparation dossier Série A (data room)", desc: "Notion ou DocSend : KPIs (MRR, CAC, LTV, churn, cohorts), états financiers, contracts, équipe, roadmap, vision. Mis à jour mensuellement.", fib: 8, status: "todo", deps: "", quadrant: "do",                                                                  assignee: "basile" },
  { id: "T150", phase: "p10", title: "Création deck investisseur Série A (15-20 slides)", desc: "Structure : problème → solution → traction → marché → modèle → équipe → demande. 15 min de pitch max. Itérer 20 fois avant le 1er meeting VC.", fib: 5, status: "todo", deps: "T149", quadrant: "do",                                              assignee: "basile" },
  { id: "T151", phase: "p10", title: "Roadshow VC : 50+ meetings", desc: "Cibler : Kima, Partech, Headline, Index, Eurazeo, BPI, Frst. Process : intro warm > meeting 1 > term sheet > due diligence > closing. Délai 3-6 mois.", fib: 13, status: "todo", deps: "T150", quadrant: "do",                                                              assignee: "basile" },
  { id: "T152", phase: "p10", title: "Closing Série A (8-15M€)", desc: "Term sheet → due diligence (4-8 semaines) → SPA → closing. Avocat M&A nécessaire (2-4% des frais). Préparer la communication interne.", fib: 8, status: "todo", deps: "T151", quadrant: "do",                                                                                  assignee: "basile" },

  // === P11 — INTERNATIONAL ===
  { id: "T153", phase: "p11", title: "Localisation Belgique (DSP2 BE, partenaires locaux)", desc: "Étude réglementaire BE, partenariats agrégateur (Powens couvre BE), partenaires courtiers BE. Adaptation langue (FR-BE + NL pour V2).", fib: 13, status: "todo", deps: "", quadrant: "schedule",                                                  assignee: "unassigned" },
  { id: "T154", phase: "p11", title: "Localisation Luxembourg (fiscalité LU)", desc: "Spécificités fiscales LU. Petit marché mais haut pouvoir d'achat. Cross-frontaliers FR-LU intéressants.", fib: 8, status: "todo", deps: "T153", quadrant: "drop",                                                                                                      assignee: "unassigned" },
  { id: "T155", phase: "p11", title: "Préparation Allemagne (étude marché)", desc: "Plus gros marché EU. Concurrence forte (Finanzguru, Outbank). Étude approfondie 6 mois avant lancement. Localisation langue + fiscalité.", fib: 8, status: "todo", deps: "", quadrant: "schedule",                                                                  assignee: "unassigned" },
  { id: "T156", phase: "p11", title: "Localisation Suisse romande", desc: "Hors DSP2 (pays tiers). Partenariats agrégateurs locaux (Yapeal). Pouvoir d'achat élevé. Niche mais rentable.", fib: 5, status: "todo", deps: "", quadrant: "drop",                                                                                                              assignee: "unassigned" },
  { id: "T157", phase: "p11", title: "Module optimisation fiscale (Alfred Pro)", desc: "Crédits d'impôt, PER, frais réels, déductions oubliées. AVEC disclaimers stricts (pas de conseil réglementé). Redirection vers expert pour cas complexes.", fib: 21, status: "todo", deps: "", quadrant: "schedule",                                          assignee: "greg" },
  { id: "T158", phase: "p11", title: "Module moments de bascule (déménagement, naissance, etc.)", desc: "Détection via signaux faibles (changement IBAN, dépenses baby, etc.) → cascade d'actions auto (mutuelle, CAF, assurances, etc.).", fib: 13, status: "todo", deps: "T132", quadrant: "schedule",                                          assignee: "greg" },
  { id: "T159", phase: "p11", title: "Module RDV santé & admin (Alfred Pro)", desc: "Synchro agenda, prise de RDV (Doctolib API), rappels carte vitale. Reste niche mais haute valeur perçue pour Pro.", fib: 8, status: "todo", deps: "", quadrant: "drop",                                                                                                  assignee: "unassigned" },
];

// ═══════════════════════════════════════════════════════════════
// ALFRED LOGO — Bowtie (charte officielle)
// ═══════════════════════════════════════════════════════════════
const AlfredBowtie = ({ size = 36, withText = false, dark = false }) => {
  const w = withText ? size * 3.6 : size * 1.5;
  const h = size;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: size * 0.25 }}>
      <svg width={size * 1.4} height={size * 0.7} viewBox="0 0 140 70" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
        {/* Left wing */}
        <path d="M 5 12 L 60 35 L 5 58 Z" fill={dark ? C.ivoire : C.encre} />
        {/* Right wing */}
        <path d="M 135 12 L 80 35 L 135 58 Z" fill={dark ? C.ivoire : C.encre} />
        {/* Center knot */}
        <rect x="61" y="22" width="18" height="26" rx="2" fill={C.champagne} />
      </svg>
      {withText && (
        <span style={{
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontSize: size * 0.85,
          fontWeight: 400,
          color: dark ? C.ivoire : C.encre,
          letterSpacing: "-0.02em",
          fontStyle: "italic",
        }}>alfred</span>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// UTILITY COMPONENTS
// ═══════════════════════════════════════════════════════════════
const Btn = ({ onClick, children, variant = "primary", size = "md", style = {}, disabled, title }) => {
  const variants = {
    primary:   { bg: C.encre,       color: C.ivoire,    border: C.encre,             hover: C.encreLight },
    champagne: { bg: C.champagne,   color: C.encre,     border: C.champagne,         hover: C.champagneLight },
    secondary: { bg: "transparent", color: C.encre,     border: C.borderStrong,      hover: C.bgHover },
    ghost:     { bg: "transparent", color: C.textMuted, border: "transparent",       hover: C.bgHover },
    danger:    { bg: "transparent", color: "#C73E47",   border: "rgba(199,62,71,0.3)", hover: "rgba(199,62,71,0.08)" },
  };
  const sizes = {
    sm: { padding: "6px 12px", fontSize: 12 },
    md: { padding: "8px 16px", fontSize: 13 },
    lg: { padding: "12px 22px", fontSize: 14 },
  };
  const v = variants[variant];
  const s = sizes[size];
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover && !disabled ? v.hover : v.bg,
        color: v.color,
        border: `1px solid ${v.border}`,
        borderRadius: 6,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        fontWeight: 600,
        fontFamily: "inherit",
        transition: "all 0.15s ease",
        whiteSpace: "nowrap",
        ...s,
        ...style,
      }}
    >
      {children}
    </button>
  );
};

const FibBadge = ({ n, size = "md" }) => {
  const sizes = { sm: { p: "2px 7px", f: 11 }, md: { p: "3px 9px", f: 12 } };
  const s = sizes[size];
  return (
    <span title={`Fibonacci ${n} — ${FIB_LABEL[n]}`} style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: `${FIB_COLORS[n]}1A`, color: FIB_COLORS[n],
      border: `1px solid ${FIB_COLORS[n]}40`, borderRadius: 4,
      padding: s.p, fontSize: s.f, fontWeight: 800, fontFamily: "'Georgia', serif",
    }}>
      <span style={{ fontSize: s.f - 2, opacity: 0.7 }}>fib</span>
      {n}
    </span>
  );
};

const StatusPill = ({ statusId, onClick }) => {
  const s = STATUSES.find((x) => x.id === statusId) || STATUSES[0];
  return (
    <span onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      cursor: onClick ? "pointer" : "default",
      background: `${s.color}15`, color: s.color, border: `1px solid ${s.color}40`,
      borderRadius: 4, padding: "3px 8px", fontSize: 11, fontWeight: 700,
      textTransform: "uppercase", letterSpacing: "0.05em",
    }}>
      <span style={{ fontSize: 10 }}>{s.icon}</span>{s.label}
    </span>
  );
};

const QuadrantPill = ({ quadrantId }) => {
  const q = QUADRANTS.find((x) => x.id === quadrantId) || QUADRANTS[3];
  return (
    <span title={q.label} style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: `${q.color}12`, color: q.color, border: `1px solid ${q.color}40`,
      borderRadius: 4, padding: "3px 8px", fontSize: 11, fontWeight: 700,
    }}>
      <span style={{ fontSize: 11 }}>{q.emoji}</span>{q.short}
    </span>
  );
};

const Avatar = ({ assigneeId, size = 28, showName = false }) => {
  const m = TEAM.find((t) => t.id === assigneeId) || TEAM[TEAM.length - 1];
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <div title={m.name} style={{
        width: size, height: size, borderRadius: "50%",
        background: m.color, color: m.id === "hippo" ? C.encre : C.ivoire,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 700, fontSize: size * 0.42, fontFamily: "'Georgia', serif",
        border: `2px solid ${C.bgPanel}`,
        boxShadow: `0 0 0 1px ${C.border}`,
      }}>
        {m.initials}
      </div>
      {showName && <span style={{ color: C.text, fontSize: 12, fontWeight: 600 }}>{m.name}</span>}
    </div>
  );
};

const inputStyle = {
  width: "100%", background: C.bgInput, color: C.text, border: `1px solid ${C.border}`,
  borderRadius: 6, padding: "8px 12px", fontSize: 13, outline: "none", fontFamily: "inherit",
};

const selectStyle = {
  background: C.bgInput, color: C.text, border: `1px solid ${C.border}`,
  borderRadius: 6, padding: "8px 12px", fontSize: 13, outline: "none",
  fontFamily: "inherit", cursor: "pointer",
};

// ═══════════════════════════════════════════════════════════════
// TICKET MODAL (full edit — bowtie style)
// ═══════════════════════════════════════════════════════════════
const TicketModal = ({ ticket, onClose, onSave, onDelete }) => {
  const [t, setT] = useState(ticket);
  useEffect(() => setT(ticket), [ticket]);
  if (!t) return null;
  const phase = PHASES.find((p) => p.id === t.phase);

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(15,27,45,0.45)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: C.bgPanel, border: `1px solid ${C.borderStrong}`, borderRadius: 12,
        width: "100%", maxWidth: 720, maxHeight: "92vh", overflowY: "auto",
        boxShadow: `0 20px 60px rgba(15,27,45,0.25), 0 0 0 1px ${C.champagne}30`,
      }}>
        <div style={{ padding: "20px 28px", borderBottom: `1px solid ${C.borderSubtle}`, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ color: C.champagneDeep, fontSize: 11, fontWeight: 700, fontFamily: "'Georgia', serif", letterSpacing: "0.1em" }}>{t.id}</span>
          {phase && (
            <span style={{ color: phase.color, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", padding: "3px 8px", background: `${phase.color}15`, borderRadius: 4 }}>
              {phase.short}
            </span>
          )}
          <div style={{ flex: 1 }} />
          <Btn variant="ghost" size="sm" onClick={onClose}>✕ Fermer</Btn>
        </div>

        <div style={{ padding: "24px 28px" }}>
          <input
            value={t.title}
            onChange={(e) => setT({ ...t, title: e.target.value })}
            style={{
              width: "100%", background: "transparent", color: C.text, border: "none", outline: "none",
              fontSize: 22, fontWeight: 700, fontFamily: "'Georgia', serif", marginBottom: 16, letterSpacing: "-0.01em",
            }}
            placeholder="Titre du ticket"
          />

          <div style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: 12, alignItems: "start", marginBottom: 18 }}>
            <label style={lblStyle}>Phase</label>
            <select value={t.phase} onChange={(e) => setT({ ...t, phase: e.target.value })} style={inputStyle}>
              {PHASES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>

            <label style={lblStyle}>Quadrant</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {QUADRANTS.map((q) => (
                <button key={q.id} onClick={() => setT({ ...t, quadrant: q.id })} style={{
                  padding: "10px 12px", borderRadius: 6, cursor: "pointer", textAlign: "left",
                  background: t.quadrant === q.id ? `${q.color}15` : "transparent",
                  color: t.quadrant === q.id ? q.color : C.textMuted,
                  border: `1px solid ${t.quadrant === q.id ? q.color : C.border}`,
                  transition: "all 0.15s", fontFamily: "inherit",
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{q.emoji} {q.label}</div>
                  <div style={{ fontSize: 10, opacity: 0.7 }}>{q.desc}</div>
                </button>
              ))}
            </div>

            <label style={lblStyle}>Assigné à</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {TEAM.map((m) => (
                <button key={m.id} onClick={() => setT({ ...t, assignee: m.id })} style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "5px 10px 5px 5px", borderRadius: 99, cursor: "pointer",
                  background: t.assignee === m.id ? `${m.color}15` : "transparent",
                  border: `1px solid ${t.assignee === m.id ? m.color : C.border}`,
                  fontFamily: "inherit", color: C.text, fontSize: 12, fontWeight: 600,
                  transition: "all 0.15s",
                }}>
                  <Avatar assigneeId={m.id} size={22} />
                  {m.name}
                </button>
              ))}
            </div>

            <label style={lblStyle}>Statut</label>
            <select value={t.status} onChange={(e) => setT({ ...t, status: e.target.value })} style={inputStyle}>
              {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>

            <label style={lblStyle}>Difficulté</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {FIB_VALUES.map((n) => (
                <button key={n} onClick={() => setT({ ...t, fib: n })} style={{
                  padding: "6px 10px", borderRadius: 6, cursor: "pointer", fontWeight: 800, fontFamily: "'Georgia', serif",
                  background: t.fib === n ? `${FIB_COLORS[n]}25` : "transparent",
                  color: t.fib === n ? FIB_COLORS[n] : C.textMuted,
                  border: `1px solid ${t.fib === n ? FIB_COLORS[n] : C.border}`,
                  fontSize: 14, minWidth: 36, transition: "all 0.15s",
                }}>{n}</button>
              ))}
            </div>

            <label style={lblStyle}>Dépendances</label>
            <input value={t.deps || ""} onChange={(e) => setT({ ...t, deps: e.target.value })} placeholder="Ex: T001, T015" style={inputStyle} />
          </div>

          <label style={{ ...lblStyle, marginBottom: 8, display: "block" }}>Description</label>
          <textarea
            value={t.desc}
            onChange={(e) => setT({ ...t, desc: e.target.value })}
            placeholder="Détails du ticket : ce qui doit être fait, livrables attendus, ressources, contraintes…"
            style={{ ...inputStyle, minHeight: 140, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }}
          />

          <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "space-between", flexWrap: "wrap" }}>
            <Btn variant="danger" onClick={() => { if (confirm("Supprimer ce ticket ?")) { onDelete(t.id); onClose(); } }}>🗑 Supprimer</Btn>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="secondary" onClick={onClose}>Annuler</Btn>
              <Btn variant="primary" onClick={() => { onSave(t); onClose(); }}>Sauvegarder</Btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const lblStyle = { color: C.textDim, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", paddingTop: 8 };

// ═══════════════════════════════════════════════════════════════
// TICKET ROW
// ═══════════════════════════════════════════════════════════════
const TicketRow = ({ t, onClick, onStatusCycle }) => {
  const phase = PHASES.find((p) => p.id === t.phase);
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "55px 95px 1fr auto auto auto auto auto",
        gap: 12, alignItems: "center", padding: "12px 16px",
        background: hover ? C.bgHover : C.bgCard,
        border: `1px solid ${hover ? C.borderStrong : C.borderSubtle}`,
        borderRadius: 8, cursor: "pointer", marginBottom: 6,
        transition: "all 0.15s ease",
      }}
    >
      <span style={{ color: C.champagneDeep, fontSize: 11, fontWeight: 700, fontFamily: "'Georgia', serif" }}>{t.id}</span>
      {phase && (
        <span style={{
          color: phase.color, fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em",
          padding: "3px 6px", background: `${phase.color}12`, borderRadius: 3, textAlign: "center", whiteSpace: "nowrap",
        }}>{phase.short}</span>
      )}
      <div style={{ minWidth: 0 }}>
        <div style={{ color: C.text, fontSize: 14, fontWeight: 600, marginBottom: 2, lineHeight: 1.3 }}>{t.title}</div>
        {t.desc && (
          <div style={{ color: C.textDim, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {t.desc}
          </div>
        )}
      </div>
      <Avatar assigneeId={t.assignee} size={28} />
      <QuadrantPill quadrantId={t.quadrant} />
      <FibBadge n={t.fib} size="sm" />
      <StatusPill statusId={t.status} onClick={(e) => { e.stopPropagation(); onStatusCycle(t); }} />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// EISENHOWER MATRIX VIEW
// ═══════════════════════════════════════════════════════════════
const EisenhowerView = ({ tickets, onTicketClick }) => {
  const grouped = useMemo(() => {
    return QUADRANTS.reduce((acc, q) => ({ ...acc, [q.id]: tickets.filter((t) => t.quadrant === q.id) }), {});
  }, [tickets]);

  return (
    <div>
      <div style={{ marginBottom: 16, padding: "16px 20px", background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 8 }}>
        <div style={{ color: C.encre, fontSize: 16, fontWeight: 700, fontFamily: "'Georgia', serif", marginBottom: 4 }}>Matrice d'Eisenhower</div>
        <div style={{ color: C.textMuted, fontSize: 12 }}>Classement par urgence et importance — clique sur un ticket pour le modifier</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {QUADRANTS.map((q) => {
          const list = grouped[q.id] || [];
          return (
            <div key={q.id} style={{
              background: C.bgPanel, border: `1px solid ${q.color}30`, borderTop: `3px solid ${q.color}`,
              borderRadius: 10, padding: 16, minHeight: 200,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 18 }}>{q.emoji}</span>
                <div style={{ color: q.color, fontWeight: 800, fontSize: 14, fontFamily: "'Georgia', serif" }}>{q.label}</div>
                <div style={{ flex: 1 }} />
                <span style={{
                  background: `${q.color}15`, color: q.color, border: `1px solid ${q.color}40`,
                  padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                }}>{list.length}</span>
              </div>
              <div style={{ color: C.textMuted, fontSize: 11, marginBottom: 14, fontStyle: "italic" }}>{q.desc}</div>

              {list.length === 0 ? (
                <div style={{ color: C.textDim, fontSize: 12, textAlign: "center", padding: 20, opacity: 0.6 }}>Aucun ticket</div>
              ) : (
                list.map((t) => {
                  const phase = PHASES.find((p) => p.id === t.phase);
                  return (
                    <div key={t.id} onClick={() => onTicketClick(t)} style={{
                      padding: "10px 12px", background: C.bgSubtle, border: `1px solid ${C.borderSubtle}`,
                      borderRadius: 6, cursor: "pointer", marginBottom: 6, transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = q.color + "60"; e.currentTarget.style.background = C.bgHover; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.borderSubtle; e.currentTarget.style.background = C.bgSubtle; }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ color: C.champagneDeep, fontSize: 10, fontWeight: 700, fontFamily: "'Georgia', serif" }}>{t.id}</span>
                        {phase && <span style={{ color: phase.color, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", padding: "1px 5px", background: `${phase.color}12`, borderRadius: 3 }}>{phase.short}</span>}
                        <div style={{ flex: 1 }} />
                        <Avatar assigneeId={t.assignee} size={20} />
                        <FibBadge n={t.fib} size="sm" />
                      </div>
                      <div style={{ color: C.text, fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{t.title}</div>
                    </div>
                  );
                })
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// STAT CARD
// ═══════════════════════════════════════════════════════════════
const StatCard = ({ label, value, sub, accent = C.encre }) => (
  <div style={{
    background: C.bgPanel, border: `1px solid ${C.borderSubtle}`, borderTop: `2px solid ${accent}`,
    borderRadius: 8, padding: "14px 18px",
  }}>
    <div style={{ color: accent, fontSize: 26, fontWeight: 800, fontFamily: "'Georgia', serif", lineHeight: 1.1 }}>{value}</div>
    <div style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
    {sub && <div style={{ color: C.textDim, fontSize: 10, marginTop: 2 }}>{sub}</div>}
  </div>
);

// ═══════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════
export default function AlfredWorkspace() {
  const [tickets, setTickets] = useState(DEFAULT_TICKETS);
  const [loading, setLoading] = useState(true);
  const [editingTicket, setEditingTicket] = useState(null);
  const [filterPhase, setFilterPhase] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [filterQuadrant, setFilterQuadrant] = useState("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState("list"); // "list" | "matrix"
  const [exported, setExported] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("alfred-tickets-v2");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) setTickets(parsed);
      }
    } catch (e) {
      console.warn("Could not load saved tickets:", e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (loading) return;
    try {
      localStorage.setItem("alfred-tickets-v2", JSON.stringify(tickets));
    } catch (e) {
      console.warn("Could not save tickets:", e);
    }
  }, [tickets, loading]);

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      if (filterPhase !== "all" && t.phase !== filterPhase) return false;
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
      if (filterAssignee !== "all" && t.assignee !== filterAssignee) return false;
      if (filterQuadrant !== "all" && t.quadrant !== filterQuadrant) return false;
      if (search && !`${t.id} ${t.title} ${t.desc}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [tickets, filterPhase, filterStatus, filterAssignee, filterQuadrant, search]);

  const stats = useMemo(() => {
    const byStatus = STATUSES.reduce((acc, s) => ({ ...acc, [s.id]: tickets.filter((t) => t.status === s.id).length }), {});
    const byAssignee = TEAM.reduce((acc, m) => ({ ...acc, [m.id]: tickets.filter((t) => t.assignee === m.id).length }), {});
    const totalFib = tickets.reduce((s, t) => s + t.fib, 0);
    const doneFib = tickets.filter((t) => t.status === "done").reduce((s, t) => s + t.fib, 0);
    return { total: tickets.length, byStatus, byAssignee, totalFib, doneFib, progress: totalFib ? Math.round((doneFib / totalFib) * 100) : 0 };
  }, [tickets]);

  const saveTicket = (t) => setTickets((prev) => prev.map((x) => (x.id === t.id ? t : x)));
  const deleteTicket = (id) => setTickets((prev) => prev.filter((t) => t.id !== id));
  const cycleStatus = (t) => {
    const idx = STATUSES.findIndex((s) => s.id === t.status);
    const next = STATUSES[(idx + 1) % STATUSES.length];
    saveTicket({ ...t, status: next.id });
  };
  const addTicket = () => {
    const ids = tickets.map((t) => parseInt(t.id.replace(/\D/g, ""))).filter((n) => !isNaN(n));
    const nextNum = ids.length ? Math.max(...ids) + 1 : 1;
    const newT = {
      id: `T${String(nextNum).padStart(3, "0")}`,
      phase: filterPhase !== "all" ? filterPhase : "p0",
      title: "Nouveau ticket", desc: "",
      fib: 3, status: "todo", deps: "",
      quadrant: filterQuadrant !== "all" ? filterQuadrant : "schedule",
      assignee: filterAssignee !== "all" ? filterAssignee : "unassigned",
    };
    setTickets((prev) => [...prev, newT]);
    setEditingTicket(newT);
  };

  const exportMarkdown = () => {
    let md = `# Alfred — Roadmap Tickets\n\n`;
    md += `> Exporté le ${new Date().toLocaleDateString("fr-FR")} • ${tickets.length} tickets • ${stats.totalFib} pts Fib • ${stats.progress}% complété\n\n`;
    md += `## Équipe\n\n`;
    TEAM.filter(m => m.id !== "unassigned").forEach(m => { md += `- **${m.name}** : ${stats.byAssignee[m.id] || 0} tickets\n`; });
    md += `\n## Matrice d'Eisenhower\n\n`;
    QUADRANTS.forEach(q => {
      const list = tickets.filter(t => t.quadrant === q.id);
      md += `### ${q.emoji} ${q.label} (${list.length})\n*${q.desc}*\n\n`;
    });
    md += `\n---\n\n## Tickets par phase\n`;
    PHASES.forEach((phase) => {
      const ph = tickets.filter((t) => t.phase === phase.id);
      if (!ph.length) return;
      md += `\n### ${phase.label}\n*${phase.period}*\n\n`;
      md += `| ID | Titre | Assigné | Quadrant | Statut | Fib | Description |\n|---|---|---|---|---|---|---|\n`;
      ph.forEach((t) => {
        const status = STATUSES.find((s) => s.id === t.status)?.label || "—";
        const member = TEAM.find((m) => m.id === t.assignee)?.name || "—";
        const quad = QUADRANTS.find((q) => q.id === t.quadrant)?.short || "—";
        const desc = (t.desc || "—").replace(/\n/g, " ").replace(/\|/g, "\\|");
        md += `| ${t.id} | **${t.title}** | ${member} | ${quad} | ${status} | ${t.fib} | ${desc} |\n`;
      });
    });
    setExported(md);
  };

  const resetData = () => {
    if (confirm("Réinitialiser tous les tickets aux valeurs par défaut ?")) setTickets(DEFAULT_TICKETS);
  };

  if (loading) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg }}>
        <AlfredBowtie size={60} withText />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: C.bg, color: C.text,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {/* ═══ HEADER ═══ */}
      <header style={{
        borderBottom: `1px solid ${C.border}`, background: `${C.bgPanel}F0`, backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 50, padding: "14px 28px",
        display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
      }}>
        <AlfredBowtie size={36} withText />
        <div style={{ borderLeft: `1px solid ${C.borderSubtle}`, paddingLeft: 16, marginLeft: 4 }}>
          <div style={{ color: C.textDim, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 700 }}>Roadmap Tickets</div>
          <div style={{ color: C.encre, fontSize: 13, fontWeight: 600, marginTop: 2 }}>Workspace stratégique</div>
        </div>
        <div style={{ flex: 1, minWidth: 20 }} />
        <Btn variant="secondary" size="sm" onClick={exportMarkdown}>📄 Export</Btn>
        <Btn variant="ghost" size="sm" onClick={resetData}>↻ Reset</Btn>
        <Btn variant="champagne" size="sm" onClick={addTicket}>+ Nouveau ticket</Btn>
      </header>

      <div style={{ padding: "20px 28px", maxWidth: 1400, margin: "0 auto" }}>
        {/* ═══ STATS BAR ═══ */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 16 }}>
          <StatCard label="Tickets total" value={stats.total} accent={C.encre} />
          <StatCard label="Points Fibonacci" value={stats.totalFib} sub={`${stats.doneFib} terminés`} accent={C.champagneDeep} />
          <StatCard label="Avancement" value={`${stats.progress}%`} sub="basé sur les points" accent={C.emeraude} />
          {STATUSES.slice(0, 3).map((s) => <StatCard key={s.id} label={s.label} value={stats.byStatus[s.id] || 0} accent={s.color} />)}
        </div>

        {/* ═══ TEAM WORKLOAD ═══ */}
        <div style={{
          display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center",
          padding: "12px 18px", background: C.bgPanel, border: `1px solid ${C.border}`,
          borderRadius: 8, marginBottom: 16,
        }}>
          <span style={{ color: C.textDim, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginRight: 8 }}>Équipe</span>
          {TEAM.filter(m => m.id !== "unassigned").map((m) => (
            <button key={m.id} onClick={() => setFilterAssignee(filterAssignee === m.id ? "all" : m.id)} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "5px 12px 5px 5px", borderRadius: 99, cursor: "pointer",
              background: filterAssignee === m.id ? `${m.color}15` : C.bgSubtle,
              border: `1px solid ${filterAssignee === m.id ? m.color : C.border}`,
              fontFamily: "inherit", color: C.text, fontSize: 12, fontWeight: 600,
              transition: "all 0.15s",
            }}>
              <Avatar assigneeId={m.id} size={22} />
              {m.name}
              <span style={{ color: m.color, fontWeight: 800, fontFamily: "'Georgia', serif", fontSize: 13, marginLeft: 2 }}>{stats.byAssignee[m.id] || 0}</span>
            </button>
          ))}
          {filterAssignee !== "all" && (
            <button onClick={() => setFilterAssignee("all")} style={{
              padding: "5px 12px", borderRadius: 99, cursor: "pointer",
              background: "transparent", color: C.textMuted, border: `1px solid ${C.border}`,
              fontFamily: "inherit", fontSize: 12,
            }}>Tout afficher</button>
          )}
        </div>

        {/* ═══ VIEW SWITCH + FILTERS ═══ */}
        <div style={{
          display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center",
          padding: "12px 16px", background: C.bgPanel, border: `1px solid ${C.border}`,
          borderRadius: 8, marginBottom: 16,
        }}>
          <div style={{ display: "flex", gap: 4, padding: 3, background: C.bgSubtle, borderRadius: 6 }}>
            <button onClick={() => setView("list")} style={{
              padding: "6px 14px", borderRadius: 4, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit",
              background: view === "list" ? C.bgPanel : "transparent",
              color: view === "list" ? C.encre : C.textMuted,
              boxShadow: view === "list" ? `0 1px 3px rgba(15,27,45,0.1)` : "none",
            }}>📋 Liste</button>
            <button onClick={() => setView("matrix")} style={{
              padding: "6px 14px", borderRadius: 4, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit",
              background: view === "matrix" ? C.bgPanel : "transparent",
              color: view === "matrix" ? C.encre : C.textMuted,
              boxShadow: view === "matrix" ? `0 1px 3px rgba(15,27,45,0.1)` : "none",
            }}>🎯 Matrice</button>
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Rechercher..."
            style={{
              flex: 1, minWidth: 180, background: C.bgInput, color: C.text,
              border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 14px",
              fontSize: 13, outline: "none", fontFamily: "inherit",
            }}
          />
          <select value={filterPhase} onChange={(e) => setFilterPhase(e.target.value)} style={selectStyle}>
            <option value="all">Toutes les phases</option>
            {PHASES.map((p) => <option key={p.id} value={p.id}>{p.short}</option>)}
          </select>
          <select value={filterQuadrant} onChange={(e) => setFilterQuadrant(e.target.value)} style={selectStyle}>
            <option value="all">Tous les quadrants</option>
            {QUADRANTS.map((q) => <option key={q.id} value={q.id}>{q.emoji} {q.short}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={selectStyle}>
            <option value="all">Tous les statuts</option>
            {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <span style={{ color: C.textDim, fontSize: 12, fontWeight: 600 }}>{filtered.length} / {tickets.length}</span>
        </div>

        {/* ═══ MAIN VIEW ═══ */}
        {view === "matrix" ? (
          <EisenhowerView tickets={filtered} onTicketClick={setEditingTicket} />
        ) : (
          <>
            {filterPhase !== "all" && (() => {
              const ph = PHASES.find((p) => p.id === filterPhase);
              if (!ph) return null;
              return (
                <div style={{
                  padding: "14px 20px", background: `${ph.color}08`, border: `1px solid ${ph.color}30`,
                  borderLeft: `3px solid ${ph.color}`, borderRadius: 8, marginBottom: 14,
                }}>
                  <div style={{ color: ph.color, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>{ph.short} • {ph.period}</div>
                  <div style={{ color: C.encre, fontSize: 17, fontWeight: 700, fontFamily: "'Georgia', serif", marginTop: 3 }}>{ph.label}</div>
                </div>
              );
            })()}

            <div>
              {filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: 60, color: C.textDim }}>
                  <div style={{ fontSize: 36, opacity: 0.4, marginBottom: 12 }}>🔍</div>
                  Aucun ticket ne correspond à tes filtres
                </div>
              ) : (
                filtered.map((t) => (
                  <TicketRow key={t.id} t={t} onClick={() => setEditingTicket(t)} onStatusCycle={cycleStatus} />
                ))
              )}
            </div>
          </>
        )}

        {/* ═══ FOOTER LEGEND ═══ */}
        <div style={{ marginTop: 30, padding: "16px 20px", background: C.bgPanel, border: `1px solid ${C.borderSubtle}`, borderRadius: 8 }}>
          <div style={{ color: C.textDim, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Échelle Fibonacci de complexité</div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {FIB_VALUES.map((n) => (
              <div key={n} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                <FibBadge n={n} size="sm" />
                <span style={{ color: C.textMuted }}>{FIB_LABEL[n]}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 16, padding: 14, color: C.textDim, fontSize: 11, textAlign: "center", lineHeight: 1.6 }}>
          Modifications <strong style={{ color: C.champagneDeep }}>sauvegardées automatiquement</strong> • Clique sur un ticket pour l'éditer • Clique sur le statut pour le faire avancer • Bouton Export pour Notion
        </div>
      </div>

      {/* ═══ EDIT MODAL ═══ */}
      {editingTicket && (
        <TicketModal ticket={editingTicket} onClose={() => setEditingTicket(null)} onSave={saveTicket} onDelete={deleteTicket} />
      )}

      {/* ═══ EXPORT MODAL ═══ */}
      {exported && (
        <div onClick={() => setExported(null)} style={{
          position: "fixed", inset: 0, background: "rgba(15,27,45,0.5)", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20,
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: C.bgPanel, border: `1px solid ${C.borderStrong}`, borderRadius: 12,
            width: "100%", maxWidth: 800, maxHeight: "90vh", display: "flex", flexDirection: "column",
          }}>
            <div style={{ padding: "16px 24px", borderBottom: `1px solid ${C.borderSubtle}`, display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ color: C.encre, fontSize: 16, fontWeight: 700, fontFamily: "'Georgia', serif" }}>📄 Export Markdown — pour Notion</span>
              <div style={{ flex: 1 }} />
              <Btn variant="champagne" size="sm" onClick={() => { navigator.clipboard.writeText(exported); }}>📋 Copier</Btn>
              <Btn variant="ghost" size="sm" onClick={() => setExported(null)}>✕</Btn>
            </div>
            <textarea value={exported} readOnly style={{
              flex: 1, padding: 20, background: C.bgSubtle, color: C.text, border: "none", outline: "none",
              fontFamily: "monospace", fontSize: 12, lineHeight: 1.5, resize: "none",
            }} />
            <div style={{ padding: "12px 24px", borderTop: `1px solid ${C.borderSubtle}`, color: C.textDim, fontSize: 12, lineHeight: 1.5 }}>
              <strong style={{ color: C.encre }}>Pour importer dans Notion :</strong> copie ce texte → Notion : <code style={{ background: C.bgSubtle, padding: "1px 6px", borderRadius: 3, fontSize: 11 }}>/markdown</code> et colle, ou nouvelle page → "···" → Import → Markdown
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
