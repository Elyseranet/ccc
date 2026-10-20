# Tableau des tickets — CCC

Il n'y a pas de remote : ce fichier fait office de tableau. Il est partagé par `backend-lead` (section Back) et `frontend-lead` (section Front). Chaque lead ne modifie que sa section. Un ticket est fermé ici **dans le même tour** que son merge, avec le SHA et la preuve de vérification.

États possibles : `À faire` · `En cours` · `Bloqué (Ax)` · `En revue` · `Fermé (SHA)`.

---

## Back

Mis à jour par `backend-lead` le 2026-10-20. Il s'agit d'un **plan** : aucun code applicatif n'est écrit.

### Tickets

| Ticket | Titre | Vague | Dépend de | Bloqué par arbitrage | État |
|---|---|---|---|---|---|
| [B-01](B-01.md) | Socle serveur : DataSource runtime, erreurs, validation, logs, rate limit, Vitest | 1 | — | — | À faire |
| [B-02](B-02.md) | Schéma métier TypeORM (M1), enums partagés, DTO `shared/` | 1 | — (accord front sur les DTO) | — | À faire |
| [B-03](B-03.md) | Fonctions de domaine pures RG1–RG10, RG15, RG19 (partiel), RG22, RG36–37 | 1 | — | A10, A11 sur deux fonctions seulement | À faire |
| [B-04](B-04.md) | Reprise : des tables d'archive vers les entités métier, avec rapport et vérification | 2 | B-01, B-02, B-03 | A5, A6, A7, A16 (pour la mise en production) | À faire |
| [B-05](B-05.md) | Public : `GET /competiteurs` (`?q=` limité), fiche, face-à-face | 2 | B-01, B-02, B-03 | — | À faire |
| [B-06](B-06.md) | Public : `GET /editions`, détail, participants, poules, tours, matchs, tirages | 2 | B-01, B-02, B-03 | A13 (commentaires de match) | À faire |
| [B-07](B-07.md) | Public : classements ACP, All Time, évolution | 2 | B-01, B-02, B-03 | A8 | À faire |
| [B-08](B-08.md) | Auth : login, logout, sessions, rôles, `/moi`, migration M2 | 2 | B-01, B-02 | **A2**, A4 | Bloqué (A2) |
| [B-09](B-09.md) | Invitations, première connexion, `POST /competiteurs` | 3 | B-08 | **A3**, A14 | Bloqué (A3) |
| [B-10](B-10.md) | Admin : éditions, identité d'un compétiteur, participants | 3 | B-08 (et le service de B-09) | — | À faire |
| [B-11](B-11.md) | Tirage des poules : têtes de série, affectations, validation, round-robin | 4 | B-10, B-03 | **A1** | Bloqué (A1) |
| [B-12](B-12.md) | Scores : enregistrer, valider (idempotent), corriger | 3 | B-08, B-02, B-03 | A15 (correction seulement) | À faire |
| [B-13](B-13.md) | Qualification, barrages, départages, tirage de tour | 4 | B-11, B-12 | **A1**, **A10**, **A11** | Bloqué (A1, A10, A11) |
| [B-14](B-14.md) | Clôture et gel des points | 5 | B-12, B-13 | — | À faire |
| [B-15](B-15.md) | Admin : flux d'activité du tableau de bord (C7) | 4 | B-11, B-12 | **A17** | Bloqué (A17) |

Hors tableau, en attente de décision : **cotes** (RG33 à RG35, arbitrage A12) et **cuillère de bois** (RG38, non affichée selon la décision E-g). Aucun ticket n'est ouvert tant que ces décisions ne sont pas rendues.

### Parallélisation

Un `backend-developer` par ticket, chacun dans son worktree `../CCC-B-xx`.

| Vague | Tickets en parallèle | Nombre de devs |
|---|---|---|
| 1 | B-01, B-02, B-03 | **3** |
| 2 | B-04, B-05, B-06, B-07, et B-08 si A2 est rendu | **4 à 5** |
| 3 | B-09, B-10, B-12 | **3** |
| 4 | B-11, puis B-13 | 1 ou 2 |
| 5 | B-14 | 1 |

