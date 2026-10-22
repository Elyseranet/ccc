# Décisions utilisateur — arbitrages UX (2026-10-19)

Source : arbitrages A1–A7 de `audit.md`, tranchés par l'utilisateur via le chef de projet.

| # | Sujet | Décision |
|---|---|---|
| A1 | Admin « Scores » | Fusionné dans « Poules et matchs » (filtres à traiter / saisis / validés), redirection `/admin/scores`. |
| A2 | Variantes | Section de « Règles », redirection `/variants`. |
| A3 | Accès organisateur | Lien discret en pied de page ; « Espace organisateur » en en-tête seulement si connecté. Plus d'avatar factice. |
| A4 | Palmarès | Libellé « Palmarès », route `/palmares`, redirection `/hall-of-fame`. |
| A5 | Nav publique | 4 entrées : Éditions · Joueurs · Palmarès · Règles. Face-à-face = action de Joueurs et des fiches. |
| A6 | Fiche joueur | Oui, route dédiée `/joueurs/<id>`. |
| A7 | Admin mobile | La saisie de score se fait sur téléphone : barre d'onglets en bas (4 entrées). |

## Écarts spec ↔ prototype (2026-10-19, après lecture des specs Obsidian)

| # | Sujet | Décision |
|---|---|---|
| E-a | Validation du score par le second joueur | Retirée — contraire à la spec (« Droits » : saisir et valider un score = administrateur seul). Pas d'arbitrage, correction. |
| E-b | Catégories du palmarès | Spec seule : titres (RG6). Les 5 catégories du prototype (finales, participations, victoires, ratio, plus longue série) sont hors périmètre tant qu'aucune règle n'est écrite. |
| E-c | Classements ACP / All Time / évolution (RG4, RG8) | Onglets du Palmarès. Nav publique reste à 4 entrées. |
| E-d | Connexion participant | Lien « Connexion » unique en pied de page ; une fois connecté, l'en-tête affiche « Mon profil » (participant) ou « Espace organisateur » (administrateur). Complète A3. |
| E-e | Recherche publique de joueurs | `GET /competiteurs?q=` devient **public** (lecture, champs publics uniquement, limite de débit). Spec API amendée. |
| E-f | Édition en cours côté public | Visible au fil de l'eau : les résultats **validés** apparaissent au rechargement ; pas de diffusion live ; jamais de score non validé. Spec API amendée. |
| E-g | Cuillère de bois (RG38) | Non affichée tant que l'utilisateur n'a pas choisi entre option A et option B. |

## Direction visuelle — 2e itération rejetée (2026-10-19)

- Les directions Néon/Comptoir/Tableau puis Nocturne/Affiche/Grille sont **rejetées** : pas assez ambitieuses, mauvais univers, mauvaises références, finition insuffisante.
- **Univers retenu** : festif / culture bière (soirée, bar, capsules, mousse, couleurs vives, fun et décalé).
- **Règle animations assouplie sur le site public** : vidéo de fond, WebGL/3D léger ou librairie d'animation autorisés sur les pages vitrines publiques (accueil, palmarès…). Écrans denses (édition, joueurs, classements) et admin restent CSS uniquement. Tout est coupé sous `prefers-reduced-motion: reduce`. Exception portée par `CLAUDE.md` du projet.

## Direction visuelle retenue (2026-10-20)

- **Piste A — Happy Hour** (moodboard `docs/design/ui/moodboard/index.html`) : nuit violette, néon rose, ambre bière, mousse ; Bagel Fat One (display) + Gabarito (texte courant, remplace DM Sans — validé par l'utilisateur le 2026-10-20 avec le bandeau statique et l'échelle typo 1,25).
- **Police display** : appliquée via une **classe CSS locale** dans CCC, hors props Origam (choix utilisateur ; Origam ne propose que `sans`/`serif`/`mono`). Exception documentée à la règle PROPS-FIRST, limitée à la famille de police des titres display. Évolution demandée sur Origam : Elyseranet/origam#1212 (slot `display`) — à la release, migrer la classe locale vers `fontFamily: 'display'`.

