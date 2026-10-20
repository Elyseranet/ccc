# Happy Hour — mapping composants Origam 2.37.3

Chaque bloc des maquettes `docs/design/ui/happy-hour/*.html` est relié à son composant Origam et à ses props.
**Toutes les props listées ont été vérifiées par script** contre les interfaces de `~/Projects/origam/packages/ds/src` (version 2.37.3, résolution des `extends` / `Pick` / `Omit`) : 0 écart.
Les valeurs `[…]` sont des données branchées par le front. Les props non citées prennent les défauts du thème (`theme.ts`, bloc `components`).

## Fichiers

| Fichier | Rôle |
|---|---|
| `theme.ts` | `IOrigamTheme` : `components` (props) d’abord, puis `vars`. Mode **dark** uniquement. |
| `tokens.css` | Généré depuis `theme.ts` par `resolveThemeVars` / `themeSelector` du DS. Ne pas éditer. |
| `hh.css`, `pages.css`, `admin.css` | Habillage des maquettes (uniquement des `var(--origam-*)`). Sert de référence visuelle, pas de CSS à copier. |
| `bulles.js` | Décor des vitrines (canvas, requestAnimationFrame), remplaçant provisoire de la vidéo. |
| `index.html`, `palmares.html` | Vitrines (animation JS / vidéo autorisées, CLAUDE.md du projet). |
| `edition.html`, `joueur.html`, `joueurs.html` | Pages denses publiques (CSS seul). |
| `admin.html`, `admin-scores.html` | Organisation (CSS seul) ; `admin-scores` montre la saisie ouverte. |

## Décisions portées par le thème

- **Mode clair : non livré.** Sur fond crème, le néon et l’ambre cessent d’être des lumières et l’univers « soirée » disparaît. Si un mode clair devient nécessaire (accessibilité, impression), il faudra une palette dédiée, pas un inversé.
- **Exception PROPS-FIRST** (décision utilisateur du 2026-10-20) : Bagel Fat One via la classe locale `.font-display`. Le token `typo.family.display` existe pour alimenter cette classe ; aucune prop ne le lit.
- **Élévation = ombre néon.** `shadow.lg` = `0 6px 0` rose, `shadow.xl` = idem + halo. Les cartes restent sur `md` (ombre sombre douce).
- **Couleurs d’univers** sous `color.bar.*` (mousse, ambre, néon, glaçon, nuit, halo) : décor uniquement, aucun rôle sémantique.
- **Aucune courbe à rebond** : easings exponentiels (ease-out-quart, ease-out-expo, ease-in-quart, ease-in-out-quint).
- **Échelle typographique** modulaire 1,25 (12,8 · 16 · 20 · 25 · 31,25 · 39 · 61 · 119 px) ; texte en **Gabarito**, display **Bagel Fat One**.
- **Pas de défilement automatique** : le bandeau des règles d’or est statique.

## Mapping par page

