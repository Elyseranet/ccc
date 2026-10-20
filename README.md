# CCC

Application de gestion du championnat CCC, avec un site public et un back-office organisateur.

Le socle technique utilise Nuxt 4 et Nitro, PostgreSQL et TypeORM. Les premières vues suivent l'export de design fourni : accueil, compétition, compétiteurs, face-à-face, règlement, variantes, Hall of Fame et espace d'administration.

Les vues actuelles sont un prototype de présentation. Elles n'ont pas encore d'authentification ni de persistance métier. Le contenu du classeur historique est chargé dans des tables d'archive ; son rapprochement vers les futures entités métier reste à effectuer avant publication.

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

La commande suivante construit l'application Nuxt et démarre l'application avec PostgreSQL :

```sh
docker compose up --build
```

L'application est disponible sur `http://localhost:3000` et PostgreSQL sur le port configuré par `NUXT_DATABASE_PORT` (5432 par défaut). Les données PostgreSQL restent dans le volume Docker `ccc_db_data`.

Pour arrêter les conteneurs sans supprimer les données :

```sh
docker compose down
```

Compose ne lance pas de migration au démarrage. Ne pas utiliser `docker compose down -v` sauf si la suppression des données PostgreSQL est intentionnelle.

## Développement

```sh
npm run dev
```

## Migrations TypeORM

Les migrations sont stockées dans `server/database/migrations/` et le schéma n'est pas synchronisé automatiquement.

```sh
npm run db:migration:generate -- server/database/migrations/NomMigration
npm run db:migration:run
npm run db:migration:revert
```

Les commandes nécessitent une connexion PostgreSQL valide définie dans l'environnement ou `.env`.
`npm run db:migration:revert` annule la migration la plus récente ; pour la migration d'archive, cela supprime ses deux tables et toutes les lignes qu'elles contiennent.

La CLI génère la migration en JavaScript (elle lit le `data-source` compilé) : la relire, la convertir en `.ts` avec `up` et `down`, puis supprimer le `.js`.

### Schéma métier (M1) et rollback

La migration `CreateDomainSchema` crée `competitors`, `competitor_aliases`, `editions`, `pools`, `rounds`, `participations`, `matches`, `match_sides`, `draws` et `draw_assignments`. Elle n'installe aucune extension PostgreSQL (`gen_random_uuid()` est natif depuis PostgreSQL 13).

`npm run db:migration:revert` supprime ces dix tables et leurs types enum, donc **toutes les données métier, y compris celles importées par la reprise B-04**. L'archive brute (`legacy_workbook_*`) reste intacte : la reprise se rejoue pour reconstruire les données métier.

Les tests d'intégration du schéma (`npm run test:db`) tournent sur une base dédiée dont le nom finit par `_test`. Ils **suppriment et recréent** son contenu. Passer les variables en ligne de commande, sans jamais copier un `.env` :

```sh
NUXT_DATABASE_HOST=127.0.0.1 NUXT_DATABASE_PORT=5544 NUXT_DATABASE_USERNAME=... \
NUXT_DATABASE_PASSWORD=... NUXT_DATABASE_DATABASE=ccc_test npm run test:db
```

### Charger les archives du classeur

Le snapshot `server/database/seeds/data/ccc-workbook.json` conserve les lignes, les valeurs disponibles, les formules et les indices de format des cellules des onglets fournis. L'import crée les tables d'archive si nécessaire et peut être rejoué sans dupliquer une ligne.

```sh
NUXT_DATABASE_HOST=localhost npm run db:seed:legacy
```

Pour produire un snapshot après un nouvel export XLSX :

```sh
python3 scripts/xlsx_to_legacy_json.py "/chemin/vers/export.xlsx" server/database/seeds/data/ccc-workbook.json
```

Les valeurs source sont archivées sans transformer les tableaux de synthèse en données métier normalisées. Le rapprochement des identités et des rencontres reste à faire avant leur exploitation par les écrans du tournoi.

## Tests

```sh
npm run test:run   # tests unitaires (Vitest), sans base de données
npm run test:api   # tests d'intégration d'API (@nuxt/test-utils/e2e), base PostgreSQL dédiée
```

`test:api` construit l'application puis la lance contre une base de test. Les variables de connexion sont passées par l'environnement, jamais depuis `.env` copié ailleurs :

```sh
NUXT_DATABASE_HOST=localhost NUXT_DATABASE_PORT=5432 NUXT_DATABASE_USERNAME=ccc \
NUXT_DATABASE_PASSWORD=... NUXT_DATABASE_DATABASE=ccc_test npm run test:api
```

