# Parcours et architecture de l'information cibles — CCC

Statut : proposition UX. Les entrées marquées **(arbitrage Ax)** dépendent d'une décision de l'utilisateur listée dans `audit.md`. Les règles métier sont confrontées aux specs Obsidian ; ce qui reste inconnu est noté « Je ne sais pas » avec renvoi aux questions d'`audit.md`. Les arbitrages A1 à A7 sont tranchés (`decisions.md`).

## Personas (hypothèses : aucune recherche utilisateur disponible)

| Persona | Objectif | Contexte | Frustration attendue |
|---|---|---|---|
| **Visiteur / compétiteur** (public) | Voir où en est le tournoi, retrouver un résultat, ses stats ou celles d'un rival | Téléphone surtout, souvent pendant ou juste après un match, parfois en soirée | Pas de résultat clair, onglets ou chiffres qu'on ne peut pas partager |
| **Organisateur** (admin) | Faire avancer l'édition : inscriptions, tirage, scores, tour suivant | Soirée de tournoi, pression, probablement debout ; téléphone (décision A7 ; ST : usage « sur un téléphone ou un portable ») | Erreur de saisie irréversible, ne pas savoir ce qui reste à faire |
| **Curieux d'histoire** (public) | Parcourir 2012 → aujourd'hui, palmarès, records | Ordinateur, session longue | Données non reliées entre elles (pas de lien joueur ↔ édition) |

## Architecture de l'information cible

### Public

```
Accueil                         /
├── Éditions                    /editions            -> édition en cours par défaut (A5, tranché)
│    └── Édition <id>           /editions/<id>        onglets : Synthèse · Participants · Poules · Bracket · Matchs · Tirages
├── Joueurs                     /joueurs              annuaire + recherche
│    ├── Fiche joueur           /joueurs/<id>         (A6, tranché)
│    └── Face-à-face            /joueurs/face-a-face?a=&b=
├── Palmarès                    /palmares             (arbitrage A4)  champions · records
└── Règles                      /regles               Le jeu · Le tournoi · Variantes (A2, tranché)
Pied de page : Règles, Connexion. En-tête si connecté : « Mon profil » (participant) ou « Espace organisateur » (administrateur) (décision A3 + écart E7)
Compte : Première connexion `/invitation/<jeton>` · Connexion · Mon profil (wireframe `compte.html`)
```

Principes : l'édition est un objet de première classe (identifiant distinct de l'année) ; chaque état partageable a une URL (édition, onglet, joueur, paire de joueurs) ; tout nom de joueur est un lien vers sa fiche ; tout score est un lien vers son match ou sa phase.

Redirections nécessaires si A2/A4/A5 sont adoptés : `/competition`, `/players`, `/head-to-head`, `/hall-of-fame`, `/rules`, `/variants`.

### Admin

```
Barre : sélecteur d'édition (global) · voir le site public · compte
Tableau de bord                 /admin
Édition en cours
├── Participants                /admin/participants     autocomplétion, rattacher ou créer (wireframe `admin-participants.html`)
├── Tirages                     /admin/tirages          Stepper : paramètres · têtes de série · saisie · récapitulatif · validation (poules) ; tirage de tour pour le bracket
├── Poules et matchs            /admin/poules           liste filtrable, saisie et validation de score (A1, tranché)
└── Bracket                     /admin/bracket
Référentiel
├── Compétiteurs                /admin/competitors      profils uniques, contacts privés
└── Éditions                    /admin/editions         création, statut, archives
```

Principes : la barre dit **où** (édition) et la navigation dit **quoi** ; le tableau de bord répond à « que dois-je faire maintenant ? » ; une édition archivée est en lecture seule ; mobile = barre d'onglets basse (arbitrage A7).

## Parcours cibles

Format : étape → action → résultat → émotion.

### 1. Consulter une édition et son bracket (public)
1. Accueil → « Voir l'édition 2026 » → page édition, onglet Synthèse → *curiosité*.
2. Onglet Bracket → arbre d'élimination directe ; alternative en liste → *orientation*.
3. Clic sur un joueur → fiche → *continuité*.
4. Changer d'édition via le sélecteur → même onglet conservé, URL mise à jour → *contrôle*.

Points critiques : sélecteur d'édition lisible sur mobile ; bracket défilable au clavier et lisible sans couleur ; « tour non encore tiré » expliqué.

### 2. Retrouver un joueur et ses stats (public)
1. Joueurs → champ de recherche (filtrage à la frappe) → liste triable → *rapidité*.
2. Clic sur le nom → fiche : chiffres clés, parcours par édition, adversaires fréquents → *reconnaissance*.
3. Lien « Comparer avec… » → face-à-face prérempli → *envie de comparer*.

### 3. Comparer deux joueurs (public)
1. Entrée : depuis Joueurs, une fiche ou le lien partagé `?a=&b=`.
2. Deux champs à autocomplétion + « Inverser » → bilan (V–D), puis historique des rencontres → *résultat immédiat*.
3. États : même joueur deux fois (erreur), jamais affrontés, matchs sans score connu comptés à part.

