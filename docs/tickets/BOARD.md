# Tableau des tickets — CCC

Les tickets vivent dans le dépôt (remote `origin` = Elyseranet/ccc, privé) : ce fichier fait office de tableau. Il est partagé par `backend-lead` (section Back) et `frontend-lead` (section Front). Chaque lead ne modifie que sa section. Un ticket est fermé ici **dans le même tour** que son merge, avec le SHA et la preuve de vérification.

États possibles : `À faire` · `En cours` · `Bloqué (Ax)` · `En revue` · `Fermé (SHA)`.

---

## Back

Mis à jour par `backend-lead` le 2026-10-22, après T-ARCH-01 (`src/` à plat, ARCH-1 à ARCH-12). Le contrat d'API vit dans `src/interfaces/`, `src/types/` et `src/enums/` (plus de `shared/`, ARCH-4). Aucune donnée fictive : les tests back lisent une base `_test` chargée par leurs propres jeux de test ou par `src/assets/seeds/archives.sql` (ARCH-5, ARCH-8).

### Tickets

| Ticket | Titre | Vague | Dépend de | Bloqué par arbitrage | État |
|---|---|---|---|---|---|
| [B-01](B-01.md) | Socle serveur : DataSource runtime, erreurs, validation, logs, rate limit, Vitest | 1 | — | — | **Fermé** — mergé dans `develop` @ `a188c52` (intégration `57055e5`) |
| [B-02](B-02.md) | Schéma métier TypeORM (M1), enums et DTO du contrat (aujourd'hui dans `src/enums/` et `src/interfaces/`, ARCH-4) | 1 | — (accord front sur les DTO, obtenu) | — | **Fermé** — mergé dans `develop` @ `a188c52` (intégration `57055e5`) |
| [B-03](B-03.md) | Fonctions de domaine pures RG1–RG10, RG15, RG19 (partiel), RG22, RG36–37 | 1 | — | — | **Fermé** — mergé dans `develop` @ `a188c52` (intégration `57055e5`) |
| [B-04](B-04.md) | Reprise : des tables d'archive vers les entités métier, avec rapport et vérification | 2 | B-01, B-02, B-03 | — (A5 tranché le 2026-10-20 : lignes 1 à 12 fusionnées, ligne 13 créée) | **Fermé** — mergé dans `develop` @ `124c85a` (intégration `a72d6aa`) |
| [B-05](B-05.md) | Public : `GET /competiteurs` (`?q=` limité), fiche, face-à-face | 2 | B-01, B-02, B-03 | — | **Fermé** — mergé dans `develop` @ `124c85a` (intégration `a72d6aa`) |
| [B-06](B-06.md) | Public : `GET /editions`, détail, participants, poules, tours, matchs, tirages | 2 | B-01, B-02, B-03 | — | **Fermé** — mergé dans `develop` @ `124c85a` (intégration `a72d6aa`) |
| [B-07](B-07.md) | Public : classements ACP, All Time, évolution | 2 | B-01, B-02, B-03 | — | **Fermé** — mergé dans `develop` @ `124c85a` (intégration `a72d6aa`) |
| [B-08](B-08.md) | Auth : login, logout, sessions, rôles, `/moi`, migration M2 | 2 | B-01, B-02 | — | **Fermé** — mergé dans `develop` @ `124c85a` (intégration `a72d6aa`) |
| [B-09](B-09.md) | Invitations, première connexion, `POST /competiteurs` | 3 | B-08 | — (fournisseur SMTP de prod : configuration) | En cours : validé sur l'ancienne arborescence (`feature/B-09` @ `531ea89`, PROD-1 compris) ; réappliqué avec T-SEC-04 par dev-b09 sur `feature/wave3a-identity` (depuis `82d914e`) |
| [B-10](B-10.md) | Admin : éditions, identité d'un compétiteur, participants | 3 | B-08 (et le service de B-09) | — | En cours : validé sur l'ancienne arborescence (`feature/B-10` @ `d2563c3`, email branché) ; à réappliquer par dev-b10 sur `feature/wave3a-identity`, après B-09 |
| [B-11](B-11.md) | Tirage des poules : têtes de série, affectations, validation, round-robin | 4 | B-10, B-03 | — | À faire |
| [B-12](B-12.md) | Scores : enregistrer, valider (idempotent), corriger | 3 | B-08, B-02, B-03 | — | En cours : réappliqué par dev-b12 (`feature/B-12-r` @ `a97dd60`, légers verts) ; test:db, test:api et doc d'API `docs/api/matchs.md` en cours |
| [B-13](B-13.md) | Qualification, barrages, départages, tirage de tour | 4 | B-11, B-12 | — (R-1, R-2, R-6, R-7 tranchés le 2026-10-20) | À faire |
| [B-14](B-14.md) | Clôture et gel des points | 5 | B-12, B-13 | — | À faire |
| [B-15](B-15.md) | Admin : flux d'activité du tableau de bord (C7) | 4 | B-11, B-12 | — (A17 tranché le 2026-10-20 : flux dérivé) | À faire |
| [B-16](B-16.md) | Avatar : téléversement d'une photo stockée en base, EXIF supprimé (AV-1) | 3 | B-08, B-09, B-10 | — (AV-1 tranché le 2026-10-20) | En cours : validé sur l'ancienne arborescence (`feature/B-16` @ `4e39f80`) ; à réappliquer par dev-b16 sur `feature/wave3a-identity`, après B-10 |
| [B-17](B-17.md) | Compléments du contrat public (G2, G3, G4, G6) et contrat anticipé de B-11 et B-15 (G7) | 3a | develop (B-05, B-06, B-07) | — | En cours : validé sur l'ancienne arborescence (`feature/B-17` @ `27ee5cd`, G11 compris) ; réappliqué par dev-b12 (`feature/B-17-r` @ `8517bc5`, légers verts), test:db et test:api sur `archives.sql` en cours |

Hors produit : **cotes** (RG33 à RG35, A12 tranché le 2026-10-20). En attente : **cuillère de bois** (RG38, non affichée selon la décision E-g). Aucun ticket ouvert pour ces deux sujets.

### Parallélisation

Un `backend-developer` par ticket, chacun dans son worktree `../CCC-B-xx`.

| Vague | Tickets en parallèle | Nombre de devs |
|---|---|---|
| 1 | B-01, B-02, B-03 | **3** — fermée (merge `a188c52`) |
| 2 | B-04, B-05, B-06, B-07, B-08 (+ T-SEC-03, T-DB-01) | **5** — fermée (merge `124c85a`) |
| 3a | B-09, B-10, B-12, B-16, B-17, T-SEC-04, T-OPS-02 (T-SEC-05 fermé sans objet, ARCH-5) | **3** au plus (PAR-1) |
| 3b | B-11 (après B-10) | 1 |
| 3c | B-13 et B-15 (après B-11 et B-12) | 2 |
| 3d | B-14 (après B-12 et B-13) | 1 |

#### Plan de la vague 3 (2026-10-21, plan seulement : aucun dev lancé avant le go du `project-manager`)

Toutes les branches partent de `develop` @ `e1a2709` (vague 2 mergée).

**Reprise du 2026-10-22, après T-ARCH-01** (`develop` @ `82d914e`). Les branches sont réappliquées à la main, pas rebasées. T-SEC-04, B-09, B-10 et B-16 partagent beaucoup de fichiers (de 22 à 47 fichiers communs par paire), et leurs branches contiennent des copies des commits des autres. Ils sont donc réappliqués en chaîne sur une branche unique, `feature/wave3a-identity` : T-SEC-04 et B-09, puis B-10, puis B-16. B-12, B-17 et T-OPS-02 se recoupent peu avec la chaîne et ne se recoupent pas entre eux : ils sont repris en parallèle (`feature/B-12-r`, `feature/B-17-r`, `feature/T-OPS-02-r`), puis intégrés avec la chaîne sur `feature/integration-wave3a`.

| Étape | Ticket | Démarre quand | Pourquoi ce placement |
|---|---|---|---|
| 3a | **B-09** invitations, première connexion, `POST /competiteurs`, lien de `user:create-admin` | tout de suite | B-08 est mergé. **Premier commit séparé** : le service `createCompetitorWithAccount` (transaction compétiteur, compte et invitation), dont B-10 a besoin. Même méthode que les mappers de B-05 en vague 2 |
| 3a | **B-10** admin éditions, identité, participants ; `code` immuable (R-9) | tout de suite | Rattachement d'un compétiteur existant, éditions et `PATCH /competiteurs/{id}` ne dépendent que de B-08. La branche `{ newCompetitor }` reprend le premier commit de B-09 par cherry-pick |
| 3a | **B-12** scores : enregistrer, valider, corriger, vue admin des matchs | tout de suite | Dépend de B-02, B-03 et B-08, tous mergés ; il se teste sur ses propres jeux de matchs en base `_test` (plus de fixtures, ARCH-8). Critère ETag (B-06) et R-3 inclus |
| 3a | **B-16** avatar : téléversement, `sharp` 0.35.5 épinglé, EXIF supprimé | tout de suite | Les routes `/moi/avatar` et `/competiteurs/{id}/avatar` ne dépendent que de B-08. B-16 **porte seul** le retrait de `avatarUrl` (schéma de `PATCH /moi`, colonne `competitors.avatar_url`). B-09 n'ajoute donc **pas** d'avatar à `newCompetitor`. Le parcours de création en deux appels (F-09) ne demande B-10 que pour le test de bout en bout |
| 3a | **T-SEC-04** L2 (concurrence de scrypt), L3 (option `secureCookie` explicite), N1, N3 | tout de suite | Corrige le socle d'auth et `readBoundedJsonBody` (N3). Zone partagée avec B-09 (hachage, cookie de session) : voir les conflits ci-dessous |
| 3a | **T-SEC-05** convertisseur Python, seed sans `runMigrations()` | tout de suite | Indépendant : script Python et seed legacy uniquement |
| 3b | **B-11** tirage des poules | après le merge (ou l'intégration) de B-10 | Il a besoin des participants et de l'état d'édition livrés par B-10 |
| 3c | **B-13** qualification, barrages, départages, tirage de tour | après B-11 et B-12 | Il consomme les tirages (B-11) et la validation des scores (B-12) |
| 3c | **B-15** flux d'activité admin | après B-11 et B-12 | Il dérive l'activité des validations de match (B-12) et de tirage (B-11) |
| 3d | **B-14** clôture et gel des points | après B-12 et B-13 | La finale doit être validable (B-13) |

Parallélisme maximal : **6 devs** en 3a. Ensuite 1, puis 2, puis 1. Intégration et contrôles par étape, comme en vague 2 : branche d'intégration, test:api ×5 sur base neuve, migrations aller/retour/aller, revue de sécurité, puis merge par le `project-manager` (MERGE-1).

Zones de conflit à surveiller :
- `src/consts/entities.const.ts` (registre `ENTITIES`, ex-`entities/index.ts`) : chaque ticket qui crée une entité l'y ajoute.
- Horodatage des migrations : M1 vient de B-02, M2 de B-08. Les migrations vivent dans `src/server/db/migrations/`.
- `src/enums/api-error-code.enum.ts` : chaque ticket **ajoute** ses codes, sans en renommer aucun.
- **Vague 3, migrations** : B-09 (table `invitations`) et B-16 (`competitor_avatars`, retrait de `competitors.avatar_url`) en créent une chacun ; B-14 n'en crée aucune a priori. Chacun la génère sur sa branche. À l'intégration, l'horodatage le plus récent passe en dernier, puis `migration:generate` doit répondre « No changes ».
- **Vague 3, auth** : B-09 (consommation d'invitation : hachage et ouverture de session) et T-SEC-04 (sémaphore scrypt, option `secureCookie`) touchent `password.util.ts`, `session-token.util.ts` et `login.post.ts`. T-SEC-04 livre en premier ses fonctions (`hashPassword` sous sémaphore, `buildSessionCookieOptions(config)`), et B-09 les appelle, sans les réécrire.
- **Vague 3, profil** : B-16 modifie `src/schemas/auth.schema.ts` (retrait de `avatarUrl`) et `moi.patch.ts` ; B-09 et B-10 n'y touchent pas.
- **Vague 3, corps de requête** : B-16 (multipart) doit contourner explicitement la limite JSON de 16 Ko (M2), et T-SEC-04 (N3) ajoute un délai de lecture dans `readBoundedJsonBody` (`src/utils/validation.util.ts`). Le délai de N3 s'applique aussi au flux multipart de B-16.

Priorité front : les écrans appellent toujours la route réelle (ARCH-8). Tant qu'une route n'existe pas, `pendingTicket` dans `src/consts/api-routes.const.ts` nomme le ticket back qui la livre, et ce ticket le retire dans le commit de la route (ARCH-11).

### Arbitrages

**A1 à A16 sont tranchés** par l'utilisateur le 2026-10-20. La décision fait foi dans `docs/design/ux/decisions.md`, section « Arbitrages back », et elle est reportée dans les critères d'acceptation des tickets. Toutes les décisions suivent l'option (a) recommandée.

| # | Décision | Tickets |
|---|---|---|
| A1 | Le serveur enregistre le tirage physique, avec un brouillon à chaque affectation | B-11, B-13 |
| A2 | Session serveur en base et cookie `httpOnly` | B-08 |
| A3 | SMTP nodemailer, Mailpit en dev ; fournisseur de prod à choisir plus tard | B-09 |
| A4 | Le participant modifie avatar, téléphone et mot de passe ; pseudo réservé à l'admin | B-08 |
| A5 | Correspondance nom par nom décidée par l'utilisateur (`legacy-identity-map.md`, **à remplir**) | B-04 |
| A6 | 2012a et 2012b : N = 16 conservé, « 5 participants non identifiés » | B-04, B-06 |
| A7 | 2017 : 5,76 conservé, écart signalé | B-04 |
| A8 | ACP = 5 dernières éditions clôturées | B-03, B-07 |
| A9 | Tour avant les huitièmes = « Barrages » | B-02, B-04, B-13 |
| A10 | Poule : victoires → cap's average → confrontation directe ; entre poules : ratio de victoires → cap's average par match | B-03, B-06, B-13 |
| A11 | « 1v1v1 en 3 » = match à 3 côtés, premier à 3 | B-02, B-03, B-13 |
| A12 | Cotes hors produit | — |
| A13 | Commentaires de match importés, visibles par l'admin uniquement | B-02, B-04, B-06 |
| A14 | Invitation valable 7 jours, renvoi par l'admin qui invalide l'ancien lien | B-09 |
| A15 | `POST /matchs/{id}/correction` journalisée, 409 si tour suivant engagé | B-12 |
| A16 | Gabarits vides non importés : 729 matchs, dont 554 avec score ; « 1 414 » est faux | B-04, B-06 |

Questions de règle tranchées le 2026-10-20 (`decisions.md`, R-1 à R-6) : départage à N côtés premier à 3 (R-1), perdants ex aequo (R-2), « tour suivant engagé » validé (R-3), commentaires d'édition réservés à l'admin (R-4), bilan V/D sur les seuls matchs avec score avec le nombre de résultats inconnus (R-5), mini-poule avant le départage (R-6). A17 tranché : flux dérivé. **Aucune question back ouverte.**

Waiver npm audit (AUDIT-1, 2026-10-20) : chaque merge le mentionne ; remédiation suivie par [T-SEC-01](T-SEC-01.md).

R-7 (2026-10-20) : un départage qui doit pourvoir plusieurs places se rejoue entre les perdants jusqu'à pourvoir toutes les places (B-13).

Sécurité liée au déploiement (IP derrière proxy, SSL PostgreSQL) : [T-SEC-02](T-SEC-02.md), bloqué par le choix d'hébergement.

Durcissement du limiteur de débit et des erreurs 4xx (3 LOW de la re-review sur 57055e5) : [T-SEC-03](T-SEC-03.md), **fermé** — mergé dans `develop` @ `124c85a`.

Constats LOW de la revue de sécurité de la vague 2 (918308d) : [T-SEC-04](T-SEC-04.md), vague 3. **En cours** : validé sur l'ancienne arborescence (`feature/T-SEC-04` @ `bbfaa8b` : L2, L3, N3 ; N1 documenté) ; réappliqué par dev-b09 en tête de `feature/wave3a-identity`. Il couvre la concurrence de scrypt (L2) et le cookie Secure piloté par une option explicite (L3). L7 est fermé par B-16.

Dérive de schéma de M0 sur `legacy_workbook_rows` : [T-DB-01](T-DB-01.md), **fermé** — mergé dans `develop` @ `124c85a`.

Durcissement du convertisseur XLSX (Python) et des migrations du seed legacy (relecture de sécurité de B-04) : [T-SEC-05](T-SEC-05.md), vague 3. **Fermé sans objet** par le `project-manager` le 2026-10-22 : le convertisseur Python et le seed legacy sont supprimés (ARCH-5), la branche n'est pas mergée.

Statuts HTTP du back à migrer vers `src/consts/http-status.const.ts` (fichier unique front et back, ARCH-2), proposé par le `frontend-lead` : [T-HTTP-01](T-HTTP-01.md), **À faire**, après le merge de F-00h et de la vague 3a.

Échecs intermittents de la suite Vitest (fichiers non collectés, hooks à 60 s) : [T-QA-01](T-QA-01.md), **ouvert**. Le garde-fou est mergé dans `develop` @ `2913c81` (branche rebasée `95823da`). Avec lui, `test:run` échoue si un fichier découvert manque au rapport. La cause racine n'est pas trouvée : 14 anomalies spontanées sur 469 runs, 4 signatures. Le garde-fou rend l'incident visible, il ne l'empêche pas. Décision QA-1 : L'enquête est en pause et le ticket reste ouvert.

#### Historique des options présentées (A1 à A16)

Une décision par ligne. L'option recommandée venait en premier.

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

- `~/CLAUDE.md` décrit un monorepo `packages/webapp` avec Redis et nodemailer, alors que CCC est une application Nuxt unique à la racine, avec `src/` à plat. Le `CLAUDE.md` du projet le précise depuis le 2026-10-22 ; les tickets suivent cette structure.
- `docker-compose.yml` expose 3000 et 5432, et non les ports `Yxxx` de `~/CLAUDE.md`. Je ne sais pas si cette convention s'applique à CCC.

---

## Front

Mis à jour le 2026-10-22 par `frontend-lead`, après T-ARCH-01 (arborescence `src/` à plat, aucune donnée fictive : ARCH-1 à ARCH-12, `CLAUDE.md` du projet).

### Tickets

| Id | Titre | Maquette HH | Dépend de | Statut | Worktree |
|---|---|---|---|---|---|
| [F-00](F-00.md) | Lot 0 : socle (Origam 2.37.3, sass, thème, CSS, layouts, routes, a11y de base, stores, services et fixtures, composants transverses, outillage de test) | en-tête, pied, `admin.html`, `admin-matchs.html`, `admin-plus.html` | B-01 (Vitest), B-02 (DTO) | **Fermé** — squash dans `develop` @ `a90f586` (branche `0e6c965`) | `../CCC-F-00` |
| [F-01](F-01.md) | Accueil | `index.html` | F-00 | À faire | `../CCC-F-01` |
| [F-02](F-02.md) | Palmarès | `palmares.html` | F-00, B-17 (finale) | À faire | `../CCC-F-02` |
| [F-03](F-03.md) | Édition, 6 onglets | `edition.html` | F-00 | À faire (scindable en F-03a et F-03b) | `../CCC-F-03` |
| [F-04](F-04.md) | Joueurs et fiche joueur | `joueurs.html`, `joueur.html` | F-00, F-00h, F-00o, F-00p, B-17 (parcours, titres de l'adversaire, enums de tri) | En cours (dev-f04) : v3 033a428 revue le 2026-10-22 ; attend F-00q (chips) et T-ARCH-03 ; pagination maison en arbitrage (chef de projet) ; F-04-ADV (4 adversaires, lien au-delà de 4) intégré | `../CCC-F-04` |
| [F-05](F-05.md) | Face-à-face | `face-a-face.html` | F-00, F-00h | En cours (dev-f05), 0ae6634 sur F-00h 2158d28 : écarts « choix » et « hero » à expliquer ; duel@390 par alignement du texte de la maquette sur les données réelles. **À la validation : supprimer le worktree `agent-a70ac359346e804a8` et le conteneur `ccc-f05-pg`** | `../CCC-F-05` |
| [F-06](F-06.md) | Règles et Variantes | `regles.html` | F-00 | **Fermé** (squash f85ef6e, ticket fermé acc6406) | `../CCC-F-06` |
| [F-07](F-07.md) | Admin : tableau de bord | `admin.html` | F-00, F-00b, F-00c, B-17 (types de l'activité) | À faire | `../CCC-F-07` |
| [F-08](F-08.md) | Admin : poules et matchs (`/admin/matchs`), saisie de score | `admin-matchs.html` | F-00 | À faire | `../CCC-F-08` |
| [F-09](F-09.md) | Admin : participants | `admin-participants.html` | F-00, B-16 (avatar) | À faire (débloqué par 37f4c07) | `../CCC-F-09` |
| [F-10](F-10.md) | Compte : `/connexion`, `/invitation/[jeton]`, `/profil` | `compte.html` | F-00, B-08, B-16 (avatar) | À faire (débloqué par 37f4c07) | `../CCC-F-10` |
| [F-11](F-11.md) | Admin : tirage des poules (`/admin/tirages`) | `admin-tirages.html` | F-00, B-17 (DTO), B-11 (routes) | À faire (créé, FA-09) | `../CCC-F-11` |
| [F-12](F-12.md) | Admin : page « Plus » mobile (`/admin/plus`) | `admin-plus.html` | F-00 | **Fermé** — squash dans `develop` @ `ef81699` (branche `3d1e91a`) | `../CCC-F-12` |
| [F-13](F-13.md) | Admin : créer et modifier une édition, corriger l'identité d'un compétiteur | validée, **bb6f998** | F-00, B-10, B-16 (photo) | À faire, maquette validée bb6f998 ; en file PAR-1 | à créer |
| [T-LIVE-01](T-LIVE-01.md) | Première bascule LIVE : ME, EDITIONS et AUTH_LOGOUT ; `/admin/plus` livrée ; garde OPS-3 en conditions réelles | — | F-12 mergé, B-04, B-08, T-OPS-01 | **Partiel** : ME, EDITIONS et AUTH_LOGOUT en route réelle par T-ARCH-01 ; reste `delivered: true` sur `/admin/plus` et la preuve dans le conteneur. Premier créneau PAR-1 libre | à créer |
| [F-14](F-14.md) | Écarts visuels résiduels de develop : sélecteur d'édition `solo` (D1), filet absent aux angles (D2), décalages de 1 px (D3, D4), masque trop large (M1) | maquettes de F-00, F-06, F-12 | — | À faire, ouvert le 2026-10-22 (relecture humaine des écarts après ARCH-9) ; en file PAR-1 | `../CCC-F-14` |

**Compteur** (2026-10-22) : 14 tickets front ouverts (F-01 à F-05, F-07 à F-11, F-13, F-14, T-LIVE-01 partiel ; 2 en cours : F-04, F-05), 3 fermés (F-00, F-06, F-12). Prérequis en cours : F-00h, F-00n. Aucun arbitrage front en attente.

### Ordre et parallélisme

```
B-01, B-02 ──► F-00 (1 dev, en cours) ──► F-01 … F-12 : 12 tickets en parallèle (13 si F-03 est scindé)
```

- Aucun ticket F-01 à F-12 ne touche un fichier d'un autre. F-00 crée toutes les routes (`/admin/matchs`, `/admin/tirages`, `/admin/plus` et `/profil` compris), les layouts, services, composants transverses et la table des libellés de tours (ses fixtures ont été supprimées par ARCH-8).
- Seul fichier partagé ensuite : les locales `en.json` / `fr.json`. Chaque ticket ajoute ses clés dans **son** namespace, insérées à leur place alphabétique.
- **Plus de bascule fixture → live** (ARCH-8) : un écran appelle toujours la route réelle. Tant qu'elle n'existe pas (`pendingTicket` dans `src/consts/api-routes.const.ts`), il affiche l'état d'erreur d'AsyncState et ses e2e sont annotés `awaiting-route` avec le ticket back (ARCH-11). À la livraison de la route, le back retire `pendingTicket` dans le même commit.

| Ticket front | Routes back attendues par l'écran |
|---|---|
| F-01, F-03 | B-06 (+ B-04 pour les données) |
| F-02 | B-07 |
| F-04, F-05 | B-05 |
| F-07 | B-06, B-11, B-15 |
| F-08 | B-12 |
| F-09 | B-09, B-10, B-16 |
| F-10 | B-08, B-09, B-16 |
| F-12 | B-08 |
| F-11 | B-11 |

### Lancement en parallèle (dès que F-00 est dans develop)

Ordre : la vague 2 back, puis F-00 (squash), puis **F-01 à F-12 lancés ensemble**, un dev par ticket, chacun dans son worktree.

**Réutiliser ce que F-00 livre, ne jamais le recréer** :
- composants `src/components/common/` (PageHero, GoldenRules, BubblesBackdrop, PlayerLink, AsyncState, BrandMark, SkipLink, AppDataTable) et `src/components/icons/` ;
- composables de données (`useEditions`, `useEdition`, `useCompetitors`, `useCompetitor`, `useHeadToHead`, `useRankings`, `useMe`, `useAdminEdition`, `useNavigationState`) ;
- `BaseService` et ses services (`src/services/`, fusionnés navigateur et serveur, ARCH-2 : un composant n'importe jamais leurs fonctions serveur) ;
- `src/consts/routes.const.ts` et `src/consts/round-labels.const.ts` (A9 « Barrages ») ;
- stores `auth` et `admin-edition` ;
- DTO et enums du contrat dans `src/interfaces/` et `src/enums/` (FA-02 abandonnée, ARCH-4).

**Qui touche quoi**, pour éviter les conflits :

| Fichier partagé | Règle |
|---|---|
| `src/consts/page-delivery.const.ts` (T-OPS-01) | Toutes les routes y sont pré-déclarées. Un ticket passe **sa** ligne à `delivered: true` quand l'écran est branché et qu'aucun de ses endpoints n'a de `pendingTicket` (`npm run test:release`). |
| `src/enums/api-endpoint.enum.ts`, `src/consts/api-routes.const.ts` | Clés pré-déclarées. Le front n'y touche pas : le back retire `pendingTicket` à la livraison de la route. |
| Services | F-09 crée `participant.service.ts`, F-10 crée `auth.service.ts`. F-08 ajoute les écritures dans `match.service.ts`, F-11 dans `draw.service.ts`. Aucun autre ticket ne modifie un service. |
| Données de test | **Aucune fixture** (ARCH-8). Les e2e lisent la base `_test` chargée par `src/assets/seeds/archives.sql`, avec des sessions réelles (`signIn(context, role)`). Les états dégradés (vide, erreur, 404, 409, 429…) se testent en unitaire, la réponse du service étant simulée dans le test, jamais dans un fichier de `src/`. |
| `src/assets/locales/en.json` et `fr.json` | Clés ajoutées **uniquement** dans le namespace du ticket (`home.*`, `palmares.*`, `edition.*`, `players.*`, `player.*`, `head_to_head.*`, `rules.*`, `admin.dashboard.*`, `admin.matches.*`, `admin.participants.*`, `account.*`, `admin.draws.*`, `admin.more.*`), insérées à leur place alphabétique, dans les deux fichiers. |
| e2e | Chaque ticket ajoute `tests/e2e/visual/<ticket>.spec.ts` et, au besoin, `tests/e2e/a11y/<ticket>.spec.ts`, en s'appuyant sur `tests/e2e/visual.util.ts` (F-00). Il ne modifie ni `visual.spec.ts` ni `a11y.spec.ts`. Seul F-03 modifie `tests/e2e/pages.const.ts`, pour passer l'URL d'édition au code (R-9). |
| Prérequis partagés (cherry-pickés dans develop) | **Mergés** : F-00b → 0636c05 ; F-00c → 26107be ; F-00d → 4c92de2, 39e12d3 ; F-00e → 2bab527, 5074a4f ; F-00f → 5626ea8, 2489908 ; F-00g → ed0a5e7 ; F-00i (filtre Origam du typecheck) → 8b8ef5f ; F-00j (AppDataTable, #1246, #1250) → 23b6524, af2dfc8 ; F-00k (font: inherit) → 0c25157 ; **F-00l** (halo public sur une couche fixe, fond admin sur le conteneur, onglets en pilule dans le thème, #1252, #1253) → **088919b**. **F-00m** (champs et boutons dans le thème) → **9f027c5** ; **F-00h** (useCompetitor(s) à ids nullables, statuts HTTP réunis dans `http-status.const.ts`) → **d0613b6** ; **F-00n** (chip neutre par défaut, 3 champs outlined, anneau de focus 3 px) → **e5c853b**. **F-00o** (PlayerLink `inline`, padding outlined x-large, #1261) → **859f47c** ; **F-00g bis** (séparateur de ligne en `border-top`, #1262) → **0ae3dac**. **En cours** : F-00p (fil d'Ariane global, dev-f05 ; interligne codé en dur par Origam à contourner, fiche à venir) ; **F-00q** (taille des chips selon la maquette : padding 4/12, interligne 16,64 px, 800f21a, en contrôle) ; **F-00r** (interligne des boutons = celle du thème, prop `lineHeight` d'`origam-btn`, e6a4371, en contrôle) ; **F-00s** (couleur du placeholder des champs, text.tertiary, fiche Origam, dev-f04) ; F-00p : écart de 8 px après le séparateur du fil d'Ariane trouvé en relecture, en correction (dev-f05) ; références des contournements `main.css` dans l'en-tête du thème (5b135b3, branche `chore/origam-workaround-refs`) ; F-14 D1 (dev-f06, après F-00n). **F-00o** (PlayerLink variante « en ligne » : les `--origam-btn---*` portés par le composant, plus aucune surcharge `:deep(.player-link)` ; compensation de padding des boutons outlined : thème ou fiche Origam, dev-f04). **F-00p** (fil d'Ariane global : `origam-breadcrumb` dans le thème, slot PageHero si nécessaire, dev-f05). **Refusé** : la première version de F-00g bis (d3bc8a5), filet d'en-tête à 2 px alors que la maquette le veut à 1 px (hh.css:105). Vraie cause trouvée ensuite (6311022) : séparateur de ligne en `border-top` dans la maquette (hh.css:106), en `border-bottom` des td chez Origam. F-02, F-03, F-04, F-05, F-08 et F-09 utilisent AppDataTable, **sans cast local**. Au rebase sur F-00l, F-02 et F-03 remesurent leurs onglets. |
| Propriétaires de fichiers partagés pour la vague F | `competitor.service.ts` → F-04 ; `base.service.ts` et `api-client.interface.ts` → F-08 (`headers`) ; `GoldenRules.vue` → F-06 (variante `cards`) ; `auth.service.ts` → F-00d, puis F-10. Les nouvelles clés d'endpoint sont insérées dans l'ordre alphabétique. |
| B-17 | Les fixtures ayant disparu (ARCH-8), il n'y a plus de valeurs techniques à remplacer. Tant que B-17 n'est pas mergé, un champ absent des DTO n'est ni inventé ni simulé dans l'écran : le dev le liste au lead (champ, zone, maquette). |
| Recettes Origam (mapping.md f88de34, 1787148 et 1b8d7c8, à appliquer partout) | **CTA principal** (`.btn--primary`) : `variant="flat"`, `bg-color="primary"`, `elevation="lg"`, `hover: { elevation: 'xl' }`, **sans `color`**. **Action destructive** (« Valider définitivement ») : `bg-color="danger"`, car `error` n'est pas une intention Origam. **Chips** : pleine = `color` **et** `bg-color` de la même intention (`color="primary" bg-color="primary"`, idem secondary ; décision chef de projet 2026-10-22, mapping.md 5b1742f) : avec `bg-color` seul, le texte par défaut du thème (F-00n) s'applique et la directive de contraste d'Origam le force en noir ; teintée = `color` + `bg-color` sur `feedback…bgSubtle` ; neutre = le défaut du thème (F-00n), sans prop. **Le premier ticket qui affiche une chip (F-01 ou F-04) vérifie dans son e2e la couleur calculée d'une chip de chaque famille : pleine primary et secondary rgb(22, 11, 46) sans `data-origam-contrast-fixed`, teintée success, neutre.** Les décalages verticaux au survol et à l'appui de la maquette (−3 px, +4 px) sont **abandonnés** : aucune prop Origam ne les porte, on ne surcharge pas le DOM interne. **Champs** : ne pas poser `variant` (le défaut du thème, `outlined`, fait foi, F-00m). **CTA de formulaire** : `size="x-large"` (48 px). |
| Masques du contrôle visuel (ARCH-9) | On masque les **valeurs** de données (noms, scores, compteurs, initiales), jamais la structure : filet, fond, rayon, chevron et gabarit restent comparés. Les masques actuels du sélecteur d'édition couvrent tout le champ et cachent un défaut réel (F-14, M1). |
| Contrats back non mergés | On n'anticipe pas un DTO back : on attend qu'il soit dans `src/interfaces/`. Si un écran en a besoin avant, interface de vue `src/interfaces/*-view.interface.ts`, mappée au merge. |
| Parallélisme (PAR-1, fabdef3) | **Au plus 3 devs front actifs en même temps**, un nuxt dev chacun. Le lead tient la file. Actifs au 2026-10-22 : dev-f04 (F-04), dev-f05 (F-00h puis F-05), dev-f06 (F-00n puis F-14 D1). File : T-LIVE-01, F-14 (D2 à M1), F-10, F-01, F-02, F-07, F-08, F-09, F-11, F-03, F-13. |
| Serveurs `nuxt dev` | **À arrêter à la fin de chaque vérification**, jamais laissés en tâche de fond. 13 serveurs oubliés faisaient tomber Playwright en délai dépassé (6 échecs) ; après leur arrêt, 46/46. |
| Layouts, thème, `main.css` | **Aucun ticket ne les modifie.** Un besoin dans la coque se remonte au lead front, qui décide d'un ticket dédié. |

**Points d'attention par ticket** :
- F-03 : l'URL porte le code d'édition (R-9) ; carte « Matchs » selon R-10.
- F-04 et F-05 : R-5 (V/D sur les matchs avec score uniquement) et `winRatio` à null.
- F-07 : flux d'activité dérivé (A17) ; état d'erreur d'AsyncState jusqu'au merge de B-15 (ARCH-11).
- F-09 et F-10 : avatar téléversé et stocké en base (AV-1), via `origam-file-field` limité à 2 Mo ; ils dépendent de **B-16** pour la bascule. F-10 supprime `ISessionIdentity` au profit d'`IMe` (B-08).
- F-01, F-03, F-04, F-05 : un avatar de joueur public = `ICompetitorPublic.avatarUrl` (route publique B-16, cache immuable par `?v=`), sinon les initiales (`origam-avatar` `text`). Affichage carré, recadré par CSS, avec un `alt` traduit ou `aria-hidden` si le nom est déjà à côté.
- Tous : à la livraison, **confirmer ou corriger sa ligne `PAGE_DELIVERY`** (endpoints réellement consommés par la page ; ceux du layout sont déclarés à part) avant de passer `delivered: true` (T-OPS-01).
- Tous les écrans de lecture : l'erreur **429** (limite de 300 requêtes par minute et par IP sur les lectures publiques) passe par `AsyncState`, qui affiche un message dédié avec « Réessayer » (fourni par F-00). On la teste en unitaire, réponse 429 simulée dans le test (ARCH-8).
- F-08 à F-11 (écritures) : corps JSON avec `Content-Type: application/json` (posé par `$fetch`), sous 16 Ko ; 400 et 413 traduits. L'avatar part en multipart (2 Mo).
- Tous : tests a11y des formulaires sur le rendu hydraté, à cause de l'id d'input qui change entre serveur et client (Origam #1226).

### Definition of Done commune (en plus des critères de chaque ticket)

- Travail dans son worktree `../CCC-F-xx`, branche `feature/F-xx-…`. e2e : variables de base en ligne de commande (README, « e2e sur les vraies données »). **Jamais de copie de `.env`** : `find ../CCC-F-xx -maxdepth 2 -name ".env"` doit être vide.
- **Iso-visuel** :
  - captures Playwright de la maquette et de l'app à **1440 et 390 px**, en `reducedMotion: 'reduce'`, jointes côte à côte à la PR ;
  - **écart ≤ 1 % par zone** (FA-04, validé), et image d'écart relue par un humain avant le merge ;
  - captures sur les vraies données (base `_test`), pixel perfect sur les zones fixes, seules les **valeurs** de données masquées (ARCH-9).
- `npm run test:run` vert (tests des composables de l'écran) ; `npm run test:a11y` : 0 violation axe sur les routes du ticket ; `npx nuxi typecheck` vert.
- Origam partout où un composant existe (skill `origam`), sans aucune prop inventée : chaque prop non listée dans `mapping.md` est vérifiée dans `~/Projects/origam/packages/ds/src/interfaces`.
- Checks des skills `vue-conventions` et `semantic-html` :
  - aucun `interface|type|enum|const` métier dans un `.vue` ;
  - pas de `props.` dans le template, pas de PascalCase dans le template ;
  - aucun `<!-- -->` ni `/* */` ; aucune logique dans le template ;
  - `data-cy` sur les éléments interactifs, `aria-label` sur les icônes seules.
- Zéro chaîne en dur : `t('cle', 'fallback')`, clés `snake_case` ajoutées à `en.json` **et** `fr.json` dans le même commit.
- Aucune couleur, taille ou espacement en dur : `var(--origam-*)` uniquement.
- Aucun `$fetch` ni service appelé depuis un composant ou une page : on passe par un composable. Aucun import de `src/server/` ni des fonctions serveur d'un service fusionné côté client (`npm run test:bundle`).
- États dégradés de `parcours.md` couverts : en unitaire (réponse du service simulée dans le test) et, quand la base de test les contient, en e2e. Un écran dont la route manque affiche l'erreur d'AsyncState, e2e annoté `awaiting-route`.
- Animations : CSS seulement hors vitrines ; tout est coupé sous `prefers-reduced-motion: reduce`.
- Security gate : `npm audit` sans `high` ni `critical`, `npm ls axios` vide, gitleaks propre, `/security-review` sur la branche.
- Perf : poids JS initial de la route comparé à la référence mesurée dans F-00. Toute hausse est justifiée dans la PR.
- **Au merge, dans le même tour** : la ligne du ticket passe à « Fermé » avec le SHA et la preuve, ou à « Partiel » avec ce qui reste.

### FA-03 — Écarts de contrat avec le back : réglés le 2026-10-20

Les 8 écarts sont pris en charge par `backend-lead` (section Back, « Écarts de contrat avec le front (FA-03) »). Côté front, voici ce qui en découle.

| # | Besoin front | Réponse back | Ticket front impacté |
|---|---|---|---|
| C1 | Compteurs d'archive (accueil) | `GET /stats` → `IArchiveStats`, plus `matchCount` et `scoredMatchCount` dans `IEditionSummary` (B-02, B-06). **A16 tranché** : 729 matchs, dont 554 avec score (le « 1 414 » de la maquette est faux). Aucun chiffre en dur ; le libellé est à valider avec le chef de projet. | F-01 |
| C2 | Champion par édition | `IEditionSummary.champion: { competitor, titlesToDate } \| null` (B-02, B-06) | F-01, F-02 |
| C3 | Avancement et derniers scores validés | `?statut=` et `?tri=validated_at_desc` sur `/editions/{id}/matchs` ; `IRound.matchCount` et `validatedMatchCount` (B-06) | F-01, F-03 |
| C4 | Colonnes et filtre de l'annuaire | `ICompetitorListItem` et `?edition=` (B-02, B-05). `matchesPlayed` inclut les matchs d'archive sans résultat ; `wins` ne compte que les matchs validés. | F-04 |
| C5 | Évolution de tous les joueurs | `/classements/evolution?type=` sans `competiteur` → `IRankingEvolutionSeries[]` (B-07) | F-02 |
| C6 | File admin des scores | `GET /admin/editions/{id}/matchs?statut=` → `IAdminMatch` avec `sides[].recordedScore` (B-12). Le front compose les filtres (voir F-08). | F-08 |
| C7 | Activité récente, tirages en brouillon | Brouillons : `GET /admin/editions/{id}/tirages` (B-11). Flux d'activité : B-15, **bloqué par l'arbitrage back A17** (flux dérivé, table d'audit, ou retrait du bloc). | F-07 |
| C8 | Création d'un participant | `POST /editions/{id}/participants` avec `{ newCompetitor }`, qui crée en une transaction le compétiteur, le compte, l'invitation et l'inscription (B-10) | F-09 |

### Arbitrages front : tous tranchés (2026-10-20)

Les décisions sont consignées dans `docs/design/ux/decisions.md`, section « Arbitrages front ». Elles sont reportées dans les tickets :
- **FA-01** : Gabarito → F-00.
- **FA-01b** : maquettes livrées (37f4c07) → F-05, F-06, F-09, F-10.
- **FA-02** : `shared/` → F-00. **Abandonnée** le 2026-10-22 (ARCH-4) : le contrat vit dans `src/interfaces/` et `src/enums/`.
- **FA-04** : seuil mesuré sur l'en-tête dans F-00, puis soumis à l'utilisateur → F-00, et tous les tickets.
- **FA-05** : `/admin/matchs` → F-00, F-08.
- **FA-06** : `/profil` → F-00, F-10.
- **FA-07** : outillage accepté → F-00.
- **FA-08** : « Plus » maquetté → F-12.
- **FA-09** : Tirages ticketé ; Bracket, Compétiteurs et Éditions masqués → F-00, F-11.
- **FA-10** : ordre de la maquette → F-03.
- **FA-11** : slot `connector` vide → F-03.
- **FA-12** : pas de ratio sur la fiche → F-04, F-05.
- **A17** : flux dérivé → F-07.

### Tickets Origam proposés (non créés)

1. **`OrigamBracket` : ne pas rendre les connecteurs** (seulement si la mesure de F-03 montre un artefact, FA-11). Ce serait une prop booléenne, par exemple, le nom étant au choix du DS. Cas d'usage : un tournoi dont les affiches sont retirées au sort à chaque tour (CCC RG13), où les traits de liaison sont faux. Le slot `connector` permet de vider les tracés, mais pas de supprimer le `<svg>` porteur. À ouvrir seulement si FA-11 donne (b), ou si la mesure de F-03 montre un artefact.
2. **`OrigamTab` en lien de navigation** (facultatif). `ITabProps` n'étend pas `ILinkProps` : un onglet ne peut pas porter `to`. CCC synchronise l'onglet avec `?onglet=` à la main (F-02, F-03), ce qui contourne le manque sans bloquer.
3. Déjà ouvert : **Elyseranet/origam#1212** (slot de police `display`). À sa release, la classe `.font-display` migre vers `fontFamily: 'display'`.

### Ops — T-OPS-01 / T-REL-01 / T-OPS-02 (chef de projet, 2026-10-21)

- [T-OPS-01](T-OPS-01.md) : **Fermé** — mergé dans `develop` @ `a72f3ac` (branche `de8704e`).
- [T-REL-01](T-REL-01.md) : **Fermé** — par T-OPS-01 @ `a72f3ac` (garde par page livrée, OPS-3).
- [T-OPS-02](T-OPS-02.md) : validé en revue par le back-lead (`cc23ed5`), en attente de l'intégration de la vague 3a. La preuve `docker logs` sera rejouée sur l'image intégrée avec PROD-1.
- **Déploiement Coolify** : échec le 2026-10-21. Coolify interroge le dépôt privé `Elyseranet/ccc` en HTTPS sans identifiants (`fatal: could not read Username for 'https://github.com'`). La source doit être configurée en dépôt privé dans Coolify, ce qui est une action de l'utilisateur.

### Architecture (chef de projet, 2026-10-22)
- [T-ARCH-01](T-ARCH-01.md) : **Fermé** — mergé dans `develop` @ `52c54de` (branche `82c51ca`).
- [T-SEC-05](T-SEC-05.md) : **Fermé, sans objet** (ARCH-5, seed SQL).
- [T-LIVE-01](T-LIVE-01.md) : ouvert, partiellement réalisé par T-ARCH-01. Il reste `delivered: true` sur `/admin/plus` et la preuve dans le conteneur.
- **Gel levé.** Les branches en cours doivent être reprises sur la nouvelle arborescence (`src/` à plat, sans fixtures) : vague 3a back (B-09, B-10, B-12, B-16, B-17, T-SEC-04, T-OPS-02), F-04, F-05, F-00h et F-00n.
- [T-ARCH-02](T-ARCH-02.md) : **Fermé** — cause environnementale (`node_modules` en lien symbolique dans un worktree) ; test de non-régression dans `develop`.
- [T-ARCH-03](T-ARCH-03.md) : **Fermé** — mergé dans `develop` @ `5efed01` (branche `a0a8382`) ; schémas dans `src/server/schemas/`, stores en composables.
