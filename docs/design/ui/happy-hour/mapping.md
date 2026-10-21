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
| `face-a-face.html`, `regles.html`, `compte.html` | Face-à-face (seul ratio public), règles + variantes, compte participant (1re connexion, connexion, /profil). |
| `admin.html`, `admin-matchs.html` | Tableau de bord ; poules et matchs (`/admin/matchs`, FA-05) avec la saisie ouverte. |
| `admin-editions.html` + `admin-editions.css` | F-13 : éditions (liste, création, modification, clôturée) et compétiteurs (annuaire, identité, photo) ; à valider. |
| `admin-participants.html`, `admin-tirages.html`, `admin-plus.html` | Participants (autocomplétion, création, invitation) ; tirage physique ; entrée « Plus » de la barre basse (390 px). |

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
| Fiche joueur | Chiffres (matchs, V, D) | `origam-card` | `rounded: "xl"`, `border: true`<br>Matchs joués, victoires, défaites seulement : pas de ratio (FA-12, ratio réservé au face-à-face). |
| Fiche joueur | Parcours (graphique) | — (CSS d’app) | Barres CSS d’app (une série ordinale) ; données = tableau ci-dessous. origam-chart `type="column"` possible si l’on accepte des catégories ordinales. |
| Fiche joueur | Parcours (tableau) | `origam-data-table` | `headers`, `items`, `density: "compact"` |
| Fiche joueur | Adversaires fréquents | `origam-list` | `items`, `density: "comfortable"`<br>Lien « Face-à-face » = origam-btn `variant="text"`, nom accessible complet. |
| Joueurs | Recherche publique | `origam-form` | `validateOn: "submit"`<br>role="search". Décision E-e : `GET /competiteurs?q=` public. |
| Joueurs | Champ nom ou pseudo | `origam-text-field` | `type: "search"`, `label: "Nom ou pseudo"`, `variant: "solo"`, `rounded: "full"`, `clearable: true` |
| Joueurs | Filtre édition | `origam-select` | `items`, `label: "Édition jouée"`, `variant: "solo"` |
| Joueurs | Annuaire | `origam-data-table` | `headers`, `items`, `itemsPerPage: 20`, `sortBy`, `density: "compact"`<br>145 compétiteurs → 8 pages. Région aria-live pour le nombre de résultats. |
| Admin | Navigation bureau | `origam-drawer` | `permanent: true`, `width: 272`, `border: true`, `elevation: "none"`<br>Items = origam-list `nav` : Tableau de bord, Participants, Tirages, Poules et matchs. Bracket, Compétiteurs, Éditions masqués jusqu’à leur ticket (FA-09). |
| Admin | Items de navigation | `origam-list` | `nav: true`, `density: "comfortable"`, `rounded: "lg"` |
| Admin | Navigation mobile | `origam-bottom-nav` | `items`, `grow: true`, `elevation: "lg"`, `mandatory: true`<br>4 entrées : Tableau, Matchs, Tirages, Plus (A7). |
| Admin | Édition active | `origam-select` | `items`, `label: "Édition active"`, `variant: "solo"`, `rounded: "full"`<br>Contexte global de toutes les pages admin. |
| Admin | Centre de contrôle | `origam-stepper` | `items`, `orientation: "vertical"`, `clickable: false`, `showConnectors: true`<br>9 étapes de la Spec fonctionnelle. Statuts done / active / pending. |
| Admin | À traiter | `origam-card` | `to: "/admin/matchs?f=saisis"`, `rounded: "xl"`, `border: true`, `hover: true`<br>Compteur : origam-badge `content="7"` sur le CTA. Route `/admin/matchs` (FA-05). |
| Admin | Compteur du CTA | `origam-badge` | `content: 7`, `inline: true`, `color: "secondary"` |
| Admin | Activité récente | `origam-list` | `items`, `density: "compact"`<br>Flux dérivé des seules validations de match et de tirage, sans table d’audit (A17). |
| Admin · matchs | Filtres de file | `origam-chip-group` | `mandatory: true`, `filter: true`<br>À traiter / Saisis / Sans score / Validés (A1). |
| Admin · matchs | Cartes de match | `origam-card` | `rounded: "xl"`, `border: true`, `elevation: "sm"`<br>Bureau : origam-data-table. Mobile : liste de cartes. |
| Admin · matchs | Saisie (bureau) | `origam-dialog` | `modelValue: true`, `maxWidth: 560`, `persistent: false`, `scrim: true`, `title: "Saisir le score"`<br>Mobile : même contenu en tiroir bas (origam-sheet `side`/`snapPoints`, à confirmer). |
| Admin · matchs | Tiroir mobile | `origam-sheet` | `open: true`, `swipeable: true`, `rounded: "xl"` |
| Admin · matchs | Champs de score | `origam-number-field` | `min: 0`, `max: 5`, `label: "Clara Lambert"`, `variant: "solo"`, `rounded: "lg"`<br>Max 5 en poule, 10 en phase finale (RG22). Erreurs via `errorMessages`. |
| Admin · matchs | Formulaire | `origam-form` | `validateOn: "submit"`<br>Enregistrer ≠ Valider (états : à jouer → saisi → validé). |
| Admin · matchs | Rappel de règle | `origam-alert` | `status: "info"`, `title: "Cible 5"`, `text: "En poule, le vainqueur marque exactement 5 (RG22)."`, `rounded: "lg"`, `density: "compact"`<br>Props vérifiées le 2026-10-20 (IAlertProps : status success | info | warning | error). |
| Face-à-face | Choix des joueurs | `origam-select` | `autocomplete: true`, `search: "…"`, `items`, `label: "Joueur 1"`, `variant: "solo"`, `rounded: "full"`, `clearable: true`<br>×2 ; URL `?a=&b=` partageable. Bouton « Inverser » : origam-btn `icon` + `aria-label`. |
| Face-à-face | Inverser | `origam-btn` | `icon: true`, `variant: "outlined"`, `rounded: "full"`, `prependAriaLabel: "Inverser les deux joueurs"`<br>Nom accessible aussi en `aria-label` natif. |
| Face-à-face | Score des rencontres | `origam-card` | `rounded: "xl"`, `border: true`, `elevation: "md"`<br>Proportion = barre + texte « 2 – 2 » (jamais la couleur seule). Départages exclus. |
| Face-à-face | Bilans globaux (RG37) | `origam-data-list` | `items`, `density: "compact"`, `rounded: "lg"`<br>Matchs, ratio, V, D, points marqués / encaissés, différentiel : le SEUL endroit public où le ratio apparaît (FA-12). |
| Face-à-face | Historique (RG36) | `origam-data-table` | `headers`, `items`, `density: "compact"`<br>Rencontres sans score connu comptées à part, jamais comme nuls. |
| Règles | Onglets Le jeu / Le tournoi / Variantes | `origam-tabs` | `variant: "pills"`, `rounded: "full"`, `color: "primary"`<br>Variantes = section de Règles (A2), redirection `/variants`. |
| Règles | Déroulé d’un point | `origam-stepper` | `items`, `orientation: "horizontal"`, `clickable: false`<br>Contenu repris de app/pages/rules.vue. |
| Règles | Règles d’or (RG25–RG32) | `origam-list` | `items`<br>Grille statique, aucun défilement automatique. |
| Règles | Schéma d’une variante | `origam-card` | `rounded: "xl"`, `border: true`<br>Schéma SVG `role="img"` + `aria-label` décrivant la disposition ; textes repris de app/pages/variants.vue. |
| Compte | Mot de passe (1re connexion) | `origam-password-field` | `label: "Mot de passe"`, `variant: "solo"`, `rounded: "full"`, `strengthBar: true`, `persistentRequirements: true`<br>Lien d’invitation valable 7 jours, usage unique (A14). |
| Compte | Avatar | `origam-file-field` | `label: "Avatar"`, `variant: "solo"`, `rounded: "full"`, `maxFileSize: 2000000`, `showSize: true`<br>A4 : le participant modifie avatar, téléphone, mot de passe. |
| Compte | Téléphone | `origam-text-field` | `type: "tel"`, `label: "Téléphone"`, `variant: "solo"`, `rounded: "full"`, `hint: "Privé, jamais public"` |
| Compte | Champs en lecture seule (/profil) | `origam-data-list` | `items`, `density: "compact"`, `rounded: "lg"`<br>Nom, prénom, pseudo (réservé à l’admin, A4), email masqué. |
| Compte | Erreur de connexion | `origam-alert` | `status: "error"`, `text: "Email ou mot de passe incorrect."`, `rounded: "lg"`, `density: "compact"` |
| Admin · participants | Recherche / autocomplétion | `origam-select` | `autocomplete: true`, `search: "Cam"`, `items`, `label: "Nom, prénom ou pseudo"`, `variant: "solo"`, `rounded: "full"`, `noDataText: "Aucun profil ne correspond."`<br>Dernier item du menu : « Créer un nouveau participant » (slot de liste). Un seul flux : chercher → rattacher ou créer → inviter. |
| Admin · participants | Formulaire de création | `origam-form` | `validateOn: "submit"`<br>Champs SF P1 : nom, prénom, pseudo, avatar (origam-file-field), email, téléphone (privés). |
| Admin · participants | Email déjà pris | `origam-text-field` | `type: "email"`, `label: "Email"`, `error: true`, `errorMessages`, `variant: "solo"`, `rounded: "full"`<br>Refus 409 ; proposer le rattachement du profil existant. |
| Admin · participants | Information invitation | `origam-alert` | `status: "info"`, `title: "Invitation"`, `text: "Lien valable 7 jours ; un renvoi annule l’ancien."`, `rounded: "lg"`<br>A14. |
| Admin · participants | Inscrits | `origam-data-table` | `headers`, `items`, `itemsPerPage: 8`, `density: "compact"`<br>États du compte : Invité, Actif, Invitation expirée (→ Renvoyer). Retrait possible avant le tirage seulement. |
| Admin · participants | Confirmation | `origam-snackbar` | `modelValue: true`, `text: "Invitation envoyée"`, `status: "success"`, `location: "bottom"`, `timeout: 4000` |
| Admin · tirages | Étapes du tirage | `origam-stepper` | `items`, `orientation: "horizontal"`, `clickable: false`, `showConnectors: true`<br>5 étapes ; vertical sur mobile. |
| Admin · tirages | Avancement | `origam-progress` | `modelValue: 82`, `color: "primary"`, `rounded: true`<br>37 / 45 joueurs placés. |
| Admin · tirages | Affectation d’une place | `origam-select` | `autocomplete: true`, `items`, `label: "Poule 1, place 2"`, `variant: "solo"`, `rounded: "full"`, `density: "compact"`<br>Un joueur placé disparaît des autres listes. Têtes de série en place 1 (RG9, RG11). |
| Admin · tirages | Brouillon enregistré | `origam-snackbar` | `modelValue: true`, `text: "Brouillon enregistré"`, `status: "success"`, `location: "bottom"`, `timeout: 2500`<br>A1 : brouillon serveur à chaque affectation. |
| Admin · tirages | Têtes de série | `origam-list` | `items`, `density: "compact"`<br>ACP sur les 5 dernières éditions clôturées (A8). |
| Admin · tirages | Confirmation de validation | `origam-dialog` | `modelValue: true`, `persistent: true`, `maxWidth: 560`, `title: "Valider le tirage des poules ?"`, `scrim: true`<br>Non annulable : le texte le dit, focus initial sur « Annuler », bouton `color="error"`. |
| Admin · tirages | Valider définitivement | `origam-btn` | `variant: "flat"`, `color: "error"`, `size: "large"` |
| Admin · Plus (mobile) | Entrée « Plus » | `origam-list` | `nav: true`, `items`, `density: "comfortable"`, `rounded: "lg"`<br>Participants, Voir le site public, Mon compte (FA-08). Rien de masqué par FA-09. |
| Admin · Plus (mobile) | Édition active | `origam-select` | `items`, `label: "Édition active"`, `variant: "solo"`, `rounded: "full"` |
| Admin · Plus (mobile) | Déconnexion | `origam-btn` | `variant: "outlined"`, `block: true` |
| F-13 · Éditions | Navigation (tiroir) | `origam-drawer` | `permanent: true`, `width: 272`, `border: true`<br>Section « Référentiel » réactivée : Éditions, Compétiteurs (levée de FA-09 pour F-13). L’entrée courante reçoit la classe active selon la route. |
| F-13 · Éditions | Onglets de la maquette | `origam-tabs` | `variant: "pills"`, `rounded: "full"`, `color: "primary"`<br>Dans l’app : deux routes distinctes (éditions, compétiteurs) ; les onglets ne servent qu’à présenter les écrans dans la maquette. |
| F-13 · Éditions | Recherche | `origam-text-field` | `type: "search"`, `label: "Rechercher une édition"`, `variant: "solo"`, `rounded: "full"`, `clearable: true` |
| F-13 · Éditions | Créer une édition | `origam-btn` | `variant: "flat"`, `color: "primary"`, `elevation: "lg"`, `to: "/admin/editions/nouvelle"`<br>Route exacte : Je ne sais pas, à fixer par le front. |
| F-13 · Éditions | Liste des éditions | `origam-data-table` | `headers`, `items`, `density: "compact"`, `hover: true`, `sortBy`<br>Colonnes : code, année, nom, date, statut (EDITION_STATUS), origine (EDITION_ORIGIN), participants, action. Archive : nom, date, lieu « Non renseigné ». |
| F-13 · Éditions | Statut | `origam-chip` | `size: "small"`, `pill: true`, `color: "success"`<br>CLOSED = success ; POOLS_PLAYING / QUALIFIED / PLAYOFFS = secondary (néon) ; REGISTRATION / POOLS_DRAWN = info. |
| F-13 · Éditions | Année (création) | `origam-number-field` | `label: "Année"`, `min: 2012`, `max: 2099`, `precision: 0`, `required: true`, `variant: "solo"`, `rounded: "full"`, `errorMessages`<br>Bornes min / max : Je ne sais pas, à confirmer avec le schéma de B-10. |
| F-13 · Éditions | Nom, lieu | `origam-text-field` | `label: "Nom"`, `variant: "solo"`, `rounded: "full"`, `placeholder: "…"` |
| F-13 · Éditions | Date | `origam-date-picker-field` | `label: "Date"`, `variant: "solo"`, `rounded: "full"`, `clearable: true` |
| F-13 · Éditions | Description | `origam-textarea-field` | `label: "Description"`, `rows: 3`, `autoGrow: true`, `variant: "solo"`, `rounded: "lg"` |
| F-13 · Éditions | Rappel « code généré » | `origam-alert` | `status: "info"`, `title: "Code"`, `text: "…"`, `rounded: "lg"`, `density: "compact"`<br>CE-1 : 2027, puis 2027b, 2027c… Le code n’est jamais saisi. |
| F-13 · Éditions | Erreur de validation (400) | `origam-alert` | `status: "error"`, `title: "Le formulaire contient une erreur."`, `text: "…"`, `rounded: "lg"`<br>Plus le message de champ via `errorMessages`. |
| F-13 · Éditions | Code épuisé (409) | `origam-alert` | `status: "error"`, `title: "Plus aucun code disponible pour cette année."`, `text: "…"`, `rounded: "lg"`<br>EDITION_CODE_EXHAUSTED. |
| F-13 · Éditions | Confirmation de création | `origam-card` | `rounded: "xl"`, `border: true`, `elevation: "md"`<br>Affiche le code attribué et l’adresse publique /editions/<code>. Actions : ajouter les participants, modifier les informations. |
| F-13 · Éditions | Champs en lecture seule | `origam-data-list` | `items`, `density: "compact"`, `rounded: "lg"`<br>Code, année, statut (R-9). Édition clôturée : tous les champs. |
| F-13 · Éditions | Édition clôturée (409) | `origam-alert` | `status: "error"`, `title: "Modification refusée."`, `text: "…"`, `rounded: "lg"`<br>EDITION_CLOSED. État par défaut d’une édition CLOSED : formulaire remplacé par la lecture seule. |
| F-13 · Compétiteurs | Annuaire admin | `origam-data-table` | `headers`, `items`, `itemsPerPage: 10`, `density: "compact"`, `hover: true`<br>Colonnes : nom affiché, prénom, nom, pseudo, éditions, action « Corriger ». Ligne en cours d’édition marquée. |
| F-13 · Compétiteurs | Avatar | `origam-avatar` | `image: "…"`, `text: "LB"`, `size: "x-large"`, `rounded: "full"`<br>Sans photo : initiales (`text`). |
| F-13 · Compétiteurs | Envoi de photo | `origam-file-field` | `label: "Envoyer une photo"`, `maxFileSize: 2097152`, `maxFileSizeErrorString: "…"`, `variant: "solo"`, `rounded: "full"`, `hint: "JPEG, PNG ou WebP, 2 Mo maximum"`<br>PUT /competiteurs/{id}/avatar (B-16). Le filtre de type (accept) : Je ne sais pas si OrigamFileField le transmet à l’input (aucune prop `accept` dans IFileFieldProps) ; le serveur refuse de toute façon en 415. |
| F-13 · Compétiteurs | Supprimer la photo | `origam-btn` | `variant: "outlined"`, `size: "small"`, `disabled: true`<br>DELETE /competiteurs/{id}/avatar → initiales. Désactivé quand il n’y a pas de photo. |
| F-13 · Compétiteurs | Erreurs de photo | `origam-alert` | `status: "error"`, `text: "Fichier trop lourd : 2 Mo maximum."`, `density: "compact"`, `rounded: "lg"`<br>413 trop lourd ; 415 format refusé ; 422 fichier illisible (message à rédiger). |
| F-13 · Compétiteurs | Identité | `origam-text-field` | `label: "Nom affiché"`, `required: true`, `variant: "solo"`, `rounded: "full"`, `hint: "Utilisé partout sur le site public."`<br>Plus prénom, nom, pseudo. PATCH /competiteurs/{id} (B-10). |
| F-13 · Plus (mobile) | Entrées réactivées | `origam-list` | `nav: true`, `items`, `density: "comfortable"`, `rounded: "lg"`<br>Éditions et Compétiteurs ajoutées en tête du menu « Plus ». |