## Arbitrages back (2026-10-20) — cf. `docs/tickets/BOARD.md`

| # | Décision |
|---|---|
| A1 | Le serveur **enregistre le tirage physique** (brouillon à chaque affectation) ; +2 routes Spec API (têtes de série, affectations). |
| A2 | **Session serveur en base + cookie httpOnly**. |
| A3 | **SMTP générique (nodemailer)**, Mailpit en dev ; fournisseur de prod à choisir plus tard. |
| A4 | Participant modifie **avatar, téléphone, mot de passe** ; pseudo réservé à l'admin. |
| A5 | Orphelins : **tableau nom par nom décidé par l'utilisateur** (`legacy-identity-map`, 4 paires ST pré-remplies). |
| A6 | 2012a/2012b : **N = 16** conservé ; « 5 participants non identifiés ». |
| A7 | 2017 : **5,76 conservé** (valeur source), écart signalé dans le rapport de reprise. |
| A8 | ACP = 5 dernières éditions **clôturées**. |
| A9 | Tour avant les huitièmes = **« Barrages »**. |
| A10 | Poule : **victoires → cap's average → confrontation directe** ; entre poules inégales : ratio de victoires puis cap's average par match. |
| A11 | « 1v1v1 en 3 » = **match à 3 côtés, premier à 3 points**. |
| A12 | Cotes : **hors produit** pour l'instant. |
| A13 | Commentaires de match : importés, **visibles admin uniquement**. |
| A14 | Invitation valable **7 jours**, renvoi par l'admin (invalide l'ancien lien). |
| A15 | Correction : **`POST /matchs/{id}/correction`** journalisée, 409 si tour suivant engagé. |
| A16 | Les 685 gabarits vides **ne sont pas importés** : 729 matchs réels, dont 554 avec score. Le chiffre public « 1 414 matchs » est **faux** et doit être remplacé. |

## Arbitrages front (2026-10-20) — cf. `docs/tickets/BOARD.md`

| # | Décision |
|---|---|
| FA-01b | Les 4 écrans sans maquette (face-à-face, règles, admin participants, compte) sont **maquettés en HH avant intégration** (conséquence de la règle iso-visuel). |
| FA-02 | Interfaces/enums du contrat d'API dans **`../../../src/shared/interfaces/api/` et `../../../src/shared/enums/`** (alias `#shared`). Exception documentée dans `CLAUDE.md` du projet. |
| FA-04 | Comparaison visuelle : **mesurer l'écart sur l'en-tête de F-00, puis fixer un seuil** soumis à l'utilisateur avant application. |
| FA-05 | Écran admin « Poules et matchs » : **`/admin/matchs`**. |
| FA-06 | Page profil participant : **`/profil`**. |
| FA-07 | Outillage de test ajouté (Vitest, @nuxt/test-utils, @vue/test-utils, Playwright, axe-core, vue-tsc, @pinia/nuxt), sous réserve `npm ls axios` vide et `npm audit` sans high/critical. |
| FA-08 | Entrée « Plus » de la barre basse admin : **à maquetter** par l'UI. |
| FA-09 | **Tirages admin maquetté et ticketé maintenant** ; Bracket, Compétiteurs, Éditions **masqués** de la nav admin jusqu'à leur ticket. |
| FA-10 | Ordre des onglets d'édition : **celui de la maquette**. |
| FA-11 | Bracket : slot `connector` vide ; ticket Origam seulement si la mesure de F-03 montre un artefact. |
| FA-12 | **Pas de ratio** sur la fiche joueur (spec : joués / V / D). Ratio uniquement dans le face-à-face (RG37). |
| A17 | « Activité récente » admin : **flux dérivé** des validations de match et de tirage, sans table d'audit. |
| A5 | Orphelins : lignes 1–12 **fusionnées** avec leur candidat, ligne 13 « Marion Cobra » **créée** (cf. `docs/tickets/legacy-identity-map.md`). |