### 3b. Participant : première connexion et profil (spec P1, Comptes)
1. Email d'invitation → lien `/invitation/<jeton>` → définir son mot de passe et compléter son profil (avatar, nom, prénom, pseudo, téléphone) → *accueil*.
2. Lien expiré ou déjà utilisé : message explicite (API : 410).
3. Mon profil : consulter, modifier « certaines informations » (lesquelles : Q13).

### 4. Palmarès (public)
1. Palmarès → chronologie des champions → clic sur une édition → *exploration*.
2. Records : top N par catégorie ; ex-aequo partagent le rang.
Spec : classements ACP / All Time / évolution (RG4, RG8), titres (RG6), cuillère de bois (RG38, deux définitions ouvertes). Je ne sais pas : seuil du ratio (Q6), inclusion de la cuillère de bois (Q7).

### 4b. Admin : ajouter un participant (spec P1)
1. Participants → champ à autocomplétion sur les 145 profils historiques → propositions à chaque saisie.
2. Profil existant : rattaché à l'édition, aucun compte recréé. Nouveau : avatar, nom, prénom, pseudo, email, téléphone ; le compte est créé et un email d'invitation part.
3. Retrait d'un inscrit possible seulement avant tirage ; ajout après validation du tirage refusé (API 409).
4. Homonymes et email déjà pris : Je ne sais pas (SF P1 Échecs) ; l'écran prévoit un message, le contenu est à écrire.

### 5. Admin : saisir un tirage
1. Tableau de bord → étape « Tirages » → Stepper.
2. Étape 1 : l'administrateur paramètre le nombre de poules (têtes de série = nombre de poules, RG9) ; les têtes de série sont calculées (classement ACP) et à contrôler ; départage RG10 → *confiance*.
3. Étape 2 : têtes de série placées une par poule, puis saisie poule après poule (RG11) pendant le tirage physique ; les joueurs déjà placés disparaissent des listes ; brouillon enregistré à chaque affectation → *flux*.
4. Étape 3 : récapitulatif ; étape 4 : dialogue de validation ; la validation est définitive, sans annulation (SF P2 Échecs) → *prudence*.
Poules inégales possibles (RG16) : rappel de la règle de jeu « bière » (RG17), non applicative. Désistement après tirage : Je ne sais pas (SF Questions ouvertes).

### 6. Admin : saisir puis valider un score
1. « Poules et matchs » → filtre « À traiter » → ligne du match → « Saisir » → *efficacité*.
2. Formulaire : deux champs numériques, cible affichée (5 en poule, 10 en phase finale), contrôle à la validation : le vainqueur atteint exactement la cible (RG22) → « Enregistrer » = état « Saisi » → *vigilance*.
3. « Valider » (administrateur seul, SF Droits) via dialogue récapitulatif ; bouton inactif pendant l'envoi (idempotence) ; confirmation « classement recalculé » → *soulagement*.
4. Correction : possible tant qu'aucun tour suivant n'est engagé (décision 2026-10-10), bloquée ensuite avec explication visible.
5. Conflit (validé par une autre session) et erreur réseau : messages explicites ; on invite à vérifier l'état avant de réessayer.

## Edge cases par écran

| Écran | Cas à couvrir |
|---|---|
| Accueil | aucune édition publiée ; édition en cours sans résultat ; chargement ; erreur |
| Édition | édition archivée sans détail de matchs ; matchs sans score (554 sur 1 414 ont un score) ; deux éditions en 2012 ; bracket non tiré ; égalité de classement et match de départage (cible 5, exclu des stats) ; hors ligne |
| Joueurs | 0 résultat ; 145 entrées (pagination/virtualisation) ; accents et casse dans la recherche ; homonymes (rapprochement des identités encore à faire, ARCHITECTURE.md) |
| Fiche | joueur sans score connu ; participation à une seule édition ; 404 |
| Face-à-face | même joueur ×2 ; jamais affrontés ; un joueur sans données ; URL avec identifiant inconnu |
| Palmarès | catégorie vide ; ex-aequo ; édition courante sans champion |
| Admin participants | email déjà rattaché à un autre compte ; homonyme proche (`Rémi`/`Remi`, rapprochement manuel, ST Écarts) ; ajout après tirage (refusé) ; retrait avant tirage ; échec d'envoi de l'invitation |
| Compte | lien de première connexion expiré / consommé (410) ; mot de passe refusé ; profil incomplet |
| Admin tirage | participants insuffisants ; joueur déjà placé ; tirage validé (lecture seule) ; perte de connexion en saisie |
| Admin scores | score invalide ; double clic sur Valider ; score validé par une autre session ; correction bloquée ; édition archivée ; poules non tirées |
| Admin global | session expirée ; édition inexistante ; permission refusée |

## Checklist accessibilité (WCAG 2.2 AA) — à appliquer à l'implémentation