| Page | Bloc | Composant | Props |
|---|---|---|---|
| Toutes | En-tête public | `origam-toolbar` | `tag: "header"`, `flat: true`, `density: "default"`, `rounded: "full"`, `border: true`<br>Fond = surface.overlay translucide. Liens = origam-btn `to` + classe active. Pas d’avatar ni de « Connexion » (A3, E-d). |
| Toutes | Liens de navigation | `origam-btn` | `to: "/editions"`, `variant: "text"`, `rounded: "full"`, `activeClass: "is-active"`<br>État courant : `action.secondary` (néon) via la classe active. |
| Toutes | Pied de page | `origam-btn` | `to: "/connexion"`, `variant: "text"`<br>Lien « Connexion » unique (E-d). |
| Toutes | Titres display | `origam-title` | `tag: "h1"`, `fontSize: "5xl"`, `lineHeight: "none"`<br>⚠️ Exception validée : la famille Bagel Fat One passe par la classe locale `.font-display` (+ `.neon` pour l’extrusion rose), PAS par `fontFamily`. |
| Accueil | Fond vidéo du hero | `origam-video` | `autoplay: true`, `muted: true`, `loop: true`, `playsInline: true`, `poster: "/hero-poster.jpg"`, `controls: false`<br>Asset à fournir (voir plus bas). Repli actuel : canvas `bulles.js`. Coupé sous reduced-motion. |
| Accueil | CTA principal | `origam-btn` | `variant: "flat"`, `color: "primary"`, `elevation: "lg"`, `size: "large"`, `to: "/editions/2026"`<br>`elevation: lg` = ombre néon décalée (échelle shadow du thème) ; `xl` au survol. |
| Accueil | CTA secondaire | `origam-btn` | `variant: "outlined"`, `size: "large"`, `to: "/palmares"` |
| Accueil | Pastille « 16 éditions » | `origam-chip` | `color: "primary"`, `size: "small"`, `pill: true` |
| Accueil | Tuiles du bento | `origam-card` | `to: "/joueurs"`, `rounded: "xl"`, `border: true`, `elevation: "md"`, `hover: true`<br>Grille : CSS grid-template-areas (layout d’app). Tuile « règle d’or » : `bgColor="secondary"`. |
| Accueil | Avancement des poules | `origam-progress` | `modelValue: 65`, `color: "primary"`, `rounded: true`<br>Résultats validés uniquement (E-f), pas d’effet live. |
| Accueil | Derniers scores validés | `origam-list` | `items`, `density: "comfortable"`, `rounded: "lg"`<br>Un item = vainqueur · score · perdant · chip de poule. |
| Accueil / Palmarès | Bandeau des règles d’or | — (CSS d’app) | Composant d’app STATIQUE (aucun défilement automatique) : grille 4 × 2 en bureau, défilement manuel à l’aimant sur mobile. Contenu = RG25–RG32. |
| Palmarès | Onglets ACP / All Time / Évolution | `origam-tabs` | `variant: "pills"`, `rounded: "full"`, `color: "primary"`<br>Panneaux : origam-tab-panels / origam-tab-panel. |
| Palmarès | Tableaux de classement | `origam-data-table` | `headers`, `items`, `density: "compact"`, `hover: true`, `sortBy`, `caption: "Classement ACP"`<br>Titres = astérisques (RG6) dans le slot de cellule. |
| Palmarès | Graphique d’évolution | `origam-chart` | `type: "line"`, `series`, `categories`, `showLegend: true`, `showGrid: true`, `showTooltip: true`, `animated: false`<br>Une seule échelle (points ACP). Tableau équivalent sous « Voir en tableau ». |
| Palmarès | Chronologie des titres | `origam-card` | `rounded: "lg"`, `border: true`, `elevation: "none"`<br>Un item par édition (2012 compte deux éditions). |
| Édition | Fil d’Ariane | `origam-breadcrumb` | `items`, `density: "compact"` |
| Édition | Sélecteur d’édition | `origam-select` | `items`, `variant: "solo"`, `rounded: "full"`, `label: "Changer d’édition"`<br>L’édition est portée par l’URL (identifiant ≠ année : 2012a / 2012b). |
| Édition | Onglets Synthèse → Matchs | `origam-tabs` | `variant: "pills"`, `rounded: "full"`, `color: "primary"`<br>Sticky sous l’en-tête en bureau. |
| Édition | Déroulé (9 étapes) | `origam-stepper` | `items`, `orientation: "vertical"`, `clickable: false`, `showConnectors: true`<br>Items : `{ title, status: done | active | pending }` (STEPPER_ITEM_STATUS). |
| Édition | Chiffres de l’édition | `origam-card` | `rounded: "xl"`, `border: true`, `elevation: "md"` |
| Édition | Participants | `origam-list` | `items`, `density: "comfortable"`<br>Chaque item : origam-avatar + nom + origam-chip de résultat. |
| Édition | Avatar | `origam-avatar` | `text: "LB"`, `size: "default"`, `rounded: "full"` |
| Édition | Têtes de série & tirages | `origam-card` | `rounded: "xl"`, `border: true`<br>Statut du tirage : origam-chip `color="success"`. RG9, RG11, RG12, RG13. |
| Édition | Classements de poule | `origam-table` | `density: "compact"`, `hover: true`, `caption: "Poule 1"`, `border: true`, `rounded: "lg"`<br>Q = origam-chip success. Tri RG19 (victoires, cap’s average). |
| Édition | Phase finale | `origam-bracket` | `rounds`, `variant: "single-elimination"`, `showScores: true`, `showRoundTitles: true`, `showSeed: false`, `interactive: false`, `direction: "horizontal"`<br>⚠️ RG13 : affiches re-tirées à chaque tour → aucun trait de liaison entre colonnes. À vérifier : comment masquer les connecteurs (slot `connector` disponible). |
| Édition | Filtres des matchs | `origam-chip-group` | `mandatory: true`, `filter: true` |
| Édition | Liste des matchs | `origam-data-table` | `headers`, `items`, `itemsPerPage: 16`, `density: "compact"`<br>N° = `{édition}-{rang}` (RG24). |
| Édition | Pagination | `origam-pagination` | `length: 8`, `totalVisible: 5`, `density: "compact"` |
| Fiche joueur | En-tête de fiche | `origam-card` | `rounded: "xl"`, `border: true`, `elevation: "md"`<br>Jamais d’email ni de téléphone (données privées). |
| Fiche joueur | Pastille titres | `origam-chip` | `color: "primary"`, `size: "small"`<br>RG6. |
| Fiche joueur | Comparer avec… | `origam-btn` | `variant: "flat"`, `color: "primary"`, `elevation: "lg"`, `to: "/face-a-face?a=…"` |
| Fiche joueur | Chiffres (matchs, V, D) | `origam-card` | `rounded: "xl"`, `border: true`<br>Ratio marqué « à confirmer » (RG37 hors liste P5). |
| Fiche joueur | Parcours (graphique) | — (CSS d’app) | Barres CSS d’app (une série ordinale) ; données = tableau ci-dessous. origam-chart `type="column"` possible si l’on accepte des catégories ordinales. |
| Fiche joueur | Parcours (tableau) | `origam-data-table` | `headers`, `items`, `density: "compact"` |
| Fiche joueur | Adversaires fréquents | `origam-list` | `items`, `density: "comfortable"`<br>Lien « Face-à-face » = origam-btn `variant="text"`, nom accessible complet. |
| Joueurs | Recherche publique | `origam-form` | `validateOn: "submit"`<br>role="search". Décision E-e : `GET /competiteurs?q=` public. |
| Joueurs | Champ nom ou pseudo | `origam-text-field` | `type: "search"`, `label: "Nom ou pseudo"`, `variant: "solo"`, `rounded: "full"`, `clearable: true` |
| Joueurs | Filtre édition | `origam-select` | `items`, `label: "Édition jouée"`, `variant: "solo"` |
| Joueurs | Annuaire | `origam-data-table` | `headers`, `items`, `itemsPerPage: 20`, `sortBy`, `density: "compact"`<br>145 compétiteurs → 8 pages. Région aria-live pour le nombre de résultats. |
| Admin | Navigation bureau | `origam-drawer` | `permanent: true`, `width: 272`, `border: true`, `elevation: "none"`<br>Items = origam-list `nav`. |
| Admin | Items de navigation | `origam-list` | `nav: true`, `density: "comfortable"`, `rounded: "lg"` |
| Admin | Navigation mobile | `origam-bottom-nav` | `items`, `grow: true`, `elevation: "lg"`, `mandatory: true`<br>4 entrées : Tableau, Matchs, Tirages, Plus (A7). |
| Admin | Édition active | `origam-select` | `items`, `label: "Édition active"`, `variant: "solo"`, `rounded: "full"`<br>Contexte global de toutes les pages admin. |
| Admin | Centre de contrôle | `origam-stepper` | `items`, `orientation: "vertical"`, `clickable: false`, `showConnectors: true`<br>9 étapes de la Spec fonctionnelle. Statuts done / active / pending. |
| Admin | À traiter | `origam-card` | `to: "/admin/matchs?f=saisis"`, `rounded: "xl"`, `border: true`, `hover: true`<br>Compteur : origam-badge `content="7"` sur le CTA. |
| Admin | Compteur du CTA | `origam-badge` | `content: 7`, `inline: true`, `color: "secondary"` |
| Admin | Activité récente | `origam-list` | `items`, `density: "compact"`<br>Journal des tirages (auteur, horodatage). |
| Admin · scores | Filtres de file | `origam-chip-group` | `mandatory: true`, `filter: true`<br>À traiter / Saisis / Sans score / Validés (A1). |
| Admin · scores | Cartes de match | `origam-card` | `rounded: "xl"`, `border: true`, `elevation: "sm"`<br>Bureau : origam-data-table. Mobile : liste de cartes. |
| Admin · scores | Saisie (bureau) | `origam-dialog` | `modelValue: true`, `maxWidth: 560`, `persistent: false`, `scrim: true`, `title: "Saisir le score"`<br>Mobile : même contenu en tiroir bas (origam-sheet `side`/`snapPoints`, à confirmer). |
| Admin · scores | Tiroir mobile | `origam-sheet` | `open: true`, `swipeable: true`, `rounded: "xl"` |
| Admin · scores | Champs de score | `origam-number-field` | `min: 0`, `max: 5`, `label: "Clara Lambert"`, `variant: "solo"`, `rounded: "lg"`<br>Max 5 en poule, 10 en phase finale (RG22). Erreurs via `errorMessages`. |
| Admin · scores | Formulaire | `origam-form` | `validateOn: "submit"`<br>Enregistrer ≠ Valider (états : à jouer → saisi → validé). |
| Admin · scores | Rappel de règle | `origam-alert` | À vérifier : props exactes d’origam-alert non utilisées ici (Je ne sais pas lesquelles conviennent). |

