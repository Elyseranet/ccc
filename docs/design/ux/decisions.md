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
- **Précision SEED-1 (décision utilisateur 2026-10-22)** : la régénération se fait par **export outillé du dump actuel**. On charge `archives.sql` sur une base au schéma d'avant la migration, on applique les migrations, puis `pg_dump --data-only --column-inserts` produit le fichier, dans le même ordre de tables. Les UUID et les dates sont conservés. Aucune édition manuelle. Raison : l'outil d'import du classeur brut n'existe plus dans le dépôt (ARCH-5, ARCH-10), et un réimport changerait les 3 097 UUID, dont certains sont figés dans les e2e.

## QA-2 — Édition en cours dans la base de test (décision utilisateur 2026-10-28, F-01)
- Complète ARCH-9. Les 16 éditions du dump d'archives sont clôturées. Après le seed, la préparation de la base de test (`global-setup`, `prepare-database`) remet donc **l'édition 2026 en phase de poules** : une part **fixe et documentée** de ses matchs de poule repasse à « programmé ». La règle est écrite une seule fois et elle est reproductible.
- Ce ne sont pas des données fictives (ARCH-8) : c'est la vraie édition 2026, rembobinée à un moment de sa saison, comme `global-setup` crée déjà les comptes de test.
- Un seul état, partagé par tous les tests (pas de mutation propre à un test). Il sert F-01, F-07, F-08 et F-11.
- Conséquence : les zones qui lisent 2026 (F-03 page édition, parcours joueurs de F-04) se remesurent sur cet état.
- **Précision QA-2 (décision utilisateur 2026-10-28)** : **aucune suppression**. On ne supprime aucune ligne du dump d'archives, même dans la base de test. La mise en place de l'édition en cours ne fait que des mises à jour. Les options qui supprimaient des matchs, des côtés ou des tours (proposées par le chef de projet) sont refusées.
- **Mise en œuvre de QA-2 (décision utilisateur 2026-10-28)** :
  - le serveur **ne publie plus les tours encore « en attente »** (`ROUND_STATUS.PENDING`) : ni dans le tableau de `GET /editions/{id}`, ni dans la liste des matchs. Ticket back **B-18** ;
  - ensuite, T-QA-03 remet 2026 en phase de poules par **mises à jour seules**, sans aucune suppression.
  - Faits établis à la lecture du code par dev-f05 et le chef de projet :
    - `buildBracket` (`edition-assemble.util.ts:86-90`) ne filtre pas sur `round.status`, et `ROUND_STATUS` n'est lu par aucun service ;
    - aucun statut existant ne masque les phases finales ;
    - aucun code ne crée de tour hors du dump. Le moment de création des tours en fonctionnement réel n'est donc pas encore défini.
- **Tours non tirés (décision utilisateur 2026-10-28, B-18)** : en fonctionnement réel, **un tour de phase finale n'existe jamais avant son tirage**. Le tirage d'un tour (B-13) le crée au moment du tirage. Un tour `PENDING` portant des matchs ne vient donc que des données reprises (dump) ou de l'état de test de T-QA-03. B-18 filtre ces tours sans changer le contrat de l'API. Aucun squelette « à tirer » côté front.

## AUDIT-1 — remesure (chef de projet, 2026-10-28)
- `npm audit` complet : **12 vulnérabilités** (4 low, 3 moderate, **3 high, 2 critical**), contre « 12 high + 2 critical » à l'ouverture du waiver. `package-lock.json` n'a pas changé depuis a90f586 : c'est la base d'avis qui a évolué.
- **High et critical**, tous dans la chaîne de développement :
  - `@nuxt/devtools` (high) ;
  - `simple-git` et `@simple-git/argv-parser` (critical) ;
  - `node-forge` (high) ;
  - `undici` (high, nouveau dans la liste).
- `npm audit --omit=dev` : **0**. Le waiver couvre toujours la situation : moins de high, même nombre de critical, aucune vulnérabilité en production. Mesure : frontend-lead (F-03a) et backend-lead (vague 3a, liste identique à develop).

## F-03-BRK — Tableau des phases finales (décision utilisateur 2026-10-28, F-03b)
- Le tableau des phases finales reste **écrit à la main** : 0,019 / 0,000 % d'écart avec la maquette. `origam-bracket` donne 23,2 / 41,0 % (mesure de dev-f06, branche de mesure `wip/F-03b-origam-bracket` adf07fa).
- Causes de l'écart côté Origam, sans variable :
  - largeur de tour fixée à 240 px en style en ligne (`OrigamBracket.vue:611-621`, constante l. 435) ;
  - hauteur minimale calculée en dur (`:452`, `:612`) ;
  - titre de tour centré en dur (`OrigamBracketRound.vue:137`).
- Une fiche Origam demande ces trois réglages en variables. Le ticket CCC **F-03-BRK** suit la migration vers `origam-bracket` quand Origam les livre.
- Précision sur FA-11 : un slot `connector` **vide** ne supprime pas les traits, car Vue rend le contenu de repli. Il faut un nœud (`<template #connector><g /></template>`).