- `<html lang="fr">` ; titre de page unique par route ; lien d'évitement « Aller au contenu » vers `main`.
- Un seul `h1` par page, hiérarchie h1 > h2 > h3 sans saut ; repères `header`, `nav` (avec `aria-label`), `main`, `footer`.
- Navigation : `aria-current="page"` sur l'entrée active ; onglets : soit `origam-tabs` (clavier flèches), soit vrais liens ; jamais un état « actif » codé en dur.
- Tous les tableaux : `caption` (visible ou masquée), `th scope`, `aria-sort` si triable ; version cartes sur mobile sans perte d'information.
- Formulaires : un `label` visible par champ (placeholder ≠ label), erreurs liées par `aria-describedby`, `inputmode="numeric"` pour les scores, groupes en `fieldset/legend`.
- Dialogues (validation de tirage/score) : focus piégé, Échap, retour du focus au déclencheur, focus initial sur l'action la moins destructive.
- Statut et résultats dynamiques : région `role="status"` (liste filtrée, enregistrement) ; `role="alert"` pour les erreurs.
- Information jamais portée par la seule couleur : statuts en texte (« Validé », « Saisi, à valider »).
- Contraste texte ≥ 4,5:1 ; remplacer `--faint` (3,38:1 sur fond) pour du texte ; taille de texte courante ≥ 14 px, rien en dessous de 12 px.
- Cibles ≥ 44 px (WCAG 2.5.8 impose 24 px au minimum).
- Bracket : alternative en liste, région défilable focalisable avec nom accessible.
- Animation uniquement CSS et désactivée sous `prefers-reduced-motion: reduce` (règle projet).
- Responsive : aucun scroll horizontal de page à 320 px ; reflow du contenu (WCAG 1.4.10).

## Correspondance composants Origam (2.37.3, vérifiée dans `packages/ds/src/components`)

Présents dans les sources : `Bracket` (+ Round/Match/Competitor), `DataTable`, `Tabs`, `Stepper`, `Dialog`, `Drawer`, `BottomNav`, `Breadcrumb`, `Chip`/`ChipGroup`, `Card`, `Badge`, `EmptyState`, `Skeleton`, `Snackbar`, `Timeline`, `Pagination`, `CommandPalette`, `Select`, `NumberField`, `ConfirmWrapper`. Le catalogue `references/components.md` (v2.6) mentionne Bracket 3 fois ; je n'ai pas relu ses descriptions.

À vérifier avant usage (non fait) : props d'autocomplétion de `Select`, rendu mobile de `DataTable`, DOM produit par `Toolbar` et `Btn` en tant que `nav`/lien, rôle exact de `ConfirmWrapper`.
Version installée dans le dépôt : `package.json` demande `origam ^2.22.0` ; la cible indiquée est 2.37.3.

| Besoin | Composant |
|---|---|
| Barre publique / admin | Toolbar, Btn, Drawer, BottomNav |
| Sélecteur d'édition | Select (menu mobile à étudier) |
| Onglets d'édition / fiche | Tabs |
| Bracket | Bracket |
| Classements, matchs, joueurs | DataTable, Pagination |
| Statuts et filtres | Chip, ChipGroup, Badge |
| Tirage | Stepper, Select, List, Dialog |
| Score | NumberField, Form, Dialog, Snackbar |
| États vide/chargement/erreur | EmptyState, Skeleton |
| Chronologie des champions | Timeline ou DataTable |

## Fichiers

`wireframes/` : `accueil`, `edition`, `joueurs`, `joueur`, `face-a-face`, `palmares`, `regles` (esquisse), `compte` (première connexion, connexion, profil), `admin-dashboard`, `admin-participants`, `admin-tirage`, `admin-score`, `wireframe.css`. Ouvrir dans un navigateur ; chaque page a une barre de navigation entre wireframes, des annotations « NOTE UX » / « ORIGAM » et des états dégradés empilés.

## Direction éditoriale (demande du 2026-10-19)

Appliquée uniquement là où la lecture est narrative : **accueil** (hero plein écran + bento) et **palmarès** (chronologie au scroll + bento de records). Voir `wireframes/accueil.html` et `wireframes/palmares.html`.

Règles pour que le « design » ne coûte pas l'efficacité :
- **Écrans denses = sobres** : bracket, classements, listes de matchs, fiche joueur, face-à-face et tout l'admin gardent tableaux/listes compacts ; l'éditorial n'y entre pas (pas de hero, pas de reveal au scroll).
- **Première information utile dans le premier écran** (état de l'édition en cours), même sous un hero fort ; un seul appel à l'action principal.
- **Bento** : chaque tuile est une réponse ou un lien ; ordre du DOM = ordre de lecture ; une colonne sur mobile.
- **Storytelling au scroll** : titres collants et révélations en CSS pur ; contenu intégralement lisible sans l'effet ; alternative « tableau triable » toujours proposée.
- **Mouvement** : CSS uniquement (transitions, `@keyframes`, éventuellement `animation-timeline`, dont le support navigateur n'est pas vérifié par moi : prévoir un repli statique) ; tout est désactivé sous `prefers-reduced-motion: reduce` ; rien de clignotant ; aucune information portée uniquement par une animation.
- **Contrastes et tailles** inchangés (4,5:1, texte courant ≥ 14 px) : un thème sombre très « design » reste soumis à U17.
- Visuels décoratifs : `alt=""` ou `aria-hidden`.