Le nom de la base doit se terminer par `_test` : sinon la suite refuse de démarrer, pour ne jamais toucher une base réelle.

## Variables d'environnement du serveur

| Variable | Défaut | Rôle |
|---|---|---|
| `NUXT_DATABASE_HOST`, `_PORT`, `_USERNAME`, `_PASSWORD`, `_DATABASE` | aucun | Connexion PostgreSQL (runtime Nitro et CLI TypeORM). |
| `NUXT_CACHE_CLOSED_EDITION_MAX_AGE_SECONDS` | `3600` | `max-age` (secondes) du `Cache-Control: public` des lectures publiques d'une édition `CLOSED`. Une édition en cours répond `no-cache`. |
| `NUXT_RATE_LIMIT_WINDOW_MS` | `60000` | Durée de la fenêtre glissante du limiteur de débit. |
| `NUXT_RATE_LIMIT_MAX_REQUESTS` | `60` | Nombre de requêtes autorisées par IP et par clé de route dans la fenêtre. |
| `NUXT_RATE_LIMIT_COMPETITORS_SEARCH_WINDOW_MS`, `_MAX_REQUESTS` | `60000`, `30` | Réglages propres à la recherche publique `GET /api/v1/competiteurs?q=` (clé `competitors-search`) ; surchargent les valeurs par défaut ci-dessus. |
| `NUXT_RATE_LIMIT_MAX_KEYS` | `10000` | Plafond de clés `ip:route` gardées en mémoire ; au-delà, la clé la plus anciennement utilisée est évincée. Les IPv6 sont agrégées par préfixe /64. |

En production (`NODE_ENV=production`), le démarrage échoue si `NUXT_DATABASE_HOST`, `_USERNAME`, `_PASSWORD` ou `_DATABASE` est vide ; le message nomme la variable, jamais sa valeur.

Les réglages du limiteur doivent être des entiers strictement positifs : le serveur refuse de démarrer sinon (le message nomme le réglage fautif). Un `0`, un négatif ou un `NaN` désactiverait sinon le plafond.

Limites connues du limiteur de débit : le plafond `maxKeys` est un LRU en mémoire. Un attaquant disposant de très nombreuses IPv4 distinctes peut faire évincer des compteurs légitimes, qui repartent alors de zéro. Cette limite est inhérente au stockage en mémoire ; un déploiement multi-instance ou exposé exigera un stockage partagé (ticket T-SEC-02). De plus : les compteurs sont en mémoire du processus. Avec plusieurs instances, chacune compte séparément ; l'IP lue est celle de la connexion socket, donc celle du reverse proxy s'il y en a un. Le mode de déploiement n'étant pas spécifié, ces limites sont acceptées pour une instance unique.

## API serveur

- Toutes les routes vivent sous `/api/v1/` (`server/api/v1/resource.method.ts`).
- `GET /api/v1/health` : `200 { "status": "ok" }` si la base répond à `SELECT 1`, `503 { "status": "unavailable" }` sinon. Aucun détail d'infrastructure n'est exposé.
- Lectures publiques des éditions (`/editions`, `/editions/{id}/…`, `/stats`) : voir `docs/api/editions.md`.
- Toute erreur sous `/api/` a la forme `{ statusCode, code, message, details? }` (`IApiError`, codes dans `shared/enums/api-error-code.enum.ts`). Les erreurs 5xx portent un message générique ; le détail est dans les logs.
- Chaque réponse porte un en-tête `X-Request-Id` ; les logs sont du JSON en ligne (`event`, `level`, `requestId`, `route`, `durationMs`).
- Les entités TypeORM sont déclarées dans `server/database/entities/index.ts` (registre partagé CLI et runtime). Chaque `@Column` doit déclarer son `type` explicitement : le bundle Nitro (esbuild) n'émet pas `emitDecoratorMetadata`.

## Architecture

Voir [ARCHITECTURE.md](./ARCHITECTURE.md) pour les frontières applicatives, invariants métier et décisions confirmées ou encore ouvertes.

## Routes disponibles

- `/` — accueil public.
- `/competition` — présentation des phases de poules, du bracket et des scores.
- `/players` et `/head-to-head` — annuaire et comparaison des compétiteurs.
- `/rules`, `/variants` et `/hall-of-fame` — contenu public.
- `/admin` — tableau de bord prototype.
- `/admin/competitors`, `/admin/participants`, `/admin/draws`, `/admin/groups`, `/admin/bracket`, `/admin/scores` et `/admin/editions` — vues des modules de gestion.