## F-03-BRK bis — Migration immédiate vers origam-bracket (décision utilisateur 2026-11-12)
- Remplace F-03-BRK : le tableau des phases finales passe **maintenant** à `origam-bracket`, sans attendre Elyseranet/origam#1282 (toujours ouverte le 2026-11-12 ; les fichiers `Bracket/` d'origam 2.37.42 sont identiques à ceux de la 2.37.4 installée).
- L'écart à la maquette `edition.html` est **accepté** pour le tableau (mesure de référence 23,2 % à 1440, 41,0 % à 390). Le thème le réduit autant que possible (props d'abord), sans contourner Origam par du CSS qui force ses styles en ligne.
- Restent exigés : aucun trait de liaison (RG13, slot `connector` avec `<g />`, FA-11), lien vers la fiche joueur et score dans le slot `competitor`, vainqueur non porté par la couleur seule, alternative en liste, région de défilement focalisable et nommée.
- e2e visuel : la zone du tableau ne se compare plus à la maquette. Sa référence devient le rendu `origam-bracket` validé, documenté dans le commit (exception approuvée par l'utilisateur). Quand #1282 sera livrée, F-03-BRK rapprochera le rendu de la maquette.
- Référence visuelle du tableau (décision utilisateur 2026-11-12) : **capture de référence Playwright** (`toHaveScreenshot`), prise une fois sur le rendu `origam-bracket` validé, relue par un humain, versionnée dans `tests/e2e`. Elle n'est régénérée que pour un changement voulu du tableau ou du thème, et le commit le dit.
- Consigne générale rappelée par l'utilisateur : utiliser au maximum les composants Origam (audit : F-28).

## GATE-DEV — Contrôles par branche (décision utilisateur 2026-11-12)
- **Merge sur `develop`** : le chef de projet merge lui-même, sans attendre la file Playwright. Contrôle minimal sur le résultat du merge : **typecheck + `test:run`**. Remplace, pour develop seulement, les gates complètes de la politique de livraison.
- **PR `develop` → `main`** : gates complètes obligatoires (Playwright complet à 0 échec, `test:db`, `test:api`, `npm audit` 0 high/critical, gitleaks, revue de sécurité).

## QA-2 bis — État nominal de l'édition 2026 en base e2e (décision utilisateur 2026-11-12, F-07)
- QA-2 est étendue : après la remise de 2026 en phase de poules, la préparation de la base e2e (`tests/e2e/helpers/in-progress-edition.ts`) laisse, **par mises à jour seules, sans aucune insertion ni suppression**, une part fixe et documentée de matchs à l'état saisi (`recorded_at` posé) et pose `validated_at` sur les matchs validés, pour que le tableau de bord admin montre son état nominal (scores à valider, fil d'activité rempli). Un brouillon de tirage n'est ajouté que s'il est possible sans insertion.
- Les compteurs d'autres écrans (accueil, matchs) peuvent changer : vérification au Playwright complet de la PR vers main (T-REL-04).
- Maquette `admin.html` : la classe `todo` (réservée aux marqueurs « [À FOURNIR] » par `hh.css`) est renommée dans `admin.html` et `admin.css`.

## ARCH-15 — `src/server/routes/` autorisé (décision utilisateur 2026-11-12, T-SEO-01)
- `src/server/routes/` rejoint `api/`, `middleware/` et `plugins/` comme dossier imposé par Nitro (routes hors `/api`, ex. `/robots.txt`, `/sitemap.xml`). À plat, comme les autres. Mis à jour dans `CLAUDE.md` du projet et `tests/unit/architecture.test.ts` par la branche T-SEO-01 back.

## LEGAL-1 — Contenu des pages légales (décisions utilisateur 2026-11-12, F-19)
- **Éditeur** : l'utilisateur, **particulier non professionnel, anonyme** dans les mentions légales (seuls l'hébergeur et un email de contact sont publiés ; régime LCEN art. 6 cité par l'audit, texte non vérifié sur Légifrance : à confirmer par la relecture juridique).
- **Hébergeur** (dev et production) : **Hetzner Online GmbH**, Industriestr. 25, 91710 Gunzenhausen, Allemagne, tél. +49 9831 505-0 (mentions légales Hetzner). Données dans l'UE. Tranche aussi T-SEC-02 pour le choix de l'hébergeur.
- **Contact unique** : `contact@elysera.net` (mentions, RGPD, accessibilité).
- **Comptes inactifs** : conservés tant que le compte existe, suppression sur demande ; pas de purge automatique.
- **Journaux serveur** : 6 mois, avec rotation configurée (ticket ops) ; la page n'annonce 6 mois qu'une fois la rotation en place.
- **Origam** : lien du pied de page vers https://github.com/Elyseranet/origam.
- **Public** : adultes seulement.
- **Polices** : T-SEC-16 (polices hébergées sur le site) est fait **avant** la publication des pages légales ; aucun appel à Google à déclarer.
- Les textes rédigés par ba-legal restent des propositions à faire relire par un juriste avant publication.

## ARCH-11 bis — Endpoints sans page (décision utilisateur 2026-10-28, F-03b)
- ARCH-11 est complétée : un endpoint peut n'être rattaché à **aucune page** s'il figure dans une **liste explicite**, avec sa raison. Le test reste strict pour tout le reste.
- Premières entrées : `EDITION_POOLS` et `EDITION_DRAWS`. Leurs données sont redondantes avec `GET /editions/{code}`, qui sert la page édition, et ce sont des routes de l'API publique prévues par la Spec API. Aucune route n'est supprimée.
- Il est interdit de déclarer un endpoint sur une page qui ne l'appelle pas.

