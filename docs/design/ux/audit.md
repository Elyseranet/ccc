# Audit UX — CCC (état au 2026-10-19)

Périmètre : `app/pages/*`, `app/pages/admin/*`, `app/layouts/*`, `app/consts/*`, `app/assets/css/main.css`.

## Méthode et limites (à lire d'abord)

- Lecture complète du code des 9 pages, des 2 layouts et des consts. `npm run dev` lancé sans base : les 7 routes testées (`/`, `/competition`, `/players`, `/head-to-head`, `/admin`, `/admin/scores`, `/admin/nope`) répondent 200 (curl). Le HTML rendu a été inspecté (`<html>`, `<title>`).
- **Je n'ai pas fait de passe visuelle en navigateur ni d'audit automatisé (axe, Lighthouse) ni de test lecteur d'écran.** Tout ce qui touche au rendu (focus visible fourni par Origam, ordre de tabulation réel, comportement réel du `origam-toolbar`) est marqué « non vérifié ».
- Contrastes calculés par moi (formule WCAG) à partir des valeurs de `app/themes/ccc.theme.ts` et `main.css`.
- L'application est un **prototype sans données** (README : « prototype de présentation », pas d'auth, pas de persistance). L'audit juge donc surtout la structure et les parcours, pas des écrans remplis.
- Aucune recherche utilisateur disponible : les personas de `parcours.md` sont des hypothèses.
- Sévérités : **P0** empêche une tâche clé ; **P1** majeur (gêne forte ou non-conformité WCAG AA) ; **P2** mineur ; **P3** détail.

## Top 5

1. **P0 — Aucun parcours public n'est utilisable** : chaque page est un état vide qui expose du jargon de projet (« import en attente », « archives à importer », « prototype non connecté »).
2. **P0 — Aucune notion d'édition navigable** : 16 éditions (dont deux en 2012) mais pas de sélecteur ni d'URL par édition ; les onglets de `/competition` sont de fausses ancres.
3. **P0/P1 — Le back-office est un gabarit unique** : les 6 sections admin affichent la même page de texte, aucune saisie ; « Scores » et « Poules & matchs » sont deux entrées pour une tâche.
4. **P1 — Navigation incomplète ou dégradée** : face-à-face et profils joueurs hors navigation ; sidebar admin réduite à des points sans libellé sur mobile.
5. **P1 — Accessibilité** : pas de `lang` sur `<html>`, pas de lien d'évitement, texte gris à 3,4:1 en 8–11 px (29 occurrences).

## Constats par sévérité

### P0