Zones de conflit à surveiller :
- `server/database/entities/index.ts` (registre des entités) : B-02 le crée, B-08 l'étend.
- Horodatage des migrations : M1 vient de B-02, M2 de B-08. Chacun génère sa migration sur sa branche, puis rebase avant merge.
- `shared/enums/api-error-code.enum.ts` : chaque ticket **ajoute** ses codes, sans en renommer aucun.

Priorité front : B-05, B-06 et B-07 permettent de basculer les pages publiques des fixtures vers les routes réelles. Ils se testent sur des fixtures, sans attendre B-04. En revanche, les données réelles n'existent qu'après B-04.

### Arbitrages à rendre (non tranchés, à poser par le `project-manager`)

Une décision par ligne. L'option recommandée vient en premier.

| # | Décision | Options et conséquences | Recommandation |
|---|---|---|---|
| **A1** | **Tirage : le serveur tire-t-il au sort, ou enregistre-t-il un tirage physique ?** (Spec API, Questions ouvertes ; RG12) | (a) **Enregistrement d'un tirage physique**, avec un brouillon sauvegardé à chaque affectation : conforme à RG12 et au stepper de `parcours.md` §5. Ajoute deux routes à la Spec API (`GET …/tetes-de-serie`, `PUT /tirages/{id}/affectations`). (b) Tirage serveur : moins de saisie, mais contredit RG12, et il faut garantir et journaliser l'aléa. (c) Les deux : le serveur propose et l'administrateur peut ressaisir ; c'est le double de contrat et de tests | (a) |
| **A2** | **Session ou jeton ?** | (a) **Session serveur en base et cookie `httpOnly`** : même origine (Nuxt intégré), révocation immédiate, aucun client mobile dans les sources. (b) JWT court avec refresh : utile seulement pour un client tiers ou mobile, qui n'existe pas ; révocation plus complexe. (c) Module tiers (`nuxt-auth-utils`, session scellée) : moins de code, mais une dépendance à auditer, et la révocation est côté cookie | (a) |
| **A3** | **Fournisseur d'email** pour l'invitation (bloquant, ST) | (a) **SMTP générique** (nodemailer) vers un fournisseur transactionnel, avec Mailpit en développement : on change de fournisseur sans changer le code. Ajoute une dépendance (vérifier `npm ls axios`). (b) API HTTP d'un fournisseur via `fetch` natif : aucune dépendance, mais l'adaptateur est lié à ce fournisseur. (c) Différer : adaptateur journal seul, ce qui bloque l'onboarding réel des participants. Le nom du fournisseur (Brevo, Postmark, Resend…) reste à choisir : **Je ne sais pas** lequel est déjà utilisé | (a) |
| A4 | **Champs modifiables par un participant** (`PATCH /moi`) (SF, Questions ouvertes) | (a) **Avatar, téléphone, mot de passe**, sans le pseudo, qui sert d'identité publique et reste réservé à l'administrateur. (b) La même chose plus le pseudo, avec un risque d'usurpation sur le front public. (c) Tous les champs sauf l'email | (a) |
| A5 | **Rapprochement des 13 graphies orphelines** de l'onglet `scores` | (a) **Tableau décidé nom par nom par l'utilisateur** dans `legacy-identity-map.json`. Les 4 paires désignées par la ST sont pré-remplies, à confirmer ; les 9 autres (`Domitille Boutin` / `Domi Boutin`, `Marion Cobra`, les « JeCpa »…) se décident une par une. (b) Fusionner seulement les 4 paires de la ST et créer les 9 autres comme nouveaux compétiteurs sans points. (c) Tout créer sans fusion : les doublons du classeur sont reproduits | (a) |
| A6 | **2012a et 2012b : N = 16 déclaré, mais 11 joueurs listés** dans `Data` | (a) **Garder N = 16** comme `participant_count` : c'est la valeur qui a produit les points du classeur (5,76 = 18 × 16 / 50) ; l'écart est affiché comme « 5 participants non identifiés ». (b) N = 11 : les points de 2012 ne collent plus avec le classeur, et le test de reprise échoue | (a) |
| A7 | **2017 : deux demi-finalistes à 5,76** au lieu de 6,48 (RG2, N = 36) | (a) **Importer la valeur source (5,76)** et la signaler dans le rapport : les classements restent identiques au classeur. (b) Corriger à 6,48 selon RG2 : l'ACP et l'All Time de Simon Legoupil et d'Alan Denoyelle augmentent de 0,72 chacun, et le classement change | (a), sous réserve que l'utilisateur confirme qu'il ne s'agit pas d'une erreur à corriger |
| A8 | **Fenêtre ACP : les 5 dernières éditions *clôturées* ?** (RG4, RG9) | (a) **Clôturées seulement** : une édition en cours ne bouge pas l'ACP, et les têtes de série de l'édition N viennent des éditions N−5 à N−1. (b) Inclure l'édition en cours : le classement bouge pendant la soirée, ce qui est incohérent avec des points figés à la clôture | (a) |
| A9 | **Nom du tour avant les huitièmes** : « Barrages » (`Data`) ou « 1/16 » (`scores`) | (a) **« Barrages »**, cohérent avec le barème (« barragiste ») et avec RG14. (b) « 1/16 » | (a) |
| **A10** | **Critère principal du classement de poule, et sélection des « meilleurs *n*+1èmes » entre poules de tailles inégales** (RG18, RG19). La spec ne donne que les départages | (a) **Victoires, puis cap's average, puis confrontation directe** ; entre poules inégales, le ratio de victoires, puis le cap's average par match. Cela reste à confirmer par l'utilisateur, aucune source ne l'écrit. (b) Victoires brutes, même entre poules inégales : les poules plus grandes sont avantagées. (c) Saisie manuelle des qualifiés par l'administrateur, le serveur ne faisant que contrôler | Je ne sais pas laquelle correspond à la pratique : (a) à confirmer |
| **A11** | **Format du départage « 1v1v1 en 3 »** (RG19, RG20) : cible, nombre de côtés, saisie | (a) **Match à 3 côtés, premier à 3**. (b) Score cible non saisi, l'administrateur désigne seulement le qualifié. (c) Hors application, avec le seul résultat noté | Je ne sais pas ce que signifie « en 3 » : à expliquer par l'utilisateur |
| A12 | **Cotes** (RG33 à RG35) | (a) **Hors produit pour l'instant** : la formule source est cassée dès la deuxième ligne, et ETAT est saisi à la main (ST). (b) Réservées à l'administrateur. (c) Publiques | (a) |
| A13 | **Commentaires de match** du classeur (colonne H, par exemple « #vomito », « #loser ») affichés publiquement ? | (a) **Affichés** : c'est le folklore du tournoi, déjà public dans le classeur partagé. (b) Réservés à l'administrateur. (c) Non importés | Je ne sais pas qui lit le classeur aujourd'hui : (a) si le classeur était déjà partagé aux joueurs |
| A14 | **Durée de validité de l'invitation et politique de renvoi** (Spec API, « Événements sortants ») | (a) **7 jours, renvoi par l'administrateur** (`POST /competiteurs/{id}/invitation`, qui invalide l'ancien lien). (b) 48 h : plus sûr, mais un joueur prévenu tard ne pourra pas se connecter le soir même sans renvoi. (c) 30 jours | (a) |
| A15 | **Forme de la correction d'un score validé** (décidée sur le fond le 2026-10-10, mais sans route) | (a) **`POST /matchs/{id}/correction`** avec les nouveaux scores et l'`If-Match` : opération distincte et journalisée, 409 si un tour suivant est engagé. (b) Autoriser `PUT score` + `POST validation` sur un match validé : moins de routes, mais une erreur de saisie devient indiscernable d'une correction | (a) |
| A16 | **Les 685 gabarits de match vides** (sans joueur) de l'onglet `scores` | (a) **Ne pas les importer** : 729 matchs réels, dont 554 avec score. Le chiffre « 1 414 matchs » de la spec désigne des lignes du classeur, pas des matchs joués et identifiés. (b) Les importer sans côté : la table `match_sides` perd son invariant de deux côtés, pour des lignes sans information | (a) |

Questions secondaires, sans blocage immédiat :
- Forme du `code` d'une deuxième édition la même année (B-10) : Je ne sais pas.
- Forme de l'avatar (URL ou téléversement) : Je ne sais pas ; URL `https` en attendant.
- Forfaits et abandons (« perd sur tapis vert après abandon », commentaire de `2016-5`) : leur saisie n'est pas spécifiée.
- Horaires de tirage : seuls 2024 et 2025 sont remplis ; ils restent dans l'archive brute.
- Seuils de limite de débit (`?q=`, login) : valeurs configurables, à fixer en revue.

Arbitrage ajouté après l'échange avec le front (FA-03) :

| # | Décision | Options et conséquences | Recommandation |
|---|---|---|---|
| A17 | **Flux « Activité récente avec auteur »** du tableau de bord admin : la maquette le demande, mais aucune spec ne le prévoit | (a) **Flux dérivé de l'existant** : validations de match et de tirage, création et validation de tirage, avec auteur et horodatage déjà stockés. Pas de nouvelle table ; les ajouts et retraits de participants n'y figurent pas. (b) Table `audit_events` alimentée par toutes les écritures admin : flux complet, mais une migration et une écriture de plus dans chaque transaction. (c) Retirer le bloc de la maquette | (a) |

### Écarts de contrat avec le front (FA-03), répartition

| Écart | Pris par | Réponse |
|---|---|---|
| C1 | B-02, B-06 | `GET /stats` (ajout) et compteurs `matchCount` / `scoredMatchCount` dans `IEditionSummary`. Le « 1 414 » de la maquette dépend de A16 |
| C2 | B-02, B-06 | `IEditionSummary.champion` (compétiteur public et titres à date) remplace `championId` |
| C3 | B-06 | filtres `statut` et `tri=validated_at_desc` ; compteurs par tour ; `RECORDED` publié comme `SCHEDULED` |
| C4 | B-02, B-05 | `ICompetitorListItem` avec ses statistiques, et filtre `edition` |
| C5 | B-07 | `evolution` sans `competiteur` renvoie toutes les séries |
| C6 | B-12 | `GET /admin/editions/{id}/matchs` renvoie `IAdminMatch` avec le score saisi |
| C7 | B-11 (brouillons), B-15 (activité) | `GET /admin/editions/{id}/tirages` ; flux d'activité soumis à A17 |
| C8 | B-10 | `POST /editions/{id}/participants` avec `newCompetitor` depuis l'écran d'édition ; `POST /competiteurs` pour le référentiel |

### Constats hors périmètre back, signalés à l'équipe

- `~/CLAUDE.md` décrit un monorepo `packages/webapp` avec Redis et nodemailer, alors que CCC est une application Nuxt unique à la racine, avec `app/` et `server/`. Les tickets suivent la structure réelle.
- `docker-compose.yml` expose 3000 et 5432, et non les ports `Yxxx` de `~/CLAUDE.md`. Je ne sais pas si cette convention s'applique à CCC.

---

## Front

Mis à jour le 2026-10-20 par `frontend-lead`. Plan seulement : aucun code applicatif n'est écrit.

### Tickets

| Id | Titre | Maquette HH | Dépend de | Statut | Worktree |
|---|---|---|---|---|---|
| [F-00](F-00.md) | Lot 0 : socle (Origam 2.37.3, sass, thème, CSS, layouts, routes, a11y de base, stores, services et fixtures, composants transverses, outillage de test) | en-tête, pied, coque admin | B-01 (Vitest), B-02 (DTO) | À faire, **bloquant** | `../CCC-F-00` |
| [F-01](F-01.md) | Accueil | `index.html` | F-00 | À faire | `../CCC-F-01` |
| [F-02](F-02.md) | Palmarès | `palmares.html` | F-00 | À faire | `../CCC-F-02` |
| [F-03](F-03.md) | Édition, 6 onglets | `edition.html` | F-00 | À faire (scindable en F-03a et F-03b) | `../CCC-F-03` |
| [F-04](F-04.md) | Joueurs et fiche joueur | `joueurs.html`, `joueur.html` | F-00 | À faire | `../CCC-F-04` |
| [F-05](F-05.md) | Face-à-face | **aucune** (wireframe) | F-00, maquette | **Bloqué : design** (FA-01b) | `../CCC-F-05` |
| [F-06](F-06.md) | Règles et Variantes | **aucune** (esquisse) | F-00, maquette | **Bloqué : design** (FA-01b) | `../CCC-F-06` |
| [F-07](F-07.md) | Admin : tableau de bord | `admin.html` | F-00 | À faire | `../CCC-F-07` |
| [F-08](F-08.md) | Admin : poules et matchs, saisie de score | `admin-scores.html` | F-00 (route : FA-05) | À faire | `../CCC-F-08` |
| [F-09](F-09.md) | Admin : participants | **aucune** (wireframe) | F-00, maquette | **Bloqué : design** (FA-01b) | `../CCC-F-09` |
| [F-10](F-10.md) | Compte : connexion, invitation, Mon profil | **aucune** (wireframe) | F-00, maquette (route : FA-06) | **Bloqué : design** (FA-01b) | `../CCC-F-10` |

**Compteur** : 11 tickets front ouverts, 0 fermé ; 4 bloqués par l'absence de maquette ; 11 arbitrages en attente (FA-01b, FA-02, FA-04 à FA-12), FA-01 levé, FA-03 réglé entre leads ; A16 et A17 côté back touchent F-01 et F-07.

### Ordre et parallélisme

```
B-01, B-02 ──► F-00 (1 dev) ──┬─► F-01 ┐
                              ├─► F-02 │
                              ├─► F-03 │  6 devs en parallèle dès le merge de F-00
                              ├─► F-04 │  (7 si F-03 est scindé)
                              ├─► F-07 │
                              ├─► F-08 ┘
                              └─► F-05, F-06, F-09, F-10 : +4 devs dès que les maquettes HH existent
```

- Aucun ticket F-01 à F-10 ne touche un fichier d'un autre. F-00 crée toutes les routes, layouts, services, fixtures et composants transverses.
- Seul fichier partagé ensuite : les locales `en.json` / `fr.json`. Chaque ticket ajoute ses clés dans **son** namespace (`home.*`, `palmares.*`…), insérées à leur place alphabétique, pour réduire les conflits.
- **Bascule fixture → live**, route par route : une ligne de `app/consts/api-sources.const.ts`, une fois la route back mergée.

| Ticket front | Routes back nécessaires à la bascule |
|---|---|
| F-01, F-03 | B-06 (+ B-04 pour les données) |
| F-02 | B-07 |
| F-04, F-05 | B-05 |
| F-07 | B-06 |
| F-08 | B-12 |
| F-09 | B-09, B-10 |
| F-10 | B-08, B-09 |

### Definition of Done commune (en plus des critères de chaque ticket)

- Travail dans son worktree `../CCC-F-xx`, branche `feature/F-xx-…`. **Jamais de copie de `.env`** : `find ../CCC-F-xx -maxdepth 2 -name ".env"` doit être vide.
- **Iso-visuel** :
  - captures Playwright de la maquette et de l'app à **1440 et 390 px**, en `reducedMotion: 'reduce'`, jointes côte à côte à la PR ;
  - écart dans la tolérance FA-04 ;
  - fixtures = données de la maquette.
- `npm run test:run` vert (tests des composables de l'écran) ; `npm run test:a11y` : 0 violation axe sur les routes du ticket ; `npx nuxi typecheck` vert.
- Origam partout où un composant existe (skill `origam`), sans aucune prop inventée : chaque prop non listée dans `mapping.md` est vérifiée dans `~/Projects/origam/packages/ds/src/interfaces`.
- Checks des skills `vue-conventions` et `semantic-html` :
  - aucun `interface|type|enum|const` métier dans un `.vue` ;
  - pas de `props.` dans le template, pas de PascalCase dans le template ;
  - aucun `<!-- -->` ni `/* */` ; aucune logique dans le template ;
  - `data-cy` sur les éléments interactifs, `aria-label` sur les icônes seules.
- Zéro chaîne en dur : `t('cle', 'fallback')`, clés `snake_case` ajoutées à `en.json` **et** `fr.json` dans le même commit.
- Aucune couleur, taille ou espacement en dur : `var(--origam-*)` uniquement.
- Aucun `$fetch` ni service appelé depuis un composant ou une page : on passe par un composable. Aucun import de `server/` côté client.
- États dégradés de `parcours.md` couverts, avec des fixtures `empty` et `error`.
- Animations : CSS seulement hors vitrines ; tout est coupé sous `prefers-reduced-motion: reduce`.
- Security gate : `npm audit` sans `high` ni `critical`, `npm ls axios` vide, gitleaks propre, `/security-review` sur la branche.
- Perf : poids JS initial de la route comparé à la référence mesurée dans F-00. Toute hausse est justifiée dans la PR.
- **Au merge, dans le même tour** : la ligne du ticket passe à « Fermé » avec le SHA et la preuve, ou à « Partiel » avec ce qui reste.

### FA-03 — Écarts de contrat avec le back : réglés le 2026-10-20

Les 8 écarts sont pris en charge par `backend-lead` (section Back, « Écarts de contrat avec le front (FA-03) »). Côté front, voici ce qui en découle.

| # | Besoin front | Réponse back | Ticket front impacté |
|---|---|---|---|
| C1 | Compteurs d'archive (accueil) | `GET /stats` → `IArchiveStats`, plus `matchCount` et `scoredMatchCount` dans `IEditionSummary` (B-02, B-06). ⚠️ Le « 1 414 » de la maquette compte des lignes du classeur ; si l'arbitrage back **A16** retient (a), l'API renverra **729 dont 554 avec score**. La fixture garde la valeur de la maquette ; le texte affiché suivra l'API. | F-01 |
| C2 | Champion par édition | `IEditionSummary.champion: { competitor, titlesToDate } \| null` (B-02, B-06) | F-01, F-02 |
| C3 | Avancement et derniers scores validés | `?statut=` et `?tri=validated_at_desc` sur `/editions/{id}/matchs` ; `IRound.matchCount` et `validatedMatchCount` (B-06) | F-01, F-03 |
| C4 | Colonnes et filtre de l'annuaire | `ICompetitorListItem` et `?edition=` (B-02, B-05). `matchesPlayed` inclut les matchs d'archive sans résultat ; `wins` ne compte que les matchs validés. | F-04 |
| C5 | Évolution de tous les joueurs | `/classements/evolution?type=` sans `competiteur` → `IRankingEvolutionSeries[]` (B-07) | F-02 |
| C6 | File admin des scores | `GET /admin/editions/{id}/matchs?statut=` → `IAdminMatch` avec `sides[].recordedScore` (B-12). Le front compose les filtres (voir F-08). | F-08 |
| C7 | Activité récente, tirages en brouillon | Brouillons : `GET /admin/editions/{id}/tirages` (B-11). Flux d'activité : B-15, **bloqué par l'arbitrage back A17** (flux dérivé, table d'audit, ou retrait du bloc). | F-07 |
| C8 | Création d'un participant | `POST /editions/{id}/participants` avec `{ newCompetitor }`, qui crée en une transaction le compétiteur, le compte, l'invitation et l'inscription (B-10) | F-09 |

### Arbitrages à poser à l'utilisateur (non tranchés)

| # | Sujet | Faits | Options | Recommandation du lead front |
|---|---|---|---|---|
| FA-01 | ~~Police de texte~~ **Levé** | Le chef de projet confirme le 2026-10-20 que la référence est la version committée de `happy-hour/`, validée par l'utilisateur : **Gabarito** en texte courant et Bagel Fat One en display. | — | Corriger la ligne « DM Sans » de `decisions.md` (périmètre UX/UI) pour que la doc ne contredise plus la maquette. |
| FA-01b | Écrans sans maquette HH | Face-à-face, Règles, Admin participants et Compte n'existent qu'en wireframe. Les captures « vs maquette » sont impossibles. | (a) `ui-designer` produit les 4 maquettes HH, et F-05, F-06, F-09, F-10 attendent ; (b) intégration depuis le wireframe avec les composants HH existants, validation visuelle après coup | (a) : la consigne est iso-visuel, et sans référence il n'y a rien à mesurer. |
| FA-02 | Emplacement des interfaces du contrat | Le cadrage dit `app/interfaces/`. B-01 et B-02 ont retenu `shared/interfaces/api/` et `shared/enums/`. Nuxt 4.6.1 gère `shared/` (alias `#shared`, vérifié dans `@nuxt/schema`). | `shared/` (serveur et client importent le même fichier) ; `app/interfaces/` (le serveur importe depuis `app/`) | `shared/` : c'est le seul dossier fait pour être importé des deux côtés, et B-02 l'utilise déjà. |
| FA-04 | Tolérance « pixel perfect » | Les maquettes sont du HTML/CSS à la main ; l'app rend des composants Origam (DOM, sous-pixels, anticrénelage différents). Un écart de 0 pixel n'est pas atteignable en pratique. **Aucun seuil n'a été mesuré.** | (a) mesurer l'écart sur l'en-tête de F-00, puis fixer un seuil (`maxDiffPixelRatio`) appliqué à tous ; (b) 0 écart strict ; (c) revue visuelle humaine seule | (a) |
| FA-05 | Route admin « Poules et matchs » | `parcours.md` : `/admin/poules`. `mapping.md` : `/admin/matchs?f=saisis`. La barre basse dit « Matchs ». | `/admin/poules` ; `/admin/matchs` | Je ne tranche pas. |
| FA-06 | Route « Mon profil » | Aucune source ne la nomme (`compte.html` ne cite que `/invitation/`). | `/profil` ; `/mon-profil` ; `/compte` | Je ne tranche pas. |
| FA-07 | Dépendances de test et de typage | Aucune n'est installée. B-01 apporte Vitest et `test:run`. | Ajout de `@nuxt/test-utils`, `@vue/test-utils`, `@playwright/test`, `@axe-core/playwright`, `vue-tsc`, `typescript`, `@pinia/nuxt` (Pinia est déjà dans la stack imposée) ; ou un autre outillage choisi avec `qa-tester` | Ce jeu-là, sous réserve que `npm ls axios` et `npm audit` restent propres. |
| FA-08 | Entrée « Plus » de la barre basse admin | La maquette montre 4 entrées (Tableau, Matchs, Tirages, Plus) mais pas le contenu de « Plus ». | Un tiroir avec Participants, Bracket, Compétiteurs, Éditions et le site public ; ou une page `/admin/plus` | À faire dessiner par `ui-designer`. |
| FA-09 | Écrans admin sans ticket | Tirages (wireframe `admin-tirage.html`), Bracket, Compétiteurs et Éditions figurent dans la navigation de `admin.html`, sans maquette HH ni ticket. | (a) les masquer de la navigation jusqu'à leur ticket ; (b) les ouvrir maintenant et demander les maquettes | (b) pour Tirages, le cœur de P2 ; sinon (a). |
| FA-10 | Ordre des onglets d'édition | Maquette : Synthèse, Participants, **Tirages**, Poules, Bracket, Matchs. `parcours.md` : Tirages en dernier. | Ordre de la maquette ; ordre du parcours | La maquette (iso-visuel). |
| FA-11 | Bracket sans connecteurs (RG13) | `OrigamBracket` n'a aucune prop pour masquer les connecteurs. Seul le slot `connector` existe (`OrigamBracket.vue`, l. 84 et 180) ; un slot vide laisse probablement un `<svg class="origam-bracket__connectors">` vide (non mesuré). | (a) slot vide dans CCC, et ticket Origam seulement si le rendu diverge ; (b) ouvrir tout de suite le ticket Origam proposé ci-dessous | (a), puis décider selon la mesure de F-03. |
| FA-12 | Ratio de victoires sur la fiche | `joueur.html` affiche « 71 % de victoires · à confirmer pour la fiche (RG37) ». La spec V3 limite la fiche à joués / V / D ; RG37 inclut le ratio. | Afficher ; ne pas afficher | Je ne tranche pas. |

### Tickets Origam proposés (non créés)

1. **`OrigamBracket` : ne pas rendre les connecteurs.** Ce serait une prop booléenne, par exemple, le nom étant au choix du DS. Cas d'usage : un tournoi dont les affiches sont retirées au sort à chaque tour (CCC RG13), où les traits de liaison sont faux. Le slot `connector` permet de vider les tracés, mais pas de supprimer le `<svg>` porteur. À ouvrir seulement si FA-11 donne (b), ou si la mesure de F-03 montre un artefact.
2. **`OrigamTab` en lien de navigation** (facultatif). `ITabProps` n'étend pas `ILinkProps` : un onglet ne peut pas porter `to`. CCC synchronise l'onglet avec `?onglet=` à la main (F-02, F-03), ce qui contourne le manque sans bloquer.
3. Déjà ouvert : **Elyseranet/origam#1212** (slot de police `display`). À sa release, la classe `.font-display` migre vers `fontFamily: 'display'`.