## SEC-Q — Questions ouvertes des tickets de sécurité (décisions utilisateur 2026-10-28)
- **T-SEC-06 Q1** : l'image de production **refuse de démarrer** si `NUXT_STRICT_RUNTIME_CONFIG` est désactivé. La garde PROD-1 n'est pas contournable par variable d'environnement. Une recette sur cette image demande une vraie configuration.
- **T-SEC-07 Q1** : avatars servis avec un **cache court et revalidation** (ETag, 304), sans `immutable`. Une photo supprimée disparaît vite des caches.
- **T-SEC-08 Q1** : **contrôle de version obligatoire** (`If-Match`) sur la saisie et la validation des scores. 428 sans en-tête, 412 si la version a changé. Le front envoie la version lue (F-08).
- **T-SEC-10 Q1** : la correction d'identité d'un compétiteur suit **la même règle que les scores**, donc contrôle de version obligatoire.
- **T-SEC-12 Q1** : les écritures sans `Origin` ni `Sec-Fetch-Site` restent **acceptées**. Ce comportement est documenté : aucun scénario navigateur identifié, et SameSite=Lax couvre les sites tiers.
- **Codes HTTP du contrôle de version (décision utilisateur 2026-11-01)** : **428** si `If-Match` manque, **412** si la version est périmée, sur **toutes** les écritures versionnées. Cela couvre la saisie et la validation des scores, la **correction de score** (B-12, alignée : elle répondait 400 et 409 `MATCH_VERSION_CONFLICT`) et la correction d'identité. À amender : `docs/api/matchs.md` et la Spec API, au merge de T-SEC-08/10.
- **B-11, retrait d'une tête de série pendant le brouillon (décision utilisateur 2026-11-01)** : le brouillon est **recommencé**. Le comportement actuel est conservé et documenté : un message clair à l'admin (« une tête de série s'est retirée, recommencez le tirage »), au lieu de « tirage incohérent ». Le tirage physique est de toute façon à refaire en salle.
- **Usage local de l'image (décision utilisateur 2026-11-01, T-SEC-06)** : en local, on développe avec **`npm run dev` seulement**. Le démarrage `docker compose … docker-compose.local.yml` est retiré du README, et le compose n'est documenté que pour Coolify. Les preuves Docker continuent avec une configuration stricte valide (valeurs `example.org` ou `.invalid`).
- **F-10, « profil incomplet » (décision utilisateur 2026-11-01)** : un profil est **incomplet** si au moins un champ facultatif modifiable est vide (**surnom, téléphone ou photo**). La page `/profil` affiche alors un **bandeau non bloquant** qui invite le participant à le compléter. Rien n'est obligatoire et rien n'est bloqué. La Spec fonctionnelle (l. 105-106) ne définissait pas ce cas.
- **F-10, maquette `compte.html` (décision utilisateur 2026-11-02)** : la maquette est **corrigée** sur deux zones pour montrer le rendu Origam : le champ photo en `origam-file-field` (48 px) et l'erreur de connexion en `origam-alert`. Le mapping est déjà aligné (c67b7f1). Aucune dérogation au contrôle au pixel.
- **`docker-compose.local.yml` (décision utilisateur 2026-11-02)** : supprimé, ainsi que le commentaire qui y renvoyait dans `docker-compose.yml`. Il reste récupérable dans l'historique git. Conséquence de la décision « en local, `npm run dev` seulement ». Commit f2bbb02 sur `feature/T-SEC-06-12`.
- **QA-3, écritures admin en e2e (décision utilisateur 2026-11-02, F-09)** : un test e2e qui doit écrire **crée sa propre édition** par la vraie API admin (`POST /editions`, puis les transitions nécessaires), avec un code unique par test. Il y ajoute et retire des participants, sans jamais toucher aux archives ni à l'état partagé 2026 (QA-2). La base de test est reconstruite à chaque lancement. Cela vaut aussi pour les tickets admin suivants (F-11 tirages, F-08 scores) quand un état dédié est nécessaire.
- **F-10, exigences du mot de passe dans `compte.html` (décision utilisateur 2026-11-02)** : sous les champs « nouveau mot de passe » (invitation et profil), la maquette **montre** la liste d'exigences (« 15 caractères minimum » avec ✗/✓, toujours visible) et la barre de force, au rendu réel d'Origam. Le mapping les prévoyait déjà. Ces zones entrent dans le contrôle au pixel, sans dérogation.

## F-02 Palmarès — arbitrages (décisions utilisateur 2026-11-02)
- **F-02-CHART, graphique d'évolution** : `origam-chart` dessine sur une surface fixe de 600×360 (`OrigamChartCartesian.vue:683-684`, `:789-790`), la maquette en 820×320 mis à l'échelle de la largeur. Écart mesuré : 23,2 % à 1440 px, 38,9 % à 390 px. **Évolution Origam** demandée (surface de dessin qui suit la largeur). F-02 est mergé avec le corps du graphique exclu de la mesure (en-tête de carte et bouton « Voir en tableau » mesurés), sans contournement local. Ticket de remédiation **F-02-CHART** : remettre le graphique dans la mesure quand Origam livre.
- **F-02-AXE, règle axe `nested-interactive`** : les points du graphique sont des `role="button" tabindex="0"` dans un `<svg role="img">` (code Origam, `OrigamChartCartesian.vue:87, 205-208`). **Dérogation approuvée**, limitée à l'onglet Évolution ; le tableau « Voir en tableau » porte toutes les valeurs. Issue Origam (fiche `chart-points-focusables-dans-svg-img.md`) et ticket de remédiation **F-02-AXE** pour réactiver la règle.
- **F-02-TIE, « le plus titré » à égalité** : la Spec ne tranchait pas. On **affiche tous les ex aequo** au plus grand nombre de titres, sans départage inventé ; personne si aucun titre.
- **F-02-PAG, tableau ACP** : **paginé comme la liste des joueurs**, en réutilisant `AppPagination` (extrait par F-09) avec les règles F-04-PAG. Pas de second composant de pagination.

## T-SEC-06 — Plages privées dans la garde de production (décision utilisateur 2026-11-02)
- `NUXT_PUBLIC_SITE_URL` **refuse** aussi les adresses privées (10/8, 172.16/12, 192.168/16, fc00::/7) et link-local (169.254/16, fe80::/10) : un lien d'invitation vers une IP privée est toujours cassé pour les joueurs.
- `NUXT_MAIL_HOST` **les accepte** : un relais SMTP interne à l'hébergement (Coolify) peut être légitime. Seules les adresses de boucle locale et les noms sans point y sont refusés.

## Volumes Docker de test (décision utilisateur 2026-11-02)
- **Purge unique** des volumes anonymes non attachés (`docker volume prune`, Docker 29 : volumes anonymes seulement) : 762 → 25 volumes, 98,54 GB libérés. Les conteneurs actifs et les volumes nommés ont été conservés.
- Pour la suite, les conteneurs de test se lancent avec `docker run --rm` et se suppriment avec `docker rm -fv`, ce qui supprime aussi leurs volumes. Règle consignée dans le README par T-SEC-06/12.

## F-09 — Homonymes à la création d'un participant (décision utilisateur 2026-11-03)
- **Pas d'avertissement.** La liste de suggestions, insensible aux accents, montre les profils proches avec la pastille « Profil existant » et leur nombre d'éditions. L'entrée « Créer » reste toujours proposée, parce que deux vraies personnes peuvent porter le même nom. Cela confirme `parcours.md` 4b.4 (ux, 31cc6e3).

## F-09 — Maquette des participants (décisions utilisateur 2026-11-03)
- **Messages : la maquette s'aligne sur Origam**, comme `compte.html` (F-10). L'invitation est une `origam-alert` info, le refus de l'email s'affiche sous le champ (`errorMessages`), et la photo est un `origam-file-field`. F-09 remplace ses deux pastilles. On garde un seul style de message dans le produit.
- **Menu des suggestions de recherche** : la maquette le dessine **superposé** sous le champ, comme Origam. La page menu fermé est mesurée au pixel ; le menu ouvert (options, entrée « Créer », accessibilité) est vérifié en e2e, hors de la mesure au pixel.
- **Snackbar de confirmation** : **hors mesure au pixel** (masquée), vérifiée en e2e (texte, `role="status"`, disparition).

## F-02 — États ex aequo et « aucun titre » du bloc « Le plus titré » (décision utilisateur 2026-11-03)
- Les archives réelles n'ont qu'un seul détenteur. Les états **ex aequo** et **aucun titre** sont couverts par des **tests de composant** (rendu, libellé au singulier ou au pluriel, bloc absent), comme les états de F-01. Seul l'état réel à un détenteur est mesuré au pixel. Aucune réponse d'API réécrite, aucune variante de seed (ARCH-8 respectée).

## Titre des alertes Origam (décision utilisateur 2026-11-04, F-09)
- Sans réglage, Origam affiche le titre d'une `origam-alert` en 31 px avec un grand espacement des lettres. Pour F-09, le titre est ramené à la taille du texte courant **par les props de l'alerte seule** (quatre props de titre, comme le prévoit `mapping.md`). Aucun défaut de thème pour l'instant : un défaut dans `components['origam-alert']` déplacerait l'état d'erreur `AsyncState` des pages déjà livrées (F-01, F-03, F-04, F-05) sans mesure.
- Un **ticket d'harmonisation** à part mesure les états d'erreur, puis décide d'un réglage commun dans le thème (règle PROPS-FIRST).

## F-17 — Titre des alertes dans le thème (décision utilisateur 2026-11-04)
- Fait nouveau (ui) : aucune maquette ne dessine l'état d'erreur `AsyncState`, et partout où une maquette dessine un titre d'alerte, il est à la taille du texte et en gras. Les 31 px actuels des pages livrées sont un rendu non voulu.
- **Décision : réglage commun dans le thème** (PROPS-FIRST), `components['origam-alert']` titre à `md`, gras, interlettrage et interligne normaux. Les props d'instance de F-09 seront retirées par F-17. Le titre du message d'erreur des pages livrées (F-01, F-03, F-04, F-05) passe de 31 à 16 px, avec captures avant et après relues. F-17 passe après le merge de F-09.
- Cette décision complète celle du même jour (« Titre des alertes Origam ») : F-09 garde ses props d'instance jusqu'à F-17.

## F-13 — Maquette `admin-editions.html` alignée sur Origam (décision utilisateur 2026-11-04)
- Les messages d'erreur (400/409), aujourd'hui dessinés en pastille, titre en gras et paragraphe, passent au **rendu `origam-alert`**, comme `compte.html` et `admin-participants.html`. L'ui corrige la maquette, et F-13 suit quand il est développé. On garde un seul style de message dans l'admin.

## F-13 — Bandeau « Édition clôturée » (décision utilisateur 2026-11-04)
- Le bandeau qui signale une édition clôturée devient une **`origam-alert` info compacte**, titrée « Édition clôturée », qui précise que les résultats et les points sont gelés. Bleu plutôt que vert : c'est un état à connaître, pas un succès. Même forme que l'information « Code » de la même page. À ajouter dans `mapping.md`.

## Environnement de dev et contrôle de santé (décisions utilisateur 2026-11-04)
- **Environnement de dev sur Coolify**, sur un domaine de dev, avec l'image de production et une base PostgreSQL Coolify. L'utilisateur saisit les réglages dans Coolify, d'après le guide de T-OPS-04.
- **Mail en dev : Mailpit déployé sur Coolify**, sous un nom de domaine complet. Les invitations sont capturées, aucun vrai mail ne part.
- **Code déployé : `develop` tel quel**, redéployé à chaque merge.
- **Contrôle de santé** : `/api/v1/health` renverra aussi la version déployée (SHA) et l'état des migrations (T-OPS-03). Aucun secret dans la réponse.

## Pages livrées et guide de l'environnement de dev (décisions utilisateur 2026-11-04)
- Les pages des tickets mergés et fermés (accueil F-01, joueurs et fiche joueur F-04, face-à-face F-05) sont **livrées maintenant** (`delivered: true`, ticket T-REL-02), après vérification page par page. Elles deviennent visibles en dev, et le seront aussi en production.
- Le **guide de l'environnement de dev (T-OPS-04) est publié tout de suite**, avec ce qui est testable aujourd'hui, et une section « après le merge de F-10 » pour la connexion, l'invitation et Mailpit.

## F-13 — Champ « Année » de l'édition (décision utilisateur 2026-11-04)
- **`origam-text-field` avec le clavier numérique** (`inputmode="numeric"`) et nos règles (4 chiffres, entre 2000 et 2100). Le serveur reste l'autorité. On n'utilise pas `origam-number-field` : boutons +/− hors palette, texte décalé de 33 px sans boutons, et correction silencieuse d'une valeur hors bornes (« 27 » devient 2000), qui ferait partir au serveur une année valide mais fausse et empêcherait l'erreur « 4 chiffres ».
- Les défauts du champ numérique sont décrits dans la fiche Origam `docs/tickets/origam/number-field-hide-controls-retrait-et-bornage.md` (ui), à numéroter.
- Le rendu du champ texte est à mesurer par l'ui contre la maquette, après la fenêtre de B-11.

## T-REL-02 — Liens vers une page non livrée (décision utilisateur 2026-11-04)
- L'accueil livré contient trois liens vers le palmarès (`home-cta-secondary`, `home-tile-champion`, `home-rank-more`), et le palmarès (F-02) n'est pas encore livré. Ces liens sont **masqués tant que la page cible n'est pas livrée**, avec la même règle que la navigation (lecture de `PAGE_DELIVERY`), sans second mécanisme. Ils réapparaissent d'eux-mêmes à la livraison de F-02. La mise en page de l'accueil sans ces liens est mesurée.

## F-09 — Dérogation axe sur le menu ouvert d'`origam-select` (décision utilisateur 2026-11-04)
- Menu des suggestions ouvert : axe signale `aria-required-attr` et `aria-required-children`, deux défauts d'Origam 2.37.4. Il y a deux `role="combobox"` imbriqués (`OrigamTextField.vue:32` et `:94`), et un `role="menu"` posé sur un contenu `listbox` (`OrigamMenu.vue:14`).
- **Dérogation approuvée**, limitée à ces deux règles et à ces deux éléments, dans `tests/e2e/writes/F-09.spec.ts`. Issue Origam **#1331**. Ticket de remédiation à ouvrir au merge de F-09, pour réactiver les règles quand Origam corrige. Le menu reste utilisable au clavier, ce que vérifie l'e2e.

## F-11 — Nombre de poules par défaut (décision utilisateur 2026-11-04)
- Le nombre de poules proposé vient de la table « Config poules » du classeur (RG16, `archives.sql`, `legacy_workbook_rows`, lignes 9 à 83), qui couvre 20 à 70 joueurs par pas de 5. Exemples : 45 joueurs donnent 7 poules, 65 en donnent 10. Ce n'est pas une formule.
- **Hors de la table** (effectif qui n'est pas un multiple de 5, inférieur à 20 ou supérieur à 70) : **aucune valeur proposée**, l'admin saisit le nombre de poules (RG9). Aucune règle n'est inventée.
- Placement dans une poule : le joueur tiré prend la première place libre de la poule en cours de saisie (RG11, ux 7182f05). L'ordre de tirage en salle est porté par `drawnOrder`. « Changer » remplace un joueur sans changer son ordre, et il n'y a pas de retrait (le contrat B-11 ne dit pas si des trous dans `drawnOrder` sont permis).

## Instance de dev Coolify — exploitation (décisions utilisateur 2026-11-04, T-OPS-04)
- **Redéploiement** : le chef de projet redéploie l'application dev (« Redeploy » dans Coolify, via le navigateur de l'utilisateur) **après chaque merge sur `develop`**, puis vérifie la sonde de santé et les pages livrées. La source reste « Public GitHub ».
- **Interface web de Mailpit** : servie sur un **domaine https dédié** (`mail.ccc.dev.elysera.net` ou un joker `*.dev.elysera.net` vers 178.105.208.132), avec un certificat Let's Encrypt. L'adresse http `sslip.io` générée n'est pas utilisée. L'enregistrement DNS est à créer côté utilisateur.

## Administration sur l'instance de dev (décision utilisateur 2026-11-04)
- **Livrer dans l'ordre, au plus vite, avec des développeurs en plus.** L'ordre : F-10 (connexion, profil), puis redéploiement et compte admin ; ensuite F-09, puis F-11 ; enfin F-07 (tableau de bord `/admin`, cible du lien « Administration »), F-08 (scores) et F-13 (éditions), lancés en parallèle avec trois développeurs front de plus, plus B-15 côté back (flux d'activité, nécessaire à F-07). La limite PAR-1 (trois développeurs front) est levée pour ces tickets.
- Pas de réglage « toutes pages visibles » : une page n'apparaît sur la dev qu'une fois livrée et vérifiée.

## Administration — B-15 et F-08 (décisions utilisateur 2026-11-04)
- **B-15, « match corrigé »** : pas d'événement de correction pour l'instant. Le flux dérivé (A17) émet `MATCH_VALIDATED`, `DRAW_CREATED` et `DRAW_VALIDATED`. Un match corrigé apparaît en « validé » à la date de la correction, avec son auteur, car `correctMatch` écrase `validated_at` et `validated_by_user_id`. L'historique des corrections reste dans les journaux serveur (`match_corrected`). `MATCH_CORRECTED` ne doit plus être promis par le contrat (le retirer ou le documenter comme non émis).
- **B-15, auteur d'une action** : un admin sans compétiteur est désigné par son **email, visible des seuls admins**, comme déjà dans B-11 et B-12 (`toAdminActor`). Jamais l'email ni le téléphone d'un compétiteur. Le critère du ticket est amendé en ce sens.
- **F-08, correction d'un score validé** : hors F-08. Un match validé est en lecture seule dans F-08. La correction (`POST /matchs/{id}/correction`, A15) fera l'objet d'un ticket à part : dessin par l'ui, puis intégration.

## Conformité légale et RGPD (décisions utilisateur 2026-11-04, audit `ba-compliance`)
- **Éditeur : Elysera (société).** Les mentions légales nomment Elysera (dénomination, forme juridique, capital, siège, RCS ou SIREN, contact, directeur de la publication), plus l'hébergeur. Le © est au nom d'Elysera. Les informations précises sont à fournir par l'utilisateur ; aucune n'est inventée.
- **Archives 2012-2026 : noms conservés, avec un droit d'opposition.** La politique de confidentialité explique la publication des archives (intérêt légitime) et donne une adresse pour demander le retrait ou un pseudonyme. Les demandes sont traitées à la main par un admin.
- **Polices auto-hébergées** (T-SEC-16) : plus aucun appel à Google Fonts. Licence à vérifier (OFL attendue).
- **Cookies : information, sans bandeau.** Les trois cookies (`ccc_session`, `ccc_device`, `ccc_admin_edition`) sont exemptés de consentement selon la CNIL (authentification, sécurité, personnalisation). Une section « Cookies » de la politique de confidentialité les liste. Un bandeau ne deviendra obligatoire que si l'on ajoute une mesure d'audience non exemptée, un contenu tiers ou de la publicité.
- Pages prévues : `/mentions-legales`, `/confidentialite` (avec la section cookies), `/cgu` (recommandées) et `/accessibilite` (à décider). Le pied de page porte ces liens, le ©, et « Site réalisé par Elysera avec Origam », en lien simple `rel="noopener"`.

## F-13, F-07, accessibilité, mineurs (décisions utilisateur 2026-11-05)
- **F-13 : pages séparées** aux adresses françaises `/admin/editions`, `/admin/editions/nouvelle`, `/admin/editions/[code]`, `/admin/competiteurs/[[id]]` (ux, parcours 9e10f1f). La barre d'onglets de `admin-editions.html` devient une navigation entre pages (retouche ui), et le contenu des panneaux ne change pas. Un code d'édition est toujours généré par le serveur (année, ou année et lettre), donc il n'entre pas en conflit avec `nouvelle` (back-lead).
- **F-07 : « N participants inscrits »**, le nombre réel, sans « le jour J », sous l'étape « Participants » (retouche d'une ligne de `admin.html`).
- **Déclaration d'accessibilité : publiée, honnête**, sur `/accessibilite` : ce qui est fait (axe automatisé, clavier, mouvement réduit), ce qui ne l'est pas (aucun audit RGAA complet, donc pas de « conforme »), les défauts connus venant d'Origam, et un contact.
- **Mineurs : non.** Le championnat et les comptes sont réservés aux majeurs. La politique de confidentialité et les CGU le disent.

## 2026-11-05 — Accessibilité de l'accueil : bouton pause des animations (T-A11Y-01, M5)

- **Décision utilisateur** : les animations en boucle de l'accueil (pinte, fond animé) reçoivent un **bouton « Mettre en pause les animations »**, accessible au clavier, dont l'état est mémorisé pour le visiteur. Elles ne sont pas raccourcies.
- **Raison** : WCAG 2.2.2 et RGAA 13.8 exigent un moyen d'arrêter une animation de plus de 5 secondes, et `prefers-reduced-motion` n'en est pas un. L'effet vitrine est conservé.
- `prefers-reduced-motion: reduce` continue de tout désactiver.

## 2026-11-05 — F-07 : pas de compteur d'invitations en attente

- **Décision utilisateur** : l'étape 2 du centre de contrôle affiche seulement « N participants inscrits ». La mention « 0 invitation en attente » sort de la maquette `admin.html` ; l'API n'expose pas ce nombre et n'aura pas à le faire pour F-07.
- Le suivi des invitations reste sur l'écran de gestion des comptes.
- La référence interne « (A17) » du bloc activité sort aussi de la maquette (décision du chef de projet : aucune référence interne affichée).

## 2026-11-05 — Décisions utilisateur : robots.txt, dérogation 490938f, purge des sessions, Spec API de T-SEC-08

- **`public/robots.txt` supprimé** dans le commit de T-SEO-01 qui le remplace par la route dynamique (`Disallow: /` hors production). Accord donné pour cette suppression précise.
- **Dérogation Playwright pour `490938f`** (T-SEO-01, variable `NUXT_PUBLIC_SITE_INDEXABLE` et helper `isSiteIndexable`, sans aucun appelant) : merge après typecheck et test:run verts, sans Playwright. La dérogation est notée dans le message de merge, et le prochain Playwright complet couvre ce code.
- **Purge planifiée des sessions expirées** : un ticket back, pour que la politique de confidentialité annonce une durée maximale définie (et non « au plus tôt 24 h »).
- **Spec API amendée** avec le contrat de T-SEC-08 (If-Match ; 428, 412, 400, 409 ; `version` du compétiteur).

## 2026-11-05 — F-19 : CGU, page d'erreur, médiateur (décisions utilisateur)

- **Pas d'acceptation des CGU à la première connexion** : les CGU et la politique de confidentialité sont accessibles par des liens (pied de page et écran d'invitation), sans case à cocher.
- **Page d'erreur CCC dans F-19** : un `error.vue` avec le layout public (message, lien vers l'accueil, pied de page avec les mentions légales).
- **Aucune mention de médiateur de la consommation** : le site est gratuit et ne vend rien. À revoir si CCC devient payant.