## Vidéo de fond des vitrines : asset à fournir

Je n’ai pas créé de vidéo. Ce qu’il faut fournir pour remplacer le canvas de bulles :
- **Sujet** : bulles qui montent dans une bière ambrée, en macro, fond sombre ; éventuellement mousse qui déborde. Pas de texte, pas de logo, pas de visage.
- **Format** : boucle sans couture de 8 à 12 s, 1920×1080 (et 1080×1350 pour le mobile), H.264 MP4 + WebM (VP9), sans piste audio, **moins de 4 Mo** par fichier.
- **Poster** : une image fixe JPEG/AVIF du premier plan, utilisée aussi sous `prefers-reduced-motion`.
- **Droits** : tournage propre ou banque d’images avec licence commerciale. Je ne sais pas si le CCC dispose déjà d’images de ses soirées.

## Données des maquettes

- **Réelles** : 16 éditions (2012 compte deux éditions), 145 compétiteurs, **729 matchs joués dont 554 avec score** (A16 ; l’ancien « 1 414 » comptait 685 gabarits vides), effectifs 16 (2012), 36 (2017), 49 (2023, maximum), huitièmes depuis 2015 sauf 2016, barrages en 2024.
- **Règles appliquées** : barème RG1 × N/50 (RG2), ACP sur 5 éditions et All Time (RG4), moyenne (RG5), titres en astérisques (RG6), évolution annuelle (RG8), têtes de série (RG9), tirage poule après poule (RG11), tirage à chaque tour (RG13), barrages 2024 (RG14), round-robin intégral (RG15), départage cap’s average (RG19), 5 en poule et 10 en phase finale (RG22), identifiant `{édition}-{rang}` (RG24).
- **Illustratifs** : tous les noms (fictifs), les scores, les effectifs des autres années, la répartition des poules et la règle de qualification (RG18 : « selon la configuration retenue »). Ils sont générés par un script à graine fixe, donc cohérents entre les pages (mêmes joueurs, mêmes résultats, mêmes points).
- ⚠️ **Écart connu** : avec des tournois complets en poule, le volume de matchs par édition des maquettes (ex. 120 en 2025) dépasse la moyenne réelle (729 / 16 ≈ 46). Les vraies données d’import remplaceront ces volumes.
- **Libellé public proposé (A16)** : « 729 matchs joués depuis 2012, dont 554 avec score ».