| # | Constat | Où |
|---|---|---|
| U1 | Pages publiques = états vides. Textes internes exposés au visiteur : « ARCHIVES À IMPORTER », « IMPORT EN ATTENTE », « Les résultats historiques doivent être repris et contrôlés », « spécifications d'import des archives ». Un visiteur ne peut ni consulter un résultat, ni trouver un joueur, ni comparer. | `competition.vue:5,15` ; `players.vue:12-13,17-18` ; `head-to-head.vue:5-7,9` ; `hall-of-fame.vue:5,7` ; `index.vue:37` |
| U2 | `/competition` ne choisit aucune édition. Pas de sélecteur, pas d'URL par édition (donc rien à partager), et deux éditions en 2012 impose un identifiant distinct de l'année (ARCHITECTURE.md). | `competition.vue` (absence) |
| U3 | Faux onglets : ancres `href="#groups"` dans des boutons, l'état actif est codé en dur sur « Vue d'ensemble » (classe `--active` en dur) et ne change jamais ; `#bracket` et `#scores` pointent vers des `<article>` d'une grille de 3 cartes, pas vers des contenus. Aucun `role=tab`/`aria-current` géré. | `competition.vue:8-11,18-21` |
| U4 | Back-office sans saisie : les 6 sections passent par un seul gabarit (texte, 3 prérequis, « les actions d'écriture seront disponibles… »). Ni tirage, ni score, ni validation ne peuvent être faits ni même évalués. | `admin/[section].vue:3-9` ; `consts/admin-sections.const.ts` ; `consts/admin-guidance.const.ts` |

### P1

| # | Constat | Où |
|---|---|---|
| U5 | **Face-à-face et profils hors navigation.** `/head-to-head` n'est atteignable que par un bouton de `/players` ; aucune page profil n'existe, donc l'annuaire ne peut pas mener à une fiche. L'accueil (« Explorer ») duplique 3 des 5 entrées de la barre au lieu d'ouvrir des parcours. | `consts/public-navigation.const.ts` ; `players.vue:5` ; `consts/home-links.const.ts` |
| U6 | Face-à-face : deux `origam-select` **désactivés** avec `:items="[]"` ; `handleCompare` est une fonction vide. Même rempli, un `select` de 145 entrées est inutilisable ; il faut de l'autocomplétion. Doublon d'étiquettes : `legend` « Premier joueur » + label « Sélectionner un compétiteur » identique pour les deux. | `head-to-head.vue:5-7,23` |
| U7 | Annuaire : recherche en mode « formulaire + bouton Rechercher » (pas de filtrage à la frappe) ; le label est masqué visuellement et remplacé par un placeholder (« Nom ou surnom… » ; la spec parle de **pseudo**, SF P5). Aucune liste, tri, pagination prévus. | `players.vue:7-10,62` |
| U8 | Sidebar admin sur mobile (< 780 px) : libellés forcés à `font-size: 0`, il reste des points de 9 px indifférenciés. Impossible de distinguer Tirage / Poules / Bracket à vue. Les seuls indices sont accessibles au lecteur d'écran. | `layouts/admin.vue:80` |
| U9 | Aucun contexte d'édition dans l'admin : ni sélecteur, ni indication de l'édition en cours dans la barre. Toutes les actions (participants, tirage, scores) en dépendent. | `layouts/admin.vue:17-24` |
| U10 | Navigation admin plate, 8 entrées, un seul groupe « TOURNOI ». Mélange référentiel (Compétiteurs, Éditions) et tâches de l'édition en cours (Participants, Tirage, Poules, Bracket, Scores) ; « Éditions » en dernier alors que c'est l'étape 1 du parcours. « Compétiteurs » vs « Participants » : distinction réelle (profil unique vs inscription à une édition, ARCHITECTURE.md) mais invisible dans les libellés. | `consts/admin-navigation.const.ts:3-10` |
| U11 | « Scores » et « Poules & matchs » font double emploi : la fiche Scores renvoie vers `/admin/groups`. Deux entrées de menu pour une seule tâche. | `consts/admin-guidance.const.ts:9` (cible `/admin/groups`) |
| U12 | Section inconnue : `/admin/nope` répond 200 avec le titre « Compétiteurs · Administration CCC » (repli silencieux sur `competitors`, mesuré). Aucune 404. | `admin/[section].vue:34` |
| U13 | Tableau de bord : les cartes de chiffres sont des chiffres d'archive (16 / 145 / 1 414), pas des choses à faire. La liste « Mise en place » affiche « À FAIRE » en dur pour les 5 étapes quel que soit l'état. Les « accès rapides » dupliquent la sidebar (4 des 8 entrées). | `admin/index.vue:6,9,10` ; `consts/admin-dashboard.const.ts` |
| U14 | Barre publique : bouton « Connexion » + avatar aux initiales « CF » affiché à un visiteur anonyme (constante), qui mène à `/admin` sans authentification. Mélange public et organisateur dans l'en-tête ; l'avatar laisse croire à une session. | `layouts/default.vue:12-15` ; `consts/user-account.const.ts:1` |
| U15 | **WCAG 3.1.1** (A) : `<html>` n'a pas de `lang` (HTML rendu mesuré : `<html  data-mode="dark" data-theme="ccc">`). Aucune configuration `lang` dans `nuxt.config.ts`. | `nuxt.config.ts` |
| U16 | **WCAG 2.4.1** (A) : pas de lien d'évitement. `#contenu` existe sur `<main>` mais aucun lien ne le cible (grep sur le code). | `layouts/default.vue:18` |
| U17 | **WCAG 1.4.3** (AA) : `--faint` (#626772) sur fond #0e0f12 = **3,38:1** (sur #16171c : 3,16:1), sous 4,5:1. Utilisé pour du texte (notes, numéros, états « À FAIRE »). 29 déclarations de texte en 8–11 px dans pages/layouts. Pour comparaison : `--muted` sur surface = 6,42:1 (OK) ; accent sur fond = 12,87:1. | `assets/css/main.css:13` ; `index.vue:91,103` ; `admin/index.vue:67,70,74,79` ; `competition.vue:70` ; `layouts/admin.vue:61,63` |
| U18 | Sémantique : `origam-toolbar` (barre d'outils) est utilisé comme enveloppe de `<header>`/`<nav>` de page et `origam-btn` comme lien de navigation / onglet. Je n'ai pas vérifié le DOM produit par Origam pour ces composants (non vérifié) : à contrôler au passage (`nav > a`, `aria-current`). Les pages ne comportent aucun `<table>` ni liste de résultats en l'état. | `layouts/default.vue:3,9-11` ; `competition.vue:7-12` |

### P2

| # | Constat | Où |
|---|---|---|
| U19 | Hall of Fame : 7 cartes identiques « En attente des archives », sans hiérarchie : pas de chronologie des champions, pas de top N, pas de lien vers une fiche. Les 7 catégories sont documentées (titres, finales, participations, victoires, ratio, série, cuillère de bois) ; la cuillère de bois est listée en question ouverte dans ARCHITECTURE.md. | `hall-of-fame.vue:5` ; `consts/hall-categories.const.ts` |
| U20 | Variantes : schémas faits de `<span>` vides dans des `<figure>`, aucun équivalent textuel ; la page n'a pas d'entrée utile hors Règles (elle précise que les règles sont identiques, seule la disposition change). | `variants.vue:5-7` |
| U21 | Accueil : pas d'état de l'édition en cours, de résultat ni de champion ; grand hero (jusqu'à 126 px) avant la moindre information. Les trois chiffres sont en dur (non issus de données) et « 1 414 matchs archivés » sans préciser que seuls 554 ont un score (ARCHITECTURE.md). | `index.vue:6,19-21` |
| U22 | Cibles tactiles : `sidebar__link` fait 42 px (< 44 px visé ; WCAG 2.5.8 AA = 24 px, donc conforme mais sous la cible du projet) ; `density="compact"` sur des boutons de formulaire. | `layouts/admin.vue:64` ; `players.vue:9` |
| U23 | Majuscules espacées (eyebrows, badges) généralisées, en 9–11 px monospace : lisibilité réduite et chaque écran répète 2–3 libellés de ce type avant le titre. | `main.css:33` ; partout |
| U24 | Les animations existantes sont des transitions de couleur (`.16s`/`.2s`) sans garde `prefers-reduced-motion`, alors que la règle projet impose cette garde pour toute animation. Impact faible mais non conforme à la règle. | `layouts/default.vue:68` ; `layouts/admin.vue:64` |
| U25 | Barre admin supérieure : un seul libellé « ESPACE ADMINISTRATEUR » (masqué < 520 px) ; pas de déconnexion ni de compte (avatar « A » en dur, `aria-hidden`). | `layouts/admin.vue:13,20` |

### P3

- `VS` du face-à-face n'est pas marqué décoratif (`head-to-head.vue:6`).
- Badge « PROTOTYPE · NON CONNECTÉ » sur chaque page admin : utile en dev, à retirer du produit (`admin/index.vue:3`).
- Les `t('clé', 'repli')` contiennent des majuscules en dur dans le texte (« ÉDITIONS », « COMPÉTITEURS ») au lieu d'un `text-transform` : problème pour lecteurs d'écran qui épellent les majuscules et pour l'i18n.

## Constats positifs (à conserver)

- `useHead({ title })` par page ; `nuxt-route-announcer` dans `app.vue` (annonce des changements de route).
- Une seule `h1` par page ; `h2` pour les sections ; listes `ol` pour les étapes.
- Mobile : la grille et l'en-tête public se replient sans scroll horizontal de page (lecture CSS, non testé en rendu).
- Cibles de couleur : accent/fond 12,87:1.
- Les consts de navigation centralisent bien les destinations.

## État de l'existant par parcours clé

| Parcours | État | Cause |
|---|---|---|
| Consulter une édition et son bracket | Impossible | U1, U2, U3 |
| Retrouver un joueur et ses stats | Impossible (pas de liste, pas de fiche) | U1, U5, U7 |
| Comparer deux joueurs | Impossible (selects désactivés) | U6 |
| Palmarès | Placeholder | U19 |
| Admin : saisir un tirage | Non évaluable (aucun formulaire) | U4 |
| Admin : saisir puis valider un score | Non évaluable ; entrée dupliquée | U4, U11 |

## Questions Q1 à Q12 confrontées aux specs

Source : `Spec fonctionnelle.md` (SF), `Spec API.md` (API), `Spec technique.md` (ST), dossier Obsidian `Projects/CCC/` (tous datés du 2026-09-04, statut brouillon). Les décisions utilisateur du 2026-10-10 d'ARCHITECTURE.md sont postérieures aux specs.

### Résolues

| # | Réponse | Citation |
|---|---|---|
| Q1 | Une édition « en cours » est une édition non clôturée. Chaque état est défini. | SF « États et transitions » : « créée → participants ouverts → poules tirées → poules en cours → qualifiés validés → phases finales (un état par tour) → clôturée ». **Reste ouvert** : publication d'une édition en cours (voir Q1b). |
| Q2 | Le champion est dérivé du résultat par édition (tour atteint), pas saisi à part ; les classements sont complets même quand les scores de matchs manquent. | SF RG1 (« champion·ne 18 pts… ») ; ST « Ne pas stocker les classements, les calculer » ; ST Écarts : « les classements, eux, sont complets ». |
| Q3 | Le nombre de tours dépend de l'effectif ; libellés de tour fixés. Le bracket **n'est pas un arbre pré-rempli**. | SF RG24 (`Poule1` à `Poule8`, `1/16`, `Huitième`, `Quart`, `Demi`, `Finale`) ; SF P4 : « Le bracket n'est pas un arbre pré-rempli » ; SF RG13 ; SF P4 variantes : « 11 [éditions] comportent des huitièmes… une seule (2024) comporte un tour de barrages ». Taille exacte du tableau : dépend de RG18, voir Q9. |
| Q4 | Il existe un **pseudo** et un **avatar**. Public : avatar, nom, prénom, pseudo. Email et téléphone ne sont pas listés pour le public. | SF P5 : « Une fiche compétiteur montre avatar, nom, prénom, pseudo » ; SF « Comptes » (données d'un utilisateur : email, téléphone…). |
| Q5 | Statistiques de la fiche : **matchs joués, victoires, défaites**, plus l'historique des participations et résultats par année. D'autres indicateurs existent comme calculs (ratio, points marqués/encaissés, différentiel, titres, participations, moyenne). | SF P5 ; SF « Front public » : « se limitent à matchs joués / victoires / défaites » ; SF RG5, RG6, RG37. |
| Q8 | Deux rôles seulement, pas de rôle intermédiaire. Le nombre d'administrateurs n'est pas dit. | SF « Acteurs » : « ne prévoit ni arbitre, ni rôle intermédiaire entre administrateur et participant » ; SF « Comptes » : « deux rôles seulement ». |
| Q9 | Nombre de poules et de têtes de série sont **paramétrés par l'administrateur** ; têtes de série = nombre de poules. Tailles de poules 5 à 8 ; effectifs de configuration 20 à 70 par pas de 5. Plusieurs configurations de qualifiés par effectif. | SF P2 étape 1 ; SF RG9 ; SF RG15, RG16, RG18. |
| Q10 | Un tirage validé n'est **pas annulable** : « La validation est définitive ; les sources ne prévoient pas d'annulation ». **Reste ouvert** : le cas d'un désistement après tirage. | SF P2 « Échecs » ; SF « Questions ouvertes ». |
| Q11 | À la validation, le vainqueur atteint **exactement 5 (poule) / 10 (phase finale)** ; sinon refus (422). Les bornes du perdant ne sont pas dites. | SF RG22, SF « Ce que voit l'utilisateur quand ça échoue » ; API « 422 » et « PUT /matchs/{id}/score » (« le vainqueur atteint exactement 5 en poule, exactement 10 en phase finale »). Note : SF P3 « Échecs » dit « les sources ne disent pas si l'application doit le refuser » (les deux passages se contredisent dans la spec elle-même). |
| Q12 | **Seul l'administrateur saisit et valide un score.** Pas de validation par un joueur. | SF « Droits » : « Saisir et valider un score : administrateur oui, participant non » ; SF « Non couvert » : « Les scores sont saisis par l'administrateur… Aucun parcours de saisie participant n'existe dans les sources ». |

### Restantes (« Je ne sais pas »)

| # | Question | Ce que la spec dit |
|---|---|---|
| Q1b | Une édition en cours est-elle publique en temps réel, ou seulement après clôture ? | API « Questions ouvertes » : « Le front public doit-il voir une édition en cours en temps réel, ou seulement après clôture ? » |
| Q6 | Seuil minimal de matchs pour un « meilleur ratio ». | Aucune mention. La catégorie « meilleur ratio » n'est pas dans la spec (voir écarts E5). |
| Q7 | Cuillère de bois, volume de bière, horaires, cotes : inclus ou non, visibles par qui ? | SF « Questions ouvertes » : cotes (RG33-35), cuillère de bois (deux définitions RG38, A ou B), volume de bière, horaires de tirage ; API : cotes « à trancher ». |
| Q8b | Nombre d'administrateurs. | Non dit. |
| Q13 | Quelles informations personnelles un participant modifie-t-il ? Le pseudo en fait-il partie ? | SF « Questions ouvertes » ; SF « Comptes » : « certaines informations personnelles ». |
| Q14 | Définition exacte du **cap's average** (colonne de classement de poule) et critères au-delà de RG19. | RG19 le cite comme critère de départage, RG23 dit que les deux scores l'alimentent ; aucune formule. |
| Q15 | Un match validé peut-il être corrigé ? | SF « Questions ouvertes » le laisse ouvert ; ARCHITECTURE.md (2026-10-10) l'autorise tant qu'aucun tour suivant n'est engagé. |
| Q16 | Le serveur tire-t-il au sort ou enregistre-t-il le tirage physique ? | API « Questions ouvertes » ; ST « Le tirage est physique… le système enregistre un résultat, il ne le produit pas nécessairement ». ARCHITECTURE.md retient l'enregistrement. |
| Q17 | Que se passe-t-il si l'email d'une invitation est déjà pris, ou en cas d'homonymes ? | SF P1 « Échecs » : « les sources ne disent pas ». |
| Q18 | Départage de deux joueurs seulement pour une place de meilleur nème. | SF RG20 ne traite que 3 et plus ; ARCHITECTURE.md (2026-10-10) tranche : match de départage à 5. |

## Écarts entre mes livrables / le code / les décisions et la spec (à remonter, non corrigés)

| # | Écart | Citation de la spec |
|---|---|---|
| E1 | Le code propose « Faire valider le résultat par le second joueur » (`consts/admin-guidance.const.ts:9`). Contredit la spec : aucune validation par un joueur. | SF « Droits » ; SF « Non couvert » (voir Q12). |
| E2 | Le prototype propose 7 catégories de Hall of Fame (`consts/hall-categories.const.ts`) dont plus de finales, participations, victoires, meilleur ratio, plus longue série. La spec ne définit que : titres (RG6, astérisques au classement), cuillère de bois (RG38) et les classements ACP / All Time / évolution (RG4, RG8). Les autres catégories sont **absentes de la spec**. | SF « Front public » ; SF RG4, RG6, RG8, RG38. |
| E3 | Mon IA n'avait pas de place pour les **classements ACP, All Time et leur évolution**, pourtant publics. Corrigé dans les wireframes (onglets du Palmarès) : ce placement est une proposition de ma part, pas une exigence de la spec. | API « Classements et statistiques » ; SF RG4, RG8. |
| E4 | `Variantes` et la page `Face-à-face` ne figurent pas dans la liste du front public (accueil, éditions, détail d'édition, compétiteurs, fiche). Le face-à-face est un calcul (RG36-37) servi publiquement par l'API (`GET /competiteurs/{id}/face-a-face`). Variantes : aucune mention dans les specs. | SF P5, SF « Front public ». |
| E5 | Mon wireframe « Bracket » affichait des tours futurs avec un joueur connu et un « à déterminer » (arbre pré-rempli). Contredit RG13 et P4. Corrigé. | SF P4 : « Le bracket n'est pas un arbre pré-rempli » ; RG13. |
| E6 | Mon wireframe « Joueurs » prévoyait une recherche en direct sur la liste publique. L'API réserve la recherche `?q=` à l'administrateur ; la liste publique est paginée. | API « Compétiteurs » : `GET /competiteurs?q=` : administrateur. |
| E7 | Décision A3 : seul « Espace organisateur » est prévu en en-tête quand connecté. La spec donne aussi un compte au participant (profil, première connexion), qui a donc besoin d'un point d'entrée « Connexion » / « Mon profil ». | SF « Acteurs » (Participant), « Comptes et première connexion ». |
| E8 | A6 présentait la fiche joueur comme optionnelle ; la spec la **requiert**. | SF P5 ; API `GET /competiteurs/{id}`. |
| E9 | Ma question Q10 supposait une contradiction dans ARCHITECTURE.md. La spec fonctionnelle est claire (non annulable) ; reste le désistement après tirage. | SF P2 « Échecs ». |
| E10 | Détail d'édition : la spec liste participants, poules, matchs, classements, tirages, bracket. Mes onglets omettaient Participants et Tirages. Corrigé. | SF P5 ; API `GET /editions/{id}`. |
| E11 | Le centre de contrôle matérialise un workflow en **9 étapes** (création, participants, tirage des poules, matchs de poules, validation des qualifiés, tirage du bracket, matchs du bracket, finale, clôture) ; le prototype en affiche 5 et mon dashboard 4. Corrigé dans le wireframe. | SF « Centre de contrôle du tournoi ». |

## Arbitrages pour l'utilisateur

À poser via `AskUserQuestion` par le chef de projet ; je ne tranche pas.

### A1 — Admin : fusionner « Scores » dans « Poules & matchs » ?
1. **Fusionner (recommandé)** : une page « Poules et matchs » avec filtres (à traiter / saisis / validés) ; le bracket garde sa page. Coût : redirection `/admin/scores`. Gain : une tâche = une entrée.
2. Garder « Scores » comme file transverse poules + bracket ; coût : 2 modèles mentaux (match vs score), mais un seul écran de validation pour tout.
3. Fusionner et ajouter une tuile « À valider » sur le tableau de bord uniquement (variante de 1).

### A2 — Variantes : page propre ou section de Règles ?
1. **Section/onglet de « Règles » (recommandé)** : les variantes ne changent que la disposition, la page actuelle dit elle-même que les règles sont identiques ; nav publique à 4 entrées. Coût : redirection `/variants`.
2. Garder la page séparée (statu quo) : 5 entrées de nav, une page quasi statique en plus.
3. Page séparée mais retirée de la barre, liée depuis Règles.

### A3 — Accès organisateur dans la navigation publique
1. **Lien discret en pied de page + « Espace organisateur » visible seulement si connecté (recommandé)** : le visiteur ne voit pas un faux compte.
2. Bouton « Connexion » visible dans l'en-tête (statu quo, sans avatar tant que non connecté).
3. Aucun lien : accès par URL `/admin` uniquement.

### A4 — Nom de la page palmarès
1. **« Palmarès » (/palmares) (recommandé)** : cohérent avec le reste du site en français et avec le mot déjà employé dans l'accueil et le README.
2. « Hall of Fame » (/hall-of-fame) : nom actuel, anglicisme, aucun coût de migration.
3. Libellé « Palmarès » avec URL conservée.

### A5 — Structure de la navigation publique
1. **Éditions · Joueurs · Palmarès · Règles (recommandé)** ; le face-à-face devient une action de « Joueurs » (et de chaque fiche), « Compétition » devient « Éditions » avec sélecteur. 4 entrées, 2 redirections.
2. Conserver 5 entrées + ajouter « Face-à-face » : 6 entrées, parcours de comparaison direct mais barre plus chargée sur mobile.
3. Garder « Compétition » (édition en cours par défaut, archives dans un sélecteur) sans renommer.

### A6 — Créer une page profil joueur publique ? (tranché ; la spec requiert la fiche, cf. E8)
1. **Oui, route dédiée `/joueurs/<id>` (recommandé)** : partageable, point d'entrée du face-à-face, cible naturelle des liens du palmarès et des matchs.
2. Panneau latéral (drawer) depuis la liste : pas de nouvelle URL, non partageable.
3. Pas de profil : liste seule.

### A7 — Admin sur mobile
Je ne sais pas si l'organisateur saisit les scores sur téléphone, à la table de jeu.
1. **Barre d'onglets en bas (4 entrées) (recommandé si la saisie se fait sur téléphone)**.
2. Menu tiroir (hamburger) : plus simple, un geste de plus.
3. Back-office pensé pour ordinateur uniquement ; message sur mobile.