## 2026-11-05 — F-13 : compteur d'inscrits en direct dans la liste admin des éditions

- **Décision utilisateur** : la liste admin des éditions affiche le nombre d'inscrits en direct pour une édition en cours, comme la maquette (« Participants 45 »). Le back l'ajoute au DTO de la liste **admin**, dans un petit ticket qui amende le contrat. Le `participantCount` public reste figé à la clôture.

## 2026-11-05 — F-08 : la file des scores couvre tous les tours, avec un filtre par tour

- **Décision utilisateur** : la file de `/admin/matchs` montre les matchs de poule **et** de phase finale, avec un **filtre par tour**. Ce filtre est à ajouter à la maquette `admin-matchs.html` par ui.
- **Raison** : aucun écran admin du tableau final n'existe (F-03-BRK ne concerne que la page publique). Avec une file limitée aux poules, aucun score de phase finale ne pourrait être saisi depuis l'admin.
- Cette décision remplace le choix provisoire « poules seulement » pris dans la branche F-08 (c77c0f9).

## 2026-11-05 — B-20 attend F-13 ; écrans admin de la phase finale à ouvrir

- **B-20 est mergé après F-13** (décision utilisateur). Pas d'exception temporaire à ARCH-11 bis : la liste « endpoints sans page » reste réservée aux endpoints durablement sans page. F-13 déclare `ADMIN_EDITIONS` avec `pendingTicket: 'B-20'`, puis B-20 est rebasé et retire le `pendingTicket`.
- **Écrans admin de la phase finale : tickets front à ouvrir** (décision utilisateur) : validation des qualifiés, barrages et départages, tirage du tableau final, et clôture de l'édition. Ils s'appuient sur B-13 et B-14. ux et ui les dessinent d'abord. La saisie des scores de phase finale reste dans F-08, avec son filtre par tour (décision 1b7483d5).