## Arbitrages livraison et règles (2026-10-20)

| # | Décision |
|---|---|
| AUDIT-1 | `npm audit` : 12 high + 2 critical, tous dans la chaîne Nuxt 4.6.1 (devtools, simple-git, nitropack/listhen/node-forge, braces/micromatch), préexistants sur `develop` ; `--omit=dev` = 0. **Waiver documenté** dans chaque PR/merge + ticket de remédiation (suivre les correctifs Nuxt, vérifier le bundle `.output`, pas de devtools en prod). Pas de downgrade. |
| A16-label | Tuile accueil : **« 729 matchs joués depuis 2012, dont 554 avec score »**. |
| R-1 | Départage à 4 joueurs ou plus : **un seul match à N côtés, premier à 3 points** (généralise A11). |
| R-2 | Départage à 3 : les deux perdants sont **ex aequo**, non classés entre eux. |
| R-3 | « Tour suivant engagé » (B-12) : poule → qualification arrêtée ; phase finale → tirage (même brouillon) existant pour le tour suivant. Correction refusée (409) dans ces cas. |
| R-4 | Commentaires d'édition (en-têtes du classeur) : **admin uniquement**, comme A13. |
| R-5 | Bilan V/D public : **matchs avec score uniquement** (ex. Deseine 39/13, et non 53/18 du classeur) ; afficher à côté « N matchs au résultat inconnu ». |
| R-6 | RG19 : à 3 joueurs ou plus à égalité, **mini-poule (confrontation directe entre eux) d'abord**, puis match de départage à N côtés si l'égalité persiste. |
| MERGE-1 | Merge dans `develop` **autorisé sous conditions** (utilisateur, 2026-10-20) : chaque lot est mergé par le chef de projet dès que les 3 contrôles sont verts (TU, e2e/API, `/security-review`), avec le waiver AUDIT-1 dans le message de commit ; SHA et sorties réelles rapportés. Un contrôle rouge = pas de merge, retour à l'utilisateur. |
| R-7 | Départage devant pourvoir plusieurs places : le gagnant prend la place, **les perdants rejouent** (N−1 côtés, ou 1v1 à deux) jusqu'à ce que toutes les places soient pourvues. |
| FA-04-seuil | Comparaison visuelle : **1 % de pixels différents par zone** (pixelmatch, seuil couleur 0,1, reduced-motion, polices chargées) **+ relecture humaine de l'image d'écart** par le lead avant merge. |
| R-8 | Courbe d'évolution ACP / All Time : **commence à la première participation chiffrée** du joueur (pas de points à 0 avant ses débuts, contrairement aux onglets `évo` du classeur dont les zéros sont un effet de formule cumulative). |
| R-9 | Le **code d'une édition est figé après création** (ex. `2012a`, `2026`) : il sert d'adresse publique `/editions/<code>`. |
| R-10 | Carte « Matchs » de la synthèse d'édition : libellé explicite — en cours « N programmés, dont M validés » ; archive « N matchs, dont M au résultat inconnu ». |
| SEC-A1 | Session : **expiration après 2 h d'inactivité, durée maximale 12 h** (couvre une soirée de tournoi ; OWASP Session Management : « 15-30 minutes for low risk applications », absolu « between 4 and 8 hours » en exemple — vérifié le 2026-10-20). |
| SEC-A2 | Échecs de connexion : **ralentissement progressif par compte** (délai exponentiel plafonné après 5 échecs) + limite par IP + commande CLI de déblocage ; **pas de blocage dur**. Mise en œuvre : compteur persisté en base (migration M3, seule option compatible avec le déblocage CLI), délai 2^(échecs−5) s plafonné à **300 s** (« quelques minutes ») (OWASP Authentication : éviter « locking out other users' accounts »). |
| AV-1 | Avatar : **envoi de photo stockée en base** (route d'upload, ≤ 2 Mo, type vérifié par signature JPEG/PNG/WebP, **suppression des métadonnées EXIF**, servie par l'API avec `nosniff`). Respecte la spec P1 et les maquettes. Nouveau ticket back. |
| SEC-A3 | Énumération de comptes via le 429 du ralentissement (compte existant seulement) : **risque accepté et documenté** (pas d'inscription publique, limite par IP 20/15 min). README + B-08. |
| AV-2 | Bibliothèque image pour B-16 : **sharp** (Apache-2.0, embarque libvips LGPL-3.0-or-later utilisée sans modification) validée par l'utilisateur. |
| SEC-A4 | Anti-blocage de connexion : **cookie d'appareil de confiance** (OWASP « Slow Down Online Guessing Attacks with Device Cookies », https://community.owasp.org/Slow_Down_Online_Guessing_Attacks_with_Device_Cookies, vérifié le 2026-10-20) : un navigateur déjà authentifié reçoit un cookie signé et n'est pas soumis au délai par compte causé par les autres ; les clients non reconnus restent ralentis. Remplace la simple décroissance (insuffisante face à un attaquant patient). |
| OPS-1 | Livraison : **build par Coolify depuis le dépôt** (Dockerfile), comme les autres projets. Nécessite un dépôt distant accessible par Coolify. |
| OPS-2 | Base de production : **ressource PostgreSQL Coolify séparée** (sauvegardes gérées par Coolify) ; l'app s'y connecte par `NUXT_DATABASE_*`. Le compose app+db reste pour le local. |
| OPS-3 | Garde de release : **par endpoint utilisé** — le build échoue seulement si une page accessible en production consomme un endpoint en fixture ; les pages non livrées sont masquées. Déploiement au fil de l'eau sans jamais servir de données fictives. |
| OPS-4 | Nom de domaine : **à fournir plus tard** par l'utilisateur. |

## QA-1 — T-QA-01 : garde-fou mergé, enquête en pause (décision utilisateur 2026-10-21)
- Le garde-fou `scripts/test-run.mjs` (`feature/T-QA-01` @ `95263a4`) est mergé dans `develop` juste après T-OPS-01, sur lequel il est basé. Il passe par la même pre-delivery : tests unitaires, e2e et sécurité.
- L'enquête sur la cause racine est en pause. T-QA-01 reste **ouvert**. La piste mémoire (swap) sera réévaluée pendant la vague F-01..F-12.

## CE-1 — Code d'une édition créée dans l'application (décision utilisateur 2026-10-21)
- La première édition d'une année prend le code `AAAA`, par exemple `2027`. Les suivantes de la même année prennent `AAAAb`, `AAAAc`, et ainsi de suite.
- Le code est généré par le serveur (`buildEditionCode`, B-10). L'organisateur ne le saisit pas, et il reste immuable (R-9).
- Les codes de l'archive restent inchangés (`2012a`, `2012b`, puis `2013` à `2026`). L'asymétrie avec 2012 est acceptée.

## N1 — Cookie d'appareil volé : risque accepté et documenté (décision utilisateur 2026-10-21)
- Aucun plafond global par compte n'est ajouté. Pour exploiter ce cookie, il faut avoir volé un cookie httpOnly, donc compromis l'appareil. Le flux d'essais reste ralenti (SEC-A2 : 5 essais libres, puis un délai jusqu'à 300 s) et borné par la limite par IP. Un changement de mot de passe révoque tous les appareils (N2).
- T-SEC-04 se ferme sur L2, L3 et N3. N1 y est documenté comme risque accepté, au même titre que SEC-A3.

## Q1 — Retrait d'un inscrit pendant le tirage des poules (décision utilisateur 2026-10-21)
- Le retrait reste autorisé tant que le tirage des poules est en **brouillon**. Il supprime aussi l'affectation du joueur dans ce brouillon, et l'organisateur ressaisit.
- Une fois le tirage **validé**, le retrait est refusé : 409 `REGISTRATION_CLOSED`. Le changement porte sur B-10 et B-11 (coordination et test).

## Q2 — Ajout d'un inscrit pendant le tirage des poules (décision utilisateur 2026-10-21)
- L'ajout reste autorisé jusqu'à la **validation** du tirage, conformément à la Spec API. Le nouvel inscrit n'est pas encore affecté dans le brouillon. La validation du tirage (B-11) est refusée tant qu'un inscrit reste sans affectation.

## F-13 — Écrans admin d'édition et d'identité de compétiteur (décision utilisateur 2026-10-21)
- Un ticket front est ouvert dès maintenant pour la création et la modification d'une édition, ainsi que pour la correction de l'identité d'un compétiteur, sur les routes de B-10. Sans ces écrans, l'organisateur ne peut pas créer une édition depuis l'application.

## OPS-5 — Accès de Coolify au dépôt privé (décision utilisateur 2026-10-21)
- Coolify accède au dépôt par une **GitHub App** installée sur l'organisation Elyseranet et limitée au dépôt `ccc`. La ressource est de type « Private Repository (with GitHub App) », sur la branche `develop`, avec le build pack Dockerfile. Chaque push déclenche un déploiement automatique.
- Cause de l'échec du 2026-10-21 : la ressource lisait `https://github.com/Elyseranet/ccc` sans identifiants.

## F-09-H — Homonymes à l'ajout d'un joueur (décision utilisateur 2026-10-21)
- Pas d'avertissement d'homonyme en v1. La recherche avec autocomplétion montre déjà les profils proches avant toute création.

## RG26-A — Bandeau des règles sur l'accueil (décision utilisateur 2026-10-21)
- Le bandeau de l'accueil garde l'abréviation de la maquette validée (« La partie débute par un shifumi »). `/regles` affiche le texte complet de la Spec fonctionnelle.

## F-13-M — Maquette admin Éditions et Compétiteurs validée (décision utilisateur 2026-10-21)
- `docs/design/ui/happy-hour/admin-editions.html` et `admin-editions.css`, plus les lignes F-13 de `mapping.md`, sont validés et deviennent la référence pixel perfect de F-13.
- Les champs de date utilisent le sélecteur Origam ; le champ natif visible sur les captures n'est pas la référence. Les bornes de l'année suivent le schéma serveur de B-10 (2000 à 2100), pas la valeur provisoire de la maquette (2012 à 2099).

## PAR-1 — Parallélisme limité à environ 8 agents (décision utilisateur 2026-10-21)
- Le 2026-10-21, la limite d'usage claude.ai a coupé deux fois toute l'équipe, alors que 21 agents tournaient en même temps.
- À partir de maintenant, environ 8 agents tournent en parallèle : 2 leads, 3 devs back et 3 devs front. Les autres tickets ne reprennent qu'au fur et à mesure que des devs livrent.

## DT-1 — Contournement du typage de `origam-data-table` (Origam #1246) (décision utilisateur 2026-10-21)
- Un seul composant partagé, `AppDataTable.vue`, affiche `origam-data-table`. Il porte l'unique contournement de type, accompagné de la référence #1246. Les pages l'utilisent et restent typées normalement.
- Ce composant est livré en prérequis commun F-00j. Il sera retiré à la sortie d'une version d'Origam qui corrige #1246.

## PROD-1 — Garde-fou de configuration en production (B-09), déploiement retenu (décision utilisateur 2026-10-21)
- Le garde-fou `NUXT_STRICT_RUNTIME_CONFIG` entre avec la vague 3a. Il est activé dans l'image Docker de production et refuse le démarrage dans quatre cas :
  - `siteUrl` n'est pas en https, ou pointe vers localhost ;
  - le transport mail n'est pas `smtp` ;
  - `mail.host` vaut localhost ;
  - `mail.from` est vide.
- Le premier déploiement Coolify réussi attend que l'utilisateur fournisse le domaine (OPS-4) et un compte SMTP, renseignés dans les variables Coolify. Le garde-fou n'a pas de mode « recette » qui le désactiverait.

## ARCH-1 à ARCH-5 — Remise en ordre de l'arborescence (décisions utilisateur 2026-10-22)
- **ARCH-0** : l'utilisateur a constaté des violations des règles de rangement. Le chef de projet et les leads les avaient laissé passer en revue. Le déplacement vers `src/` que l'utilisateur avait commencé est conservé tel quel sur `feature/T-ARCH-01` (`0394424`), et T-ARCH-01 le poursuit. **Aucun merge** n'a lieu dans `develop` avant la fin de T-ARCH-01.
- **ARCH-1** : **tous les utils** (front et serveur) vont dans `src/utils/`, **à plat**, sans aucun sous-dossier. Les « scripts » serveur (`create-admin`, `unlock-user`…) sont des utils. Un garde-fou empêche le code serveur (TypeORM, scrypt, Node) de finir dans le bundle navigateur.
- **ARCH-2** : **tous les services** vont dans `src/services/`, à plat. Quand un service existe à la fois côté navigateur et côté serveur, les deux fichiers **fusionnent**. Deux fonctions qui font la même chose sont **unifiées** en une seule. Deux fonctions de même nom et de code différent sont **renommées**.
- **ARCH-3** : les **migrations et les seeds** sont des assets et vont dans `src/assets/`. Aucun d'eux ne doit être importé côté client ni publié.
- **ARCH-4** : les **interfaces, consts, enums et types** vont uniquement dans `src/interfaces/`, `src/consts/`, `src/enums/` et `src/types/`, à plat. L'exception `shared/` (FA-02) est abandonnée.
- **ARCH-5** : le **seed des archives** devient un **fichier SQL figé**, généré une fois depuis la base importée et vérifiée, versionné et appliqué par une commande. Le convertisseur Python, le JSON de 2 478 lignes, les scripts TypeScript de seed et d'import et leurs tests sont **supprimés**. T-SEC-05 devient sans objet. Un test garde les contrôles sur les vraies données (Deseine 39/13, 729 matchs) après l'import du SQL.

## ARCH-6 à ARCH-12 — Suite de la remise en ordre (décisions utilisateur 2026-10-22, T-ARCH-01)
- **ARCH-6, base de données** : on reprend l'architecture DB du projet i18n-dashboard, **et seulement la DB**. Les entités TypeORM vont dans `src/server/db/typeorm/entities/`, la DataSource dans `src/server/db/typeorm/`, et les migrations dans `src/server/db/migrations/`. ARCH-3 est remplacé pour les migrations ; le seed SQL reste dans `src/assets/seeds/`. *Interprétation du chef de projet, à confirmer* : i18n-dashboard n'a ni stratégie de nommage ni transformer, ils sont donc rangés avec la config TypeORM (`src/server/db/typeorm/`). ARCH-1 et ARCH-2 restent valables pour tout le reste.
- **ARCH-7, schémas et thème** : on garde les dossiers dédiés `src/schemas/` (zod) et `src/themes/` (Origam), à plat.
- **ARCH-8, fixtures** : elles sont supprimées. Plus aucune donnée fictive dans l'application : le mécanisme `API_SOURCE`, `?fixture=`, les fixtures et la variante de session de fixture disparaissent. PAGE_DELIVERY et la garde OPS-3 sont revus en conséquence.
- **ARCH-9, contrôle visuel** : les e2e tournent sur les vraies données (base de test chargée par le seed SQL). Le pixel perfect porte sur les zones fixes (structure, gabarits, en-tête, pied, typographie) ; les zones de données sont masquées dans la comparaison. Le seuil reste à 1 % par zone, avec relecture humaine des images d'écart.
- **ARCH-10, dump des archives (Q6, option A)** : le dump SQL inclut aussi `legacy_workbook_imports` et `legacy_workbook_rows`, la source brute du classeur. Les cas de test sur données réelles deviennent des tests `test:db` qui lisent la base après application du SQL. `legacy-verification.util` et `legacy-workbook-parser.util` restent dans `src/utils/` : la preuve « 0 écart avec le classeur » est conservée. Sont supprimés : le convertisseur Python, le JSON, `seed-legacy-workbook`, `import-legacy-domain`, `legacy-domain-importer`, `legacy-identity-map` (.json et .util), `legacy-snapshot-guard` et leurs tests.
- **ARCH-11, périmètre (Q7, option B)** : ARCH-8 et ARCH-9 sont faits dans T-ARCH-01. Les écrans dont la route serveur n'existe pas encore (les 15 endpoints attendus avec la vague 3a) répondent en erreur jusqu'au merge de la vague 3a. Il n'y a ni route provisoire ni fausse donnée : ces écrans affichent un état d'erreur propre (AsyncState), et leurs e2e sont marqués comme attendant leur route, avec le nom du ticket back.
- **ARCH-12, bundle en développement** : en `nuxt dev`, Vite ne fait pas de tree-shaking, et un service fusionné (ARCH-2) charge TypeORM et les entités dans le navigateur (environ 5,5 Mo mesurés, sans erreur). C'est **accepté**, car cela ne concerne que le développement : en production, la garde de build (`clientBundleGuard` et `npm run test:bundle`) interdit tout code serveur dans les chunks client. Ce point est documenté dans le README.

## ARCH-13 — Schémas zod côté serveur (décision utilisateur 2026-10-22)
- Les schémas zod font partie du serveur : ils vont dans `src/server/schemas/`, à plat. ARCH-7 est corrigé sur ce point : il n'y a pas de dossier `src/schemas/`.

## ARCH-14 — Les stores sont des composables (décision utilisateur 2026-10-22)
- Il n'y a pas de dossier `stores/`. Les stores Pinia sont des composables : ils vont dans `src/composables/`, selon le nommage des composables (`useCamelCase.ts`).

## F-04-ADV — Adversaires sur la fiche joueur (décision utilisateur 2026-10-22)
- La fiche joueur affiche les **4 adversaires les plus affrontés**, comme la maquette, suivis d'un lien « voir tous » vers le face-à-face (F-05), où l'on peut choisir n'importe quel adversaire. L'ordre est celui que renvoie le serveur (G11).

- **Précision (décision utilisateur 2026-10-22)** : le lien « voir tous » ne s'affiche que si le joueur a **plus de 4 adversaires**.
- **Rendu du lien (validé par l'utilisateur le 2026-10-22)** : libellé « Voir les N adversaires → » sous les 4 adversaires, selon la maquette UI `joueur.html` (commit `2851ce1`).

## SEED-1 — Dump d'archives et changement de schéma (décision utilisateur 2026-10-22)
- Le dump `src/assets/seeds/archives.sql` **n'est jamais édité à la main**. Si le schéma change (ex. B-16 retire `avatar_url`), il est **régénéré** par l'export à partir du classeur brut. ARCH-5 reste en vigueur.
- L'édition manuelle de dev-b16 (146 INSERT) est écartée au profit de la régénération, qui se fait avant le merge de la vague 3a.

## F-04-PAG — Pagination de la liste des joueurs (décision utilisateur 2026-10-22)
- La pagination utilise **`origam-pagination`**, pas le pager maison.
- L'écart visuel avec la maquette (7,36 % et 66,8 % sur les deux zones de la pagination) fait l'objet d'une **dérogation documentée** au contrôle visuel. Cette dérogation est suivie par le ticket `docs/tickets/F-04-PAG.md`, avec une fiche Origam à déposer.
