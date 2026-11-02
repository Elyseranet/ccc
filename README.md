# CCC

Application de gestion du championnat CCC, avec un site public et un back-office organisateur.

Le socle technique utilise Nuxt 4 et Nitro, PostgreSQL et TypeORM. Les premières vues suivent l'export de design fourni : accueil, compétition, compétiteurs, face-à-face, règlement, variantes, Hall of Fame et espace d'administration.

Les archives 2012-2026 (le classeur brut et sa reprise vers les entités métier) sont livrées sous la forme d'un dump SQL figé, appliqué par `npm run db:seed:archives` (voir plus bas). L'application ne contient aucune donnée fictive : les écrans lisent toujours l'API réelle (ARCH-8).

## Prérequis

- Node.js `22.22.3` ou une version prise en charge par Nuxt, selon la contrainte du champ `engines` dans `package.json`.
- npm.
- Une instance PostgreSQL accessible.

## Installation

```sh
npm install
cp .env.example .env
```

Renseigner `NUXT_DATABASE_PASSWORD` dans `.env`. Ne jamais committer ce fichier.

## Docker

L'image Docker et `docker-compose.yml` servent au **déploiement** (voir « Déploiement Coolify »). Ils ne servent pas au développement local (décision utilisateur 2026-11-01) : l'image refuse de démarrer sans une configuration de production valide (site en https, SMTP réel, secret d'appareil), sans mode recette. En local, utiliser `npm run dev` (voir « Développement ») avec une base PostgreSQL locale, en passant les variables sur la ligne de commande, sans copier de `.env` ailleurs :

```sh
NUXT_DATABASE_HOST=localhost NUXT_DATABASE_PORT=5432 NUXT_DATABASE_USERNAME=ccc NUXT_DATABASE_PASSWORD=<mot de passe> NUXT_DATABASE_DATABASE=ccc npm run dev
```

Les migrations TypeORM s'appliquent avec `npm run db:migration:run` (voir « Migrations TypeORM »). Dans le conteneur de production, elles s'appliquent au démarrage, avant le serveur ; les données PostgreSQL restent dans le volume Docker `ccc_db_data`.

## Déploiement Coolify

L'image (`Dockerfile`) est agnostique de l'environnement : aucune valeur n'est cuite dans l'image, et aucun `.env` n'y entre (`.dockerignore`). Toute la configuration vit dans les variables d'environnement de Coolify (`NUXT_*`, lues à l'exécution via `runtimeConfig`).

Mode recommandé (décision OPS-1 et OPS-2) : Coolify construit l'image depuis le dépôt (`https://github.com/Elyseranet/ccc`, privé) avec le `Dockerfile` seul, et PostgreSQL est une **ressource Coolify séparée** (sauvegardes gérées par Coolify). Renseigner `NUXT_DATABASE_HOST`, `_PORT`, `_USERNAME`, `_PASSWORD` et `_DATABASE` avec les valeurs de cette ressource. Il n'y a pas de registre d'images ni de workflow de publication.

### Variables obligatoires en production (garde-fou PROD-1)

L'image pose `NUXT_STRICT_RUNTIME_CONFIG=true` (étage runner du `Dockerfile`) **et un fichier marqueur** `/app/.ccc-production-image`, propriété de root (T-SEC-06, décision utilisateur SEC-Q). Tant que ce marqueur existe, la garde ne peut pas être éteinte : si `NUXT_STRICT_RUNTIME_CONFIG` est à `false`, `0`, vide ou absent, le serveur **et** `ccc-ops user:create-admin` refusent de démarrer (« NUXT_STRICT_RUNTIME_CONFIG cannot be turned off in the production image »). Il n'existe pas de mode recette : une recette sur cette image demande une vraie configuration. Avec la garde active, ils refusent aussi de démarrer, avec un message qui nomme la variable fautive (jamais sa valeur), si l'une de ces variables manque ou est locale :

| Variable | Exigence |
|---|---|
| `NUXT_PUBLIC_SITE_URL` | URL en `https:`, qui ne désigne ni `localhost`, `127.0.0.1`, `::1`, `0.0.0.0` ni un `*.localhost` ; base des liens d'invitation |
| `NUXT_MAIL_TRANSPORT` | `smtp` (`capture` est réservé aux tests d'API) |
| `NUXT_MAIL_HOST` | serveur SMTP réel, nom complet avec un point : ni vide, ni `localhost`, `127.0.0.1`, `::1`, `0.0.0.0`, `*.localhost`, ni un nom de service sans point (`mailpit`) |
| `NUXT_MAIL_FROM` | expéditeur réel, par ex. `CCC <no-reply@votre-domaine>` : ni vide, ni la valeur par défaut (`@ccc.local`) |
| `NUXT_AUTH_SECURE_COOKIE` | ne doit pas être éteint (`false` ou `0`) |
| `NUXT_AUTH_DEVICE_COOKIE_SECRET` | 32 caractères au moins (T-SEC-12, L12) |
| `NUXT_MAIL_PORT`, `NUXT_MAIL_SECURE`, `NUXT_MAIL_USER`, `NUXT_MAIL_PASSWORD` | à renseigner selon le fournisseur SMTP. Non contrôlés par la garde : le fournisseur de production n'est pas choisi (A3) et certains relais n'exigent pas d'identifiants |

Hors de l'image (poste de développement, build des tests d'API), l'indicateur est faux par défaut, ne dépend pas de `NODE_ENV`, et rien n'est contrôlé. Le fichier `.ccc-production-image` est exclu du dépôt et du contexte de build (`.gitignore`, `.dockerignore`) : un fichier homonyme ne peut pas faire basculer un poste ou un build.

Repli, ou usage local : `docker-compose.yml` (app + PostgreSQL 16 + volume) comme ressource « Docker Compose ». Aucun port n'y est publié : Coolify route le domaine vers le port 3000 du service `app`.

Une seule instance de l'application est déployée pour l'instant. Les migrations s'exécutent au démarrage de chaque conteneur : avec plusieurs réplicas démarrant en même temps, elles tourneraient en parallèle, sans verrou entre instances. Avant de passer à plusieurs réplicas, il faudra donc exécuter les migrations dans une étape unique (par exemple une commande de pré-déploiement `ccc-ops migrate`) ou ajouter un verrou.

### Prérequis de release : garde par page livrée

Le build de l'image exécute `npm run test:release` avant `nuxt build` (T-REL-01, décision OPS-3). Le build échoue uniquement si une page **livrée** consomme un endpoint dont la route serveur n'existe pas encore. Il n'y a pas de variable pour désactiver la garde.

- `src/consts/page-delivery.const.ts` (`PAGE_DELIVERY`) liste chaque route avec `delivered` et les endpoints qu'elle consomme. Ceux de son layout (`src/consts/layout-endpoints.const.ts` : `ME` partout, plus `EDITIONS` pour l'admin) s'y ajoutent. Toutes les routes sont pré-déclarées à `delivered: false`.
- `src/consts/api-routes.const.ts` (`API_ROUTES`) associe chaque endpoint à son fichier de route Nitro. Une route pas encore écrite porte le ticket back qui la livre (`pendingTicket`) : l'écran répond en erreur (état AsyncState) jusqu'au merge de ce ticket, sans route provisoire ni fausse donnée (ARCH-11). Un test vérifie que le fichier existe si et seulement si `pendingTicket` est absent : à la livraison d'une route, retirer son `pendingTicket` dans le même commit.
- Un ticket F-xx passe sa ligne à `delivered: true` quand son écran est branché sur l'API réelle. Un endpoint partagé (`ME`, `EDITIONS`…) bloque la release tant qu'une seule page livrée le consomme sans route.
- En production, une page non livrée répond **404** (middleware `page-delivery.global.ts`, vrai statut HTTP en SSR) et disparaît de la navigation. En dev et en test, tout reste visible. Les redirections vers une page non livrée se terminent en 404. Le 404 d'une page non livrée n'est pas un contrôle d'accès ; l'autorisation reste portée par le middleware `admin` et par le serveur.
- Garde-fous toujours actifs (`npm run test:run`) : une page de `src/pages` absente de la table, une entrée sans page et un endpoint rattaché à aucune page font échouer les tests.
- `npm run test:release:e2e` vérifie le masquage sur le **build** (et non sur `nuxt dev`) : lancer `npm run build` puis la commande, ou viser un conteneur de l'image avec `E2E_BASE_URL`. Ajouter à `DELIVERED_PAGES` (`tests/e2e-release/page-delivery.spec.ts`) les routes que le ticket livre ; le test de la page livrée exige une session administrateur (`E2E_ADMIN_SESSION`) et échoue sans elle.

### Variables d'environnement

| Variable | Obligatoire | Rôle |
|---|---|---|
| `NUXT_DATABASE_HOST`, `_PORT`, `_USERNAME`, `_PASSWORD`, `_DATABASE` | oui (sauf `_PORT`, 5432) | Connexion PostgreSQL (serveur et migrations). Le démarrage échoue si l'une est vide. |
| `NUXT_AUTH_DEVICE_COOKIE_SECRET` | oui en production (B-08) | Secret du cookie d'appareil, 32 caractères minimum. Obligatoire dans le compose ; l'application refuse de démarrer en production sans lui (SEC-A4). Disponible après intégration de B-08. |
| `NUXT_AUTH_SECURE_COOKIE` | non (vrai) | Cookies `Secure` + préfixe `__Host-` (T-SEC-04, L3). **Ne jamais positionner `false` sur un déploiement Coolify en HTTPS** (laisser la variable absente) ; `false` ne sert qu'au développement local en HTTP. |
| `NUXT_AUTH_PASSWORD_HASH_CONCURRENCY` | non (2) | Calculs scrypt simultanés, de 1 à 64 ; au-delà, 503 `SERVICE_BUSY` avec `Retry-After` (T-SEC-04, L2). |
| `PORT` | non (3000) | Port d'écoute du serveur ; la sonde de santé de l'image le suit. |
| `NUXT_RATE_LIMIT_WINDOW_MS`, `_MAX_REQUESTS`, `_MAX_KEYS` | non | Limiteur de débit (voir plus haut). |
| `NUXT_TRUST_PROXY_HOPS` | **oui derrière Coolify** (défaut 0) | Nombre de reverse proxys de confiance devant le conteneur, de 0 à 5. À poser au nombre de proxys réellement traversés (le proxy de Coolify seul : 1 ; un CDN devant en ajoute un). La chaîne exacte du déploiement n'est pas encore connue : à vérifier au premier déploiement. |
| `NUXT_RATE_LIMIT_PUBLIC_READ_WINDOW_MS`, `_MAX_REQUESTS` | non (60000, 300) | Budget partagé des routes publiques en lecture (vague 2). |
| `NUXT_RATE_LIMIT_COMPETITORS_SEARCH_WINDOW_MS`, `_MAX_REQUESTS` | non (60000, 30) | Recherche publique `?q=` (vague 2). |
| `NUXT_AUTH_LOGIN_RATE_LIMIT_WINDOW_MS`, `_MAX_IP_ATTEMPTS`, `_MAX_KEYS` | non (900000, 20, 10000) | Limiteur de connexion (B-08). |
| `NUXT_AUTH_ALLOWED_ORIGINS` | non (vide) | Origines supplémentaires autorisées en écriture, séparées par des virgules (B-08). Derrière le proxy de Coolify, l'origine propre du serveur est reconstruite depuis l'en-tête `Host` et `X-Forwarded-Proto` (h3 `getRequestURL`). À vérifier au premier déploiement : si une écriture légitime (connexion, admin) répond 403 `FORBIDDEN_ORIGIN`, poser ici `https://<domaine>`. |
| `NUXT_CACHE_CLOSED_EDITION_MAX_AGE_SECONDS` | non (3600) | `Cache-Control` public des lectures d'une édition CLOSED (vague 2). |

Aucune variable de session (`NUXT_SESSION_*`) ni SMTP n'existe dans le code à ce jour : à ajouter à ce tableau quand l'authentification (B-08) et l'envoi de courriel seront intégrés.

### Domaine et sonde de santé

- Le domaine n'est pas encore connu (OPS-4) : il se règle dans Coolify (service `app`, port 3000), aucune valeur n'est codée dans l'image ni dans le dépôt.
- La sonde est `GET /api/v1/health` : 200 si la base répond, 503 sinon. Le `HEALTHCHECK` de l'image l'appelle avec `curl` (installé dans l'image). Dans Coolify, activer le healthcheck avec le chemin `/api/v1/health`, ou laisser celui de l'image.
- La route est soumise au limiteur de débit par IP. Derrière le proxy de Coolify, poser `NUXT_TRUST_PROXY_HOPS` au nombre de proxys traversés (voir la table des variables) : sans lui, tous les clients partagent l'IP du proxy. Le SSL PostgreSQL (`NUXT_DATABASE_SSL` pressentie) reste à faire (T-SEC-02). T-RGPD-01 (Google Fonts) est à arbitrer avant la mise en production.

### Première mise en route

1. Définir les variables ci-dessus dans Coolify, puis déployer. Au démarrage, `entrypoint.sh` applique les migrations (`ccc-ops migrate`, qui journalise en JSON `migrations_applied` ou `migrations_up_to_date`, sans les requêtes SQL de la CLI TypeORM) avant le serveur ; si la base est injoignable ou si une migration échoue, le conteneur s'arrête en erreur et le serveur n'est pas lancé. `synchronize` n'est jamais activé.
2. Ouvrir le terminal du conteneur dans Coolify, ou `docker exec -it <conteneur> ...`, et lancer les commandes d'exploitation avec `ccc-ops` :

| Commande | Rôle | Disponibilité |
|---|---|---|
| `ccc-ops migrate` / `ccc-ops migrate:revert` | Applique ou annule la dernière migration (`src/utils/run-migrations-cli.util.ts`, sans journal des requêtes SQL). | image actuelle |
| `ccc-ops db:seed:archives` | Applique le dump SQL figé des archives 2012-2026 (`src/assets/seeds/archives.sql`), en une transaction, sur une base migrée et vide. | image actuelle |
| `ccc-ops user:create-admin` | Crée le premier administrateur. | image actuelle |
| `ccc-ops user:unlock` | Déverrouille un compte. | image actuelle |

Ordre conseillé : déployer (les migrations s'appliquent au démarrage), `db:seed:archives`, puis `user:create-admin`. Les scripts sont compilés par `npm run db:typeorm:build` dans `.typeorm-dist/src/…`.

Chaque `ccc-ops` lit les `NUXT_DATABASE_*` du conteneur ; aucun fichier `.env` n'est nécessaire ni présent.

## Environnement de dev sur Coolify (T-OPS-04)

Guide pour monter l'instance de dev de l'utilisateur (décisions du 2026-11-04 : Coolify, domaine de dev, Mailpit sur Coolify, branche `develop` telle quelle). L'équipe n'a pas accès à Coolify : chaque étape est à faire dans l'interface Coolify. Les valeurs entre chevrons (`<…>`) sont à fournir ; aucune valeur de ce guide n'est un secret réel.

### 1. Ressources à créer dans un même projet Coolify

1. **PostgreSQL 16** : ressource « Database » de Coolify. Noter l'hôte interne, le port, l'utilisateur, le mot de passe et la base qu'elle affiche.
2. **Mailpit** : ressource « Docker Compose », avec ce contenu (version d'image à figer au montage, par exemple la dernière publiée) :

   ```yaml
   services:
     mailpit:
       image: axllent/mailpit:<version-figée>
       environment:
         MP_UI_AUTH: "<utilisateur>:<mot-de-passe-ui>"
       networks:
         default:
           aliases:
             - mailpit.ccc.internal
   ```

   - L'**alias à point** `mailpit.ccc.internal` est indispensable : dès le merge de T-SEC-06, la garde PROD-1 refuse un hôte SMTP sans point (nom de service nu). Le SMTP (port 1025) n'est jamais publié ; seule l'interface web (port 8025) reçoit un domaine Coolify, par exemple `mail.<domaine-dev>`.
   - **L'interface web montre les liens d'invitation, qui sont des secrets** : la protéger par un mot de passe (`MP_UI_AUTH` ; nom de variable à vérifier dans la documentation de Mailpit pour la version figée).
   - L'application doit **partager un réseau Docker** avec Mailpit pour résoudre l'alias (option Coolify de connexion au réseau commun du projet). Le réglage exact de Coolify n'est pas connu de l'équipe : il se vérifie à l'étape 4.
3. **Application** : source « Dépôt Git » `https://github.com/Elyseranet/ccc`, branche **`develop`**, build par **`Dockerfile`**, port **3000**, domaine `https://<domaine-dev>`, **redéploiement automatique** à chaque push sur `develop`.

### 2. Variables de l'application

| Variable | Valeur pour l'instance de dev |
|---|---|
| `NUXT_DATABASE_HOST`, `NUXT_DATABASE_PORT`, `NUXT_DATABASE_USERNAME`, `NUXT_DATABASE_PASSWORD`, `NUXT_DATABASE_DATABASE` | les valeurs de la ressource PostgreSQL |
| `NUXT_PUBLIC_SITE_URL` | `https://<domaine-dev>` : base des liens d'invitation ; https, jamais localhost (garde PROD-1), et jamais une IP privée dès le merge de T-SEC-06 |
| `NUXT_MAIL_TRANSPORT` | `smtp` |
| `NUXT_MAIL_HOST` | `mailpit.ccc.internal` (l'alias à point) |
| `NUXT_PUBLIC_SITE_INDEXABLE` | ne pas la définir, ou `false` : la dev n'est jamais indexée (T-SEO-01) |
| `NUXT_MAIL_PORT` | `1025` |
| `NUXT_MAIL_SECURE` | `false` (Mailpit, réseau interne) |
| `NUXT_MAIL_FROM` | `CCC <no-reply@<domaine-dev>>` : un vrai domaine, jamais `ccc.local` (refusé) |
| `NUXT_AUTH_DEVICE_COOKIE_SECRET` | 32 caractères au moins, générés une fois (`openssl rand -hex 32`), propres à cette instance |
| `NUXT_TRUST_PROXY_HOPS` | `1` par défaut : le proxy de Coolify seul. Ajouter 1 par CDN ou proxy placé devant Coolify. |
| `NUXT_AUTH_ALLOWED_ORIGINS` | vide ; à poser à `https://<domaine-dev>` seulement si une écriture légitime répond 403 `FORBIDDEN_ORIGIN` |

Ne pas poser `NUXT_STRICT_RUNTIME_CONFIG` ni `NUXT_AUTH_SECURE_COOKIE` : l'image force le mode strict, et les cookies sécurisés sont le défaut.

### 3. Sonde de santé

Dans Coolify, healthcheck HTTP sur le chemin `/api/v1/health`, port 3000 (ou laisser le `HEALTHCHECK` de l'image). Réponse attendue : **200**. Un 503 signifie que la base n'est pas joignable.

### 4. Premier déploiement et vérifications

1. Déployer. Au démarrage, les migrations s'appliquent avant le serveur ; si la configuration est refusée, le journal du conteneur nomme la variable fautive (jamais sa valeur).
2. Vérifier `https://<domaine-dev>/api/v1/health` : 200.
3. Dans le terminal du conteneur de l'application, vérifier que l'alias de Mailpit est résolu :

   ```sh
   getent hosts mailpit.ccc.internal
   ```

   Une ligne `<adresse> mailpit.ccc.internal` doit s'afficher. **Si rien ne s'affiche**, l'application ne joint pas Mailpit : prévenir l'équipe, qui posera la suite à l'utilisateur. Dépannage temporaire seulement : mettre dans `NUXT_MAIL_HOST` l'adresse IP privée du conteneur Mailpit (acceptée par la garde pour le SMTP). Elle change à chaque redéploiement de Mailpit, d'où la fragilité.
4. Charger les archives 2012-2026 (une seule fois, base vide) :

   ```sh
   ccc-ops db:seed:archives
   ```

   Résultat attendu : `"editions":16,"competitors":146,"matches":729,"validatedMatches":554`.
5. Créer le premier administrateur : `ccc-ops user:create-admin`, saisir l'email demandé. La commande affiche **une seule fois** le lien de première connexion (valable 7 jours, usage unique) : c'est un secret, à ne copier ni dans un ticket ni dans une conversation. Le lien du premier admin ne passe pas par Mailpit ; les invitations des joueurs, elles, y arrivent.

### 5. Ce qui est testable

Une page non livrée répond **404** en production (garde OPS-3). Il n'y a pas de mode « toutes pages visibles » (décision utilisateur du 2026-11-04).

**Testable aujourd'hui** (`develop` à la date de ce guide) :
- les pages d'édition, `/editions/<code>`, par exemple `/editions/2026` ;
- l'API publique : `/api/v1/health`, `/api/v1/editions`, `/api/v1/competiteurs`, `/api/v1/classements/acp`, `/api/v1/classements/all-time`, `/api/v1/classements/evolution`.

**Disponible après le merge de T-REL-02** (livraison des pages des tickets fermés, décision utilisateur du 2026-11-04) : l'accueil, la liste des joueurs, la fiche joueur et le face-à-face. Ces pages répondent encore 404 tant que T-REL-02 n'est pas dans `develop`.

**Après le merge de F-10** (connexion et invitation) :
- se connecter par `/connexion` ;
- ouvrir le lien du premier administrateur, affiché par `ccc-ops user:create-admin`, sur `/invitation/<jeton>`, et choisir le mot de passe ;
- lire dans Mailpit (`https://mail.<domaine-dev>`, protégé par mot de passe) les invitations des joueurs, puis les ouvrir de la même façon. Une invitation de joueur part quand un administrateur crée un compétiteur avec un email. Par l'interface, cela suppose aussi que l'écran d'administration des participants soit livré, ce qui ne dépend pas de F-10.
Avant ce merge, ces liens ouvrent un 404. L'instance redéploie `develop` à chaque merge : ces parcours s'ouvrent d'eux-mêmes à la livraison, sans rien changer dans Coolify.

## Développement

```sh
npm run dev
```

## Migrations TypeORM

Les migrations sont stockées dans `src/server/db/migrations/`, la configuration TypeORM (DataSource, options, stratégie de nommage, transformer) dans `src/server/db/typeorm/` et les entités dans `src/server/db/typeorm/entities/` (ARCH-6). Le schéma n'est pas synchronisé automatiquement.

```sh
npm run db:migration:generate -- src/server/db/migrations/NomMigration
npm run db:migration:run
npm run db:migration:revert
```

Les commandes nécessitent une connexion PostgreSQL valide définie dans l'environnement ou `.env`.
`npm run db:migration:revert` annule la migration la plus récente ; pour la migration d'archive, cela supprime ses deux tables et toutes les lignes qu'elles contiennent.

La CLI génère la migration en JavaScript (elle lit le `data-source` compilé) : la relire, la convertir en `.ts` avec `up` et `down`, puis supprimer le `.js`.

### Schéma métier (M1) et rollback

La migration `CreateDomainSchema` crée `competitors`, `competitor_aliases`, `editions`, `pools`, `rounds`, `participations`, `matches`, `match_sides`, `draws` et `draw_assignments`. Elle n'installe aucune extension PostgreSQL (`gen_random_uuid()` est natif depuis PostgreSQL 13).

`npm run db:migration:revert` supprime ces dix tables et leurs types enum, donc **toutes les données métier, y compris les archives appliquées par `db:seed:archives`**. Pour les retrouver : revenir à un schéma migré et vide, puis rejouer `db:seed:archives`.

Les tests d'intégration du schéma (`npm run test:db`) tournent sur une base dédiée dont le nom finit par `_test`. Ils **suppriment et recréent** son contenu. Passer les variables en ligne de commande, sans jamais copier un `.env` :

```sh
NUXT_DATABASE_HOST=127.0.0.1 NUXT_DATABASE_PORT=5544 NUXT_DATABASE_USERNAME=... \
NUXT_DATABASE_PASSWORD=... NUXT_DATABASE_DATABASE=ccc_test npm run test:db
```

### Archives 2012-2026 : dump SQL figé (ARCH-5, ARCH-10)

`src/assets/seeds/archives.sql` contient les archives sous forme d'`INSERT` : 16 éditions, 146 compétiteurs, 729 matchs dont 554 avec score, et la source brute du classeur (`legacy_workbook_imports`, `legacy_workbook_rows`, 2 478 lignes). Le dump a été généré une seule fois, le 2026-10-22, depuis une base neuve, par la chaîne de reprise de l'époque (seed du classeur puis reprise B-04). Les contrôles ont été faits avant la génération : Nicolas Deseine à 39/13, 0 écart bloquant entre les classements recalculés et le classeur. Cette chaîne (convertisseur, JSON, scripts de seed et d'import) a ensuite été supprimée. Le fichier ne s'édite pas à la main.

```sh
npm run db:migration:run    # schéma à jour
npm run db:seed:archives    # une transaction ; refuse une base qui contient déjà des données
```

Le test de non-régression `tests/db/archives-seed.test.ts` applique le dump sur une base neuve. Il revérifie les comptes, Deseine 39/13 et le « 0 écart avec le classeur » (`legacy-verification.util`, à partir des lignes brutes en base). Les cas « vraies données » du domaine (`tests/db/archives-*.test.ts`) lisent eux aussi le classeur depuis la base.

```sh
# base jetable dont le nom finit par _test, variables en ligne de commande
NUXT_DATABASE_HOST=127.0.0.1 NUXT_DATABASE_PORT=5544 NUXT_DATABASE_USERNAME=... \
NUXT_DATABASE_PASSWORD=... NUXT_DATABASE_DATABASE=ccc_test npm run test:db
```

## Tests

```sh
npm run test:run      # tests unitaires et front (Vitest), sans base de données
npm run test:api      # tests d'intégration d'API (@nuxt/test-utils/e2e), base PostgreSQL dédiée
npm run test:bundle   # nuxt build, puis vérifie qu'aucun chunk navigateur ne contient de code serveur
npm run test:a11y     # e2e Playwright (axe), sur nuxt dev et une base de test réelle
npm run test:visual   # e2e Playwright, comparaison aux maquettes
npm run test:writes   # e2e Playwright d'écriture (QA-3), sur des éditions créées par les tests ; à lancer après les autres projets ou avec test:e2e
npm run test:e2e      # tous les projets Playwright : routes, a11y, visual, puis writes
```

`test:api` construit l'application puis la lance contre une base de test. Les variables de connexion sont passées par l'environnement, jamais depuis `.env` copié ailleurs :

```sh
NUXT_DATABASE_HOST=localhost NUXT_DATABASE_PORT=5432 NUXT_DATABASE_USERNAME=ccc \
NUXT_DATABASE_PASSWORD=... NUXT_DATABASE_DATABASE=ccc_test npm run test:api
```

Le nom de la base doit se terminer par `_test` : sinon la suite refuse de démarrer, pour ne jamais toucher une base réelle.

### e2e sur les vraies données (ARCH-9)

Avant les e2e Playwright, `tests/e2e/global-setup.ts` remet à neuf la base `NUXT_DATABASE_DATABASE` (suffixe `_test` obligatoire). Il applique les migrations et le dump des archives, puis crée des comptes de test (administrateur, participant) avec une session réelle. Aucun mot de passe utilisable n'est créé. Les specs posent le cookie `ccc_session` avec `signIn(context, role)`. Lancer sur un port libre, avec les seules variables nécessaires :

```sh
E2E_PORT=3971 NUXT_DATABASE_HOST=127.0.0.1 NUXT_DATABASE_PORT=5544 NUXT_DATABASE_USERNAME=... \
NUXT_DATABASE_PASSWORD=... NUXT_DATABASE_DATABASE=ccc_<agent>_test npx playwright test --config playwright.config.ts
```

**Une base e2e par agent ou par worktree** (`ccc_<agent>_test`, par exemple `ccc_f04_test`, `ccc_lead_test`) : chaque lancement de Playwright passe par `global-setup`, qui remet la base à neuf et **recrée les sessions**. Deux agents sur la même base invalident mutuellement leurs sessions : les pages admin redirigent alors vers `/connexion` et les tests échouent en délai dépassé, sans rapport avec le code testé. Créer sa base une fois, dans le conteneur de développement :

```sh
docker exec ccc-db psql -U ccc -d ccc -c "create database ccc_<agent>_test owner ccc"
```

Contrôle visuel : le pixel perfect porte sur les zones fixes (structure, gabarits, en-tête, pied, typographie). Les zones de données (édition choisie, initiales du compte…) sont masquées des deux côtés par un même aplat (`tests/e2e/visual.util.ts`). Le seuil est de 1 % par zone, et les images d'écart (`visual-results/`) passent en relecture humaine avant merge. Les tests d'une page qui attend une route serveur portent l'annotation `awaiting-route`, qui nomme le ticket back.

### Édition en cours dans la base de test (QA-2, T-QA-03)

Le dump `archives.sql` clôture les 16 éditions, 2026 comprise : sans autre étape, aucun écran ne pourrait montrer une édition en cours (accueil, tableau de bord, saisie des scores, tirages). Après le dump, `prepare-database` (`tests/e2e/helpers/in-progress-edition.ts`) remet donc **l'édition 2026 en phase de poules**, une seule fois et pour tous les tests (aucune mutation propre à un test, décision utilisateur QA-2). Ce ne sont pas des données fictives (ARCH-8) : ce sont les lignes de 2026, rembobinées à un moment de sa saison. **Aucune ligne n'est créée ni supprimée** : uniquement des `UPDATE`, dans une transaction.

| Donnée | État produit |
|---|---|
| Édition 2026 | `POOLS_PLAYING`, `closed_at` vide |
| Tour de poules | `PLAYING` ; les tours de phase finale sont `PENDING` |
| Matchs de phase finale (15) | `SCHEDULED`, sans score ni date de saisie ou de validation |
| Matchs de poule | pour chaque poule, le tiers des matchs à la plus forte séquence (arrondi à l'inférieur) repasse à `SCHEDULED` : 24 sur 72, soit 48 validés |
| Participations de 2026 | statut `IN_POOL`, ni étape finale, ni points, ni rang de poule : pas de champion 2026 |

La règle est la même à chaque exécution : classement des matchs par numéro de séquence décroissant dans chaque poule, valeurs `E2E_IN_PROGRESS_EDITION_CODE`, `E2E_POOL_REWIND_NUMERATOR` et `E2E_POOL_REWIND_DENOMINATOR` dans `tests/e2e/helpers/e2e.const.ts`. La sortie JSON de `prepare-database` indique l'état produit (`inProgressEdition`). Les champs `matches` et `validatedMatches` de cette sortie comptent le dump **avant** la remise en phase de poules ; GET /stats en donne les valeurs après (A16 : 729 matchs joués et 554 avec score dans le dump ; 690 et 515 une fois les 39 matchs à jouer retirés).

`tests/db/in-progress-edition.test.ts` vérifie le déterminisme (deux préparations successives, mêmes ids de matchs programmés), l'absence de création ou de suppression, et la cohérence de ce que l'API calcule pour 2026 (statut, avancement des poules, champion, compteurs d'archive). Les zones visuelles qui lisent 2026 se mesurent sur cet état.

### Tests d'écriture : une édition créée par le test (QA-3)

Un test qui écrit (ajouter ou retirer un inscrit, saisir un score, tirer les poules…) **crée sa propre édition** par l'API réelle d'administration (`POST /editions`, puis les transitions par les routes réelles), jamais sur les archives (2012 à 2026) ni sur 2026 en phase de poules (QA-2). Les compétiteurs dont il a besoin sont créés de même (`POST /competiteurs`) : un test n'écrit jamais sur un profil partagé. Le helper partagé est `tests/e2e/helpers/edition-write.ts`, ses constantes sont dans `tests/e2e/helpers/e2e.const.ts` :

| Fonction | Rôle |
|---|---|
| `createEdition(request, libellé)` | édition en `CREATED`, code généré par le serveur |
| `createCompetitor(request, libellé, surcharges?)` | compétiteur avec compte invité, courriel unique |
| `attachParticipant(request, édition, compétiteur)` | rattachement par la route réelle ; la première inscription fait passer l'édition à `REGISTRATION` |
| `createRegistrationEdition(request, libellé)` | édition en inscriptions avec un premier inscrit (point de départ des tirages, F-11, et des scores, F-08) |
| `selectAdminEdition(context, édition)` | fait de l'édition l'édition de travail des pages `/admin/**` (cookie du sélecteur) |
| `readCapturedMails()` | courriels « envoyés » par le serveur de test |

**Unicité et isolation.** Le serveur génère le code (`2090`, `2090b`… jusqu'à `z`, CE-1) sous verrou (`pg_advisory_xact_lock`) : deux créations simultanées (`fullyParallel`) ne collisionnent jamais, et aucune ne peut reprendre un code d'archive. Seule l'année peut s'épuiser (26 codes par an, 409 `EDITION_CODE_EXHAUSTED`) : elle part d'un hachage du libellé du test dans les années 2050 à 2099 (bornes de l'API : 2000 à 2100 ; archives : 2012 à 2026), soit 1 300 codes par exécution, la base étant remise à neuf à chaque lancement ; une année épuisée passe à la suivante. Donner un libellé distinct à chaque test.

**Ordre d'exécution.** Les éditions créées restent dans la base jusqu'au lancement suivant, et la plus récente devient l'édition active par défaut de l'admin : les specs d'écriture vivent donc dans `tests/e2e/writes/` et forment le projet Playwright `writes`, qui dépend des projets `routes`, `a11y` et `visual` et passe après eux (`--no-deps` pour le lancer seul). Une spec qui lit seulement va dans `a11y/` ou `visual/`. Les zones visuelles qui dépendent d'une écriture (`*.zones.spec.ts`) se mesurent sur l'édition du test, avec les mêmes masques de valeurs que les autres.

**Courriels.** Le serveur lancé par Playwright utilise le transport `capture` (`NUXT_MAIL_TRANSPORT`, `NUXT_MAIL_CAPTURE_FILE`) : aucun SMTP, chaque courriel est une ligne JSON de `test-results/e2e-mail.jsonl` (remis à zéro à chaque lancement). `invitationSent: true` se produit donc pour de vrai ; `false` (SMTP injoignable) n'a pas d'équivalent e2e et se teste en test de composant, `null` est le rattachement d'un profil existant.

### Garde anti-code-serveur dans le navigateur (ARCH-1, ARCH-2, ARCH-12)

`src/utils/` et `src/services/` mêlent code navigateur et code serveur : un service fusionné exporte sa classe `$fetch` et ses fonctions TypeORM. Le build client déclare sans effet de bord les modules serveur (typeorm, pg, reflect-metadata, `src/server/**`, `node:*`), qui sont élagués avec les fonctions serveur inutilisées. Le plugin `clientBundleGuard` fait échouer `nuxt build` si l'un d'eux reste dans un chunk client. `npm run test:bundle` vérifie le résultat octet par octet. Il n'y a aucun scan d'auto-import (`imports.scan: false`) : chaque fichier importe explicitement ce qu'il utilise.

Les schémas zod de validation des entrées vivent dans `src/server/schemas/` (ARCH-13) : ils sont couverts par la garde, et un schéma importé par du code navigateur fait échouer le build. Les stores Pinia sont des composables (`src/composables/useAuthStore.ts`, `useAdminEditionStore.ts`, ARCH-14).

**Limite acceptée (ARCH-12)** : en `nuxt dev`, Vite ne fait pas de tree-shaking. Un service fusionné charge donc TypeORM et les entités dans le navigateur, environ 5,5 Mo mesurés, sans erreur. Cela ne concerne que le développement : en production, la garde de build interdit tout code serveur dans les chunks client.

## Variables d'environnement du serveur

| Variable | Défaut | Rôle |
|---|---|---|
| `NUXT_DATABASE_HOST`, `_PORT`, `_USERNAME`, `_PASSWORD`, `_DATABASE` | aucun | Connexion PostgreSQL (runtime Nitro et CLI TypeORM). |
| `NUXT_CACHE_CLOSED_EDITION_MAX_AGE_SECONDS` | `3600` | `max-age` (secondes) du `Cache-Control: public` des lectures publiques d'une édition `CLOSED`. Une édition en cours répond `no-cache`. |
| `NUXT_RATE_LIMIT_WINDOW_MS` | `60000` | Durée de la fenêtre glissante du limiteur de débit. |
| `NUXT_RATE_LIMIT_MAX_REQUESTS` | `60` | Nombre de requêtes autorisées par IP et par clé de route dans la fenêtre. |
| `NUXT_RATE_LIMIT_COMPETITORS_SEARCH_WINDOW_MS`, `_MAX_REQUESTS` | `60000`, `30` | Réglages propres à la recherche publique `GET /api/v1/competiteurs?q=` (clé `competitors-search`) ; surchargent les valeurs par défaut ci-dessus. |
| `NUXT_RATE_LIMIT_PUBLIC_READ_WINDOW_MS`, `_MAX_REQUESTS` | `60000`, `300` | Budget unique, partagé par toutes les routes publiques en lecture (clé `public-read`) : liste des compétiteurs (hors `?q=`), fiche, face-à-face, éditions et sous-ressources, stats, classements. `/health` et la recherche `?q=` gardent leur clé. |
| `NUXT_PUBLIC_SITE_URL` | `http://localhost:3000` | URL publique du site : base des liens d'invitation (jamais l'en-tête `Host`). À renseigner en production. |
| `NUXT_PUBLIC_SITE_INDEXABLE` | `false` | Indexation par les moteurs de recherche (T-SEO-01). Seul `true` l'ouvre ; toute autre valeur la laisse fermée. **Laisser à `false` sur l'instance de dev**, ne mettre `true` qu'en production. |
| `NUXT_MAIL_HOST`, `_PORT`, `_SECURE`, `_USER`, `_PASSWORD`, `_FROM` | `localhost`, `1025`, `false`, vide, vide, `CCC <no-reply@ccc.local>` | Envoi des invitations par SMTP (nodemailer) : Mailpit en local, fournisseur SMTP en production. |
| `NUXT_RATE_LIMIT_INVITATION_TOKEN_WINDOW_MS`, `_MAX_REQUESTS` | `900000`, `30` | Budget par IP des routes publiques `GET`/`POST /auth/invitation/{jeton}` (clé `invitation-token`). |
| `NUXT_RATE_LIMIT_AVATAR_UPLOAD_WINDOW_MS`, `_MAX_REQUESTS` | `600000`, `10` | Envois d'avatar (`PUT /moi/avatar`, `PUT /competiteurs/{id}/avatar`, clé `avatar-upload`, par IP). Le limiteur passe avant la lecture du corps : un envoi refusé en 429 (avec `Retry-After`) n'est ni lu ni décodé par sharp. |
| `NUXT_TRUST_PROXY_HOPS` | `0` | Confiance proxy pour l'IP client des limites de débit. 0 : adresse de la socket, `X-Forwarded-For` ignoré. N > 0 : l'entrée N de `X-Forwarded-For` en partant de la droite, uniquement si la socket vient de la boucle locale ou d'un réseau privé (`TRUSTED_PROXY_SUBNETS`) ; une chaîne trop courte ou invalide retombe sur la socket. Un client ne peut donc pas choisir son IP en forgeant l'en-tête. Valeur hors 0..5 : refus au démarrage. |
| `NUXT_RATE_LIMIT_MAX_KEYS` | `10000` | Plafond de clés `ip:route` gardées en mémoire ; au-delà, la clé la plus anciennement utilisée est évincée. Les IPv6 sont agrégées par préfixe /64. |

Budget public (M3) : 300 requêtes par minute et par IP, partagées entre toutes les lectures publiques, pour qu'un client ne multiplie pas son budget par le nombre de routes. Les calculs portent sur environ 146 compétiteurs et 729 matchs, donc quelques millisecondes : une limite suffit contre l'abus, sans cache d'agrégats ni logique d invalidation ; les éditions closes ont déjà l'ETag (B-06). Le budget est généreux parce que, le soir du tournoi, le public est souvent derrière une seule IP (wifi du lieu). Derrière un proxy, l'IP lue est celle du proxy tant que `NUXT_TRUST_PROXY_HOPS` n'est pas posé.

Corps des requêtes (M2) : les corps JSON sous `/api` sont plafonnés à 16 Kio (`API_JSON_BODY_MAX_BYTES`). Un `Content-Length` supérieur répond 413 `PAYLOAD_TOO_LARGE` sans lire le corps ; un envoi par morceaux est lu en flux et coupé au plafond. Le limiteur par IP du login passe avant la lecture du corps. Un corps qui n'est pas du JSON n'est pas lu (400). L'upload d'avatar multipart (B-16) a son propre plafond de 2 Mio, lu en flux (voir « Avatars »).

En production (`NODE_ENV=production`), le démarrage échoue si `NUXT_DATABASE_HOST`, `_USERNAME`, `_PASSWORD` ou `_DATABASE` est vide ; le message nomme la variable, jamais sa valeur.

Les réglages du limiteur doivent être des entiers strictement positifs : le serveur refuse de démarrer sinon (le message nomme le réglage fautif). Un `0`, un négatif ou un `NaN` désactiverait sinon le plafond.

Limites connues du limiteur de débit : le plafond `maxKeys` est un LRU en mémoire. Un attaquant disposant de très nombreuses IPv4 distinctes peut faire évincer des compteurs légitimes, qui repartent alors de zéro. Cette limite est inhérente au stockage en mémoire ; un déploiement multi-instance ou exposé exigera un stockage partagé (ticket T-SEC-02). De plus : les compteurs sont en mémoire du processus. Avec plusieurs instances, chacune compte séparément ; l'IP lue est celle de la connexion socket, donc celle du reverse proxy s'il y en a un, sauf si `NUXT_TRUST_PROXY_HOPS` est posé. Le mode de déploiement n'étant pas spécifié, ces limites sont acceptées pour une instance unique.

## API serveur

- Toutes les routes vivent sous `/api/v1/` (`src/server/api/v1/resource.method.ts`).
- `GET /api/v1/health` : `200 { "status": "ok" }` si la base répond à `SELECT 1`, `503 { "status": "unavailable" }` sinon. Aucun détail d'infrastructure n'est exposé.
- Lectures publiques des éditions (`/editions`, `/editions/{id}/…`, `/stats`) : voir `docs/api/editions.md`.
- Classements publics (B-07), calculés à la lecture à partir de `participations.points` figés ; seules les éditions `CLOSED` comptent (A8), ordonnées par `chronological_rank`. Les participations à `points = null` n'entrent pas dans les sommes. Ex aequo : rang partagé (`1, 2, 2, 4`), ordre d'affichage par `displayName`. Les réponses ne portent que `ICompetitorPublic`.
  - `GET /api/v1/classements/acp` : `IRankingRow[]`, `points` = somme des 5 dernières éditions clôturées (RG4) ; `participations`, `average` (RG5) et `titles` (RG6) sont ceux de la carrière.
  - `GET /api/v1/classements/all-time` : `IRankingRow[]`, `points` = somme de toutes les éditions clôturées, `average` = `points` / participations chiffrées.
  - `GET /api/v1/classements/evolution?type=acp|all-time&competiteur={uuid}` : `IRankingEvolutionPoint[]` (RG8, un point par édition clôturée depuis la première participation du joueur ; `[]` s'il n'a aucune participation classée). Sans `competiteur` : `IRankingEvolutionSeries[]` pour tous les joueurs en un seul appel (C5).
  - Erreurs : `type` absent ou hors enum, ou `competiteur` qui n'est pas un UUID : 400 `VALIDATION_FAILED` ; `competiteur` inconnu : 404 `NOT_FOUND`.
- Toute erreur sous `/api/` a la forme `{ statusCode, code, message, details? }` (`IApiError`, codes dans `src/enums/api-error-code.enum.ts`). Les erreurs 5xx portent un message générique ; le détail est dans les logs.
- Chaque réponse porte un en-tête `X-Request-Id` ; les logs sont du JSON en ligne (`event`, `level`, `requestId`, `route`, `durationMs`).
- Les entités TypeORM vivent dans `src/server/db/typeorm/entities/` et sont déclarées dans `src/consts/entities.const.ts` (`ENTITIES`, registre partagé CLI et runtime). Chaque `@Column` doit déclarer son `type` explicitement : le bundle Nitro (esbuild) n'émet pas `emitDecoratorMetadata`.

## Architecture

Les règles d'arborescence font foi dans `CLAUDE.md` (ARCH-1 à ARCH-14), les décisions dans `docs/design/ux/decisions.md`. L'architecture initiale du 2026-10-10, périmée, est archivée dans le dossier Obsidian du projet (« Architecture initiale (2026-10-10) »).

## Routes disponibles

- `/` — accueil public.
- `/competition` — présentation des phases de poules, du bracket et des scores.
- `/players` et `/head-to-head` — annuaire et comparaison des compétiteurs.
- `/rules`, `/variants` et `/hall-of-fame` — contenu public.
- `/admin` — tableau de bord prototype.
- `/admin/competitors`, `/admin/participants`, `/admin/draws`, `/admin/groups`, `/admin/bracket`, `/admin/scores` et `/admin/editions` — vues des modules de gestion.

## Authentification (B-08)

Session serveur en base (table `sessions`, seul le SHA-256 du jeton est stocké) et cookie : `HttpOnly`, `SameSite=Lax`, `Path=/`, `Max-Age` 12 h. La session expire à l'inactivité après 2 h (`last_seen_at`, réécrit au plus une fois par minute ; une session inactive est refusée en 401 puis révoquée) et de façon absolue 12 h après sa création (`SESSION_IDLE_TIMEOUT_SECONDS`, `SESSION_ABSOLUTE_TIMEOUT_SECONDS`, décision SEC-A1). En production il s'appelle `__Host-ccc_session` (préfixe qui impose `Secure`, `Path=/` et aucun `Domain`) ; hors production, en HTTP, `ccc_session` sans `Secure`.

| Route | Accès | Réponse |
|---|---|---|
| `POST /api/v1/auth/login` `{ email, password }` | public, limité par IP et ralenti par compte | 200 `IMe` + cookie ; 401 `INVALID_CREDENTIALS` identique pour email inconnu et mot de passe faux ; 429 avec `Retry-After` (limite par IP, ou délai du compte) |
| `POST /api/v1/auth/logout` | public, idempotent | 204, session révoquée, cookie effacé |
| `GET /api/v1/moi` | authentifié | 200 `IMe` (seule route qui expose `phone`, à son titulaire) |
| `PATCH /api/v1/moi` | authentifié | liste blanche `phone`, `currentPassword` + `newPassword` ; tout autre champ : 400. Un changement de mot de passe révoque les autres sessions (401 `INVALID_CURRENT_PASSWORD` si l'ancien est faux) |

Les écritures dont l'`Origin` (ou `Sec-Fetch-Site`) n'est pas celle du site répondent 403 `FORBIDDEN_ORIGIN`. **Une écriture sans en-tête `Origin` (ni `Sec-Fetch-Site`) est acceptée** (risque accepté, T-SEC-12 L10, décision utilisateur SEC-Q du 2026-11-01) : une telle requête ne vient pas d'un navigateur (scripts, `curl`, tests), qu'un refus bloquerait, et aucun scénario navigateur n'a été identifié ; la défense CSRF repose sur `SameSite=Lax`, qui couvre les requêtes intersites des navigateurs actuels, plus la vérification d'`Origin` quand il est présent. Mots de passe : scrypt (`node:crypto`), 15 caractères minimum (OWASP Authentication Cheat Sheet, sans MFA), 128 maximum. Le limiteur de débit par IP est en mémoire (une instance).

**Cookie `Secure` (T-SEC-04, L3).** L'attribut `Secure` et le préfixe `__Host-` des cookies de session et d'appareil dépendent de `runtimeConfig.auth.secureCookie` (**`NUXT_AUTH_SECURE_COOKIE`**), et non de `NODE_ENV`. Il est **vrai par défaut** ; seule une valeur explicitement fausse (`false` ou `0`) le désactive, toute autre valeur reste vraie. **Ne le désactiver qu'en développement local en HTTP** (sans lui, le navigateur refuse un cookie `Secure` sur `http://`) : en production, un cookie sans `Secure` circulerait en clair.

**Concurrence de scrypt (T-SEC-04, L2).** `hashPassword`, `verifyPassword` et `burnPasswordCheck` passent par un sémaphore global, sans file d'attente : au plus `runtimeConfig.auth.passwordHashConcurrency` (**`NUXT_AUTH_PASSWORD_HASH_CONCURRENCY`**, défaut 2, entier de 1 à 64, vérifié au démarrage) calculs simultanés. Chaque calcul occupe un thread du pool libuv (4 par défaut) et 64 Mio ; le défaut en laisse la moitié libre au système de fichiers et au DNS. Au-delà, la requête reçoit **503 `SERVICE_BUSY` avec `Retry-After`**. À la connexion, la saturation est détectée avant la réservation de la tentative (SEC-A2) : un refus 503 n'allonge pas le délai du compte.

Conséquence pratique : avec 2 calculs simultanés par défaut, une troisième connexion strictement simultanée reçoit un 503 avec `Retry-After: 1` et le client doit réessayer ; il n'y a pas de file d'attente (elle garderait des requêtes ouvertes). Valeur 2, mesurée le 2026-10-21 (node 22, macOS, 15 cœurs, N=2^16, r=8, p=2) : un calcul seul coûte 168 ms (médiane de 8), 2 ou 4 en parallèle 184-185 ms chacun, 8 en parallèle 355 ms chacun (le pool libuv n'en exécute que 4 à la fois). Relever la valeur n'a de sens qu'avec `UV_THREADPOOL_SIZE` relevé en proportion.

**Déploiement (Coolify) : ne jamais positionner `NUXT_AUTH_SECURE_COOKIE=false` sur un déploiement en HTTPS** (ni en production ni en préproduction) ; laisser la variable absente. À reporter dans la documentation de déploiement de T-OPS-01.

**Délai de lecture du corps (T-SEC-04, N3).** Le corps d'une requête JSON doit arriver en `API_BODY_READ_TIMEOUT_MS` (10 s au total, pas un délai d'inactivité) : au-delà, 408 `REQUEST_TIMEOUT` et connexion fermée (anti slowloris). La lecture passe par `readRequestBody(event, { maxBytes, timeoutMs })` (`src/utils/request-body.util.ts`), que le multipart doit réutiliser avec son propre plafond et son propre délai.

Échecs de connexion par compte (SEC-A2, migration M3, colonnes `users.failed_login_count` et `users.throttled_until`) : aucun blocage dur. Jusqu'à 5 échecs consécutifs, aucun délai ; au-delà, un délai de 2^(échecs - 5) secondes, **plafonné à 300 s** (`LOGIN_FREE_FAILURES`, `LOGIN_DELAY_BASE_SECONDS`, `LOGIN_DELAY_MAX_SECONDS`). Pendant le délai, le login répond 429 avec `Retry-After` sans vérifier le mot de passe ; une connexion réussie remet le compteur à zéro. Un email inconnu ne crée aucun état (seule la limite par IP s'applique). **Risque accepté (SEC-A3, décision utilisateur 2026-10-20) : énumération de comptes.** Un 429 de délai ne se produit que pour un compte qui existe. Après 6 échecs sur un même email, un tiers peut donc savoir si cet email a un compte. Aucune parade n'est prévue. Déblocage immédiat par un opérateur : `npm run user:unlock -- <email>`, qui révoque aussi les appareils de confiance du compte.

Cookie d'appareil de confiance (SEC-A4, migration M4, table `login_devices` ; méthode OWASP « Slow Down Online Guessing Attacks with Device Cookies », https://community.owasp.org/Slow_Down_Online_Guessing_Attacks_with_Device_Cookies) : après une connexion réussie, le serveur émet `ccc_device` (`__Host-ccc_device` en production), `HttpOnly`, `SameSite=Lax`, `Secure` en production, 90 jours. Sa valeur est `base64url(JSON{u: id du compte, n: nonce, e: expiration})` suivie d'un HMAC-SHA256 ; le secret vient de **`NUXT_AUTH_DEVICE_COOKIE_SECRET`** (32 caractères minimum, `openssl rand -hex 32`), **obligatoire en production : l'application refuse de démarrer sans lui**. Hors production, un secret aléatoire propre au processus sert de repli. Un cookie valide pour CE compte, dont la ligne existe encore et n'a pas expiré, désigne un appareil reconnu : il n'est pas soumis au délai posé par les clients non reconnus et a son propre compteur d'échecs (mêmes règles : 5 échecs libres, puis 2^(n−5) s plafonnés à 300 s). Un cookie falsifié, expiré, révoqué ou appartenant à un autre compte est traité comme « non reconnu ». La limite par IP s'applique toujours. Au plus 20 appareils par compte (les plus anciens sont supprimés). **Un changement de mot de passe révoque aussi les appareils de confiance** du compte, dans la même transaction que la mise à jour du hash et la révocation des autres sessions (tout ou rien) : un cookie d'appareil volé perd son passe-droit, et l'appareil qui a fait le changement le retrouve à sa prochaine connexion réussie.

**Risque accepté (N1, décision utilisateur 2026-10-21, `docs/design/ux/decisions.md`).** Un attaquant qui possède l'email ET un cookie d'appareil valide (le cookie est `HttpOnly` : il ne peut être volé que sur l'appareil lui-même) obtient un second flux d'essais, avec son propre compteur. Ce flux est ralenti comme les autres (5 essais libres, puis un délai de 2^(n−5) s plafonné à 300 s) et borné par la limite par IP. Un changement de mot de passe révoque tous les appareils de confiance du compte (N2). **Aucun plafond global d'essais par compte n'est appliqué.**

Premier administrateur : `npm run user:create-admin` (email lu sur l'entrée standard, `NUXT_PUBLIC_SITE_URL` requis) crée un compte `INVITED` sans mot de passe et affiche une fois, sur la sortie standard, son lien de première connexion (7 jours, usage unique). Invitations, envoi d'email (SMTP, `NUXT_MAIL_*`) et routes : voir `docs/api/invitations.md`.

**Runbook `ccc-ops user:create-admin` (T-SEC-12, L9).** Le lien affiché est un **secret valable 7 jours** : quiconque le possède devient administrateur. Ne le copier ni dans un ticket, ni dans un chat, ni dans un courriel. Lancer la commande depuis le terminal du conteneur dans Coolify ou avec `docker exec -it`, dans un terminal dont la sortie n'est ni journalisée ni partagée (pas de session enregistrée, pas d'écran partagé), ouvrir le lien tout de suite, et ne pas relancer la commande pour « retrouver » un lien : elle échoue (« Un compte existe déjà pour cet email »). Si le lien est perdu ou exposé avant usage, supprimer le compte `INVITED` de cet administrateur en base, puis recommencer.

## Avatars (B-16)

Contrat complet : [docs/api/avatar.md](docs/api/avatar.md). Routes : `PUT` et `DELETE /api/v1/moi/avatar`, `PUT`, `DELETE` et `GET /api/v1/competiteurs/{id}/avatar` (le `GET` est public).

- La photo est stockée en base (`competitor_avatars`, AV-1), au plus 2 Mio envoyés (`AVATAR_MAX_BYTES`), lus en flux. Type vérifié par signature (JPEG, PNG, WebP), puis ré-encodée par `sharp` : orientation appliquée, 512 px au plus, **EXIF, GPS, XMP et IPTC supprimés**.
- `sharp` est épinglé à `0.35.5` (sans `^` : le binaire natif libvips suit la version). Les binaires sont précompilés par plateforme (`@img/sharp-<os>-<arch>`) : l'image Docker (`node:22-alpine`, musl) installe la variante `linuxmusl`, et Nitro l'embarque dans `.output`.
- **Rollback de la migration `CreateCompetitorAvatars`** : `down` supprime `competitor_avatars` et recrée `competitors.avatar_url` (vide). **Les images téléversées sont perdues.** `up` refuse de s'exécuter si une `avatar_url` est encore renseignée.
- Le dump `src/assets/seeds/archives.sql` ne référence plus `avatar_url` (les 146 valeurs étaient NULL).
- Mentions de licences : `sharp` est sous Apache-2.0 ; `@img/sharp-libvips-*` (libvips) sous LGPL-3.0-or-later, chargée dynamiquement et sans modification (AV-2).