## Vidéo de fond des vitrines : asset à fournir

Je n’ai pas créé de vidéo. Ce qu’il faut fournir pour remplacer le canvas de bulles :
- **Sujet** : bulles qui montent dans une bière ambrée, en macro, fond sombre ; éventuellement mousse qui déborde. Pas de texte, pas de logo, pas de visage.
- **Format** : boucle sans couture de 8 à 12 s, 1920×1080 (et 1080×1350 pour le mobile), H.264 MP4 + WebM (VP9), sans piste audio, **moins de 4 Mo** par fichier.
- **Poster** : une image fixe JPEG/AVIF du premier plan, utilisée aussi sous `prefers-reduced-motion`.
- **Droits** : tournage propre ou banque d’images avec licence commerciale. Je ne sais pas si le CCC dispose déjà d’images de ses soirées.

## Données des maquettes

- **Réelles (Spec fonctionnelle)** : 16 éditions (2012 compte deux éditions), 145 compétiteurs, 1 414 matchs dont 554 avec score, effectifs 16 (2012), 36 (2017), 49 (2023, maximum), huitièmes depuis 2015 sauf 2016, barrages en 2024.
- **Règles appliquées** : barème RG1 × N/50 (RG2), ACP sur 5 éditions et All Time (RG4), moyenne (RG5), titres en astérisques (RG6), évolution annuelle (RG8), têtes de série (RG9), tirage poule après poule (RG11), tirage à chaque tour (RG13), barrages 2024 (RG14), round-robin intégral (RG15), départage cap’s average (RG19), 5 en poule et 10 en phase finale (RG22), identifiant `{édition}-{rang}` (RG24).
- **Illustratifs** : tous les noms (fictifs), les scores, les effectifs des autres années, la répartition des poules et la règle de qualification (RG18 : « selon la configuration retenue »). Ils sont générés par un script à graine fixe, donc cohérents entre les pages (mêmes joueurs, mêmes résultats, mêmes points).