## 2026-11-05 — Phase finale admin (F-24, F-25, F-26) et B-13 : six décisions utilisateur

1. **Navigation** : une seule entrée « Phase finale », qui ouvre trois pages liées par un stepper (qualification, tirage du tour, clôture). Le menu reste court ; les écrans suivent les étapes 5 à 9 du centre de contrôle.
2. **Score d'un départage** : saisi dans « Poules et matchs » (F-08), avec un filtre « Départages ». Il n'y a qu'un seul lieu de saisie des scores.
3. **Réversibilité** : aucun retour arrière. L'arrêt de la liste des qualifiés, un tirage de tour validé et la clôture sont définitifs, et chaque dialogue de confirmation le dit.
4. **Confirmation de la clôture** : l'organisateur saisit le code de l'édition.
5. **Saisie du tirage physique des tours** : affiche par affiche (les deux joueurs d'une affiche saisis ensemble).
6. **B-13, puissance de 2** : aucun refus à la qualification. Les contrôles se font au tirage : chaque affiche a deux côtés, tout le vivier est tiré, un vivier impair est refusé. L'organisateur reste responsable de la cohérence du tableau.

## 2026-11-05 — B-13 / F-25 : tours hors puissance de 2

- **Décision utilisateur** : quand le nombre de qualifiés n'est pas une puissance de 2, l'admin choisit le tour qu'il tire. Le serveur vérifie seulement que chaque affiche a deux joueurs et que personne n'est oublié, avec une garde sur les huitièmes. On enregistre ce qui s'est passé en salle ; aucune règle de barrage calculée n'est inventée.

## 2026-11-08 — Palette « Au bord de la mer » (rethème)

- **Décision utilisateur** : l'ancien thème « Happy Hour » (nuit violette / néon rose / ambre) est remplacé par la palette de l'affiche du festival de bières de Cherbourg — **bleu pétrole, or chaud, crème de la mousse**. Le rethème est porté par `src/themes/ccc.theme.ts` et la copie maquette `docs/design/ui/happy-hour/theme.ts` ; `tokens.css` est régénéré (`npm run docs:tokens`, script `scripts/gen-mockup-tokens.mjs`).
- **Inchangé** : le nom du thème (`ccc`), le mode sombre, les props des composants, la typo (Bagel Fat One / Gabarito), rayons, espaces, motion. Seuls les tokens de couleur et d'ombre changent.
- **Palette** : surfaces pétrole `#112631` (default) → `#284758` (overlay) → `#0a1b24` (sunken) ; texte crème `#f3eedd` (10,75:1 sur raised), mer claire `#a9c3d1` ; action primaire **or** `#e2ac65` (encre `#0e242f`, 7,87:1) ; accent éditorial **crème** (13,78:1) ; feedback mint / or / terracotta `#e78474` / mer `#62b4da` ; focus cyan `#3ec8da` ; `bar` = mousse / or / or riche `#c17825` / mer claire / pétrole ; ombres = filet crème + ambiance `rgba(2, 10, 14)` + **extrusion ambre** `#855123` (remplace l'extrusion néon).
- **Bordures** : `border.default` passe de `rgba(201, 184, 232, 0.18)` à `rgba(131, 166, 185, 0.7)` — **3,97:1 sur sunken / 3,17:1 sur raised**, au lieu de 1,3–1,4:1 (le M1 de T-A11Y-01, « aucun jeton de bordure n'atteint 3:1 »). C'est un correctif d'accessibilité qui tombe avec le rethème.
- **Aucune maquette ne change de structure** : `hh.css` / `pages.css` / `admin.css` ne font que référencer `var(--origam-*)`, ils suivent les nouveaux tokens. Les comparaisons visuelles (FA-04-seuil, 1 % par zone) restent valables.
- La police display Bagel Fat One et l'exception PROPS-FIRST (`.font-display`) restent en vigueur (Elyseranet/origam#1212).

## 2026-11-10 — Correction mobile du bandeau des règles d’or

- **Bug signalé (utilisateur)** : en version mobile, le bandeau des règles d’or (accueil) était cassé. En cause : sur ≤760 px, le défilement `scroll-snap-type: x mandatory` n’avait que des points d’aimant en début d’item (`start`) ; avec 8 items de 78 %, le début de la 8ᵉ règle dépasse la fin de la plage scrollable, l’aimant renvoyait donc toujours sur la 7ᵉ règle et la 8ᵉ ne s’affichait qu’amputée, impossible à lire.
- **Correction** : `scroll-snap-align: end` sur le dernier item — un point d’aimant atteignable en fin de défilement, la 8ᵉ règle devient entièrement lisible. Portée dans `src/components/common/GoldenRules.vue` (variante `band`) et en parité dans la maquette `docs/design/ui/happy-hour/hh.css` (`.ticker__list li:last-child`).
- **En parité** : scrollbar masquée sur WebKit (`::-webkit-scrollbar { display: none }`) en plus de `scrollbar-width: none` (Firefox), application et maquette — l’intent du design était « pas de barre » ; iOS/Chrome l’ignoraient.
- **Aucun autre changement** : largeur d’item (78 %), aimant `mandatory`, grille 4 × 2 bureau, contenus RG25–RG32 inchangés.

## 2026-11-06 — Passes lourdes : seuil de charge assoupli

- **Décision utilisateur** : les passes lourdes (test:api, test:db, Playwright complet) peuvent tourner jusqu'à une charge machine (load sur 1 minute) de **10**, au lieu de 4 pour le back et 6 pour le front. La charge est relevée et notée pour chaque passe.
- Une passe qui échoue par délai dépassé est **refaite au calme**. Seule une passe complète, sans exclusion, avec 0 échec et 0 test instable, vaut preuve pour un merge.
- Une seule passe lourde à la fois (règle des fenêtres inchangée).

## 2026-11-12 — Pages légales non indexées

- **Décision utilisateur** : les quatre pages légales (`/mentions-legales`, `/confidentialite`, `/cgu`, `/accessibilite`) ne sont pas indexées. Elles restent accessibles depuis le pied de page et hors sitemap.
- **Front** : chaque page appelle `useSeo({ noindex: true })` (meta `robots: noindex, nofollow`) et garde son titre d'onglet ; leurs routes sont dans `SEO_PRIVATE_ROUTE_PATTERNS`, ce qui pose aussi l'en-tête `X-Robots-Tag` par `routeRules`. Aucune clé `seo.*` pour ces pages.
- **À suivre côté back de T-SEO-01** : l'exclusion du sitemap.

## 2026-11-12 — F-13 : Éditions et Compétiteurs dans « Plus »

- **Décision utilisateur** : les entrées « Éditions » et « Compétiteurs », livrées par F-13, rejoignent l’écran admin « Plus » (mobile). **FA-09 est levé pour ces deux entrées.**
- Ordre : Éditions, Compétiteurs, Phase finale, Participants, Voir le site public, Mon compte. Les deux entrées vont en tête, comme dessiné dans `admin-editions.html` (écran « Menu Plus ») et noté dans `mapping.md`.
- Le tiroir bureau de `admin-plus.html` porte la section « Référentiel » (Éditions, Compétiteurs), comme `admin-editions.html`.
