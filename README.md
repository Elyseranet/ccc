# CCC

Application de gestion du championnat CCC, avec un site public et un back-office organisateur.

Le socle technique utilise Nuxt 4 et Nitro, PostgreSQL et TypeORM. Les premières vues suivent l'export de design fourni : accueil, compétition, compétiteurs, face-à-face, règlement, variantes, Hall of Fame et espace d'administration.

Les vues actuelles sont un prototype de présentation. Elles n'ont pas encore d'authentification ni de persistance métier. Le contenu du classeur historique est chargé dans des tables d'archive ; sa reprise vers les entités métier se lance avec `npm run db:import:legacy` (voir plus bas).

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

Les valeurs source sont archivées telles quelles. Leur reprise vers les entités métier est décrite ci-dessous.

### Reprendre l'archive vers les entités métier (B-04)

```sh
npm run db:migration:run   # M1 doit être appliquée
npm run db:seed:legacy     # archive legacy_workbook_*
npm run db:import:legacy   # reprise vers les entités métier
```

La commande lit l'archive la plus récente, construit tout le plan en mémoire puis écrit en **une seule transaction**. Elle est rejouable : chaque écriture est un upsert sur une clé naturelle (`editions.code`, `competitor_aliases.alias`, `matches.legacy_code`, `pools`/`rounds`/`participations`/`match_sides` sur leur clé unique) et un second passage ne change ni les comptes ni les `id`. Elle n'écrit que des éditions `origin = LEGACY_IMPORT` et s'arrête si une édition `APP` porte le même code. Les compétiteurs ne sont créés qu'une fois : un nom corrigé dans l'application survit à un rejeu.

**Fichier de correspondance** : `server/database/seeds/data/legacy-identity-map.json` (décision A5, `docs/tickets/legacy-identity-map.md`). Chaque graphie de l'onglet `scores` absente de `Data` y figure, soit `{ "alias": "...", "competitor": "<nom Data exact>" }`, soit `{ "alias": "...", "create": true }`. Le rapprochement se fait sur la **graphie exacte, casse et espaces compris** : le script refuse, sans rien écrire, toute graphie sans correspondance exacte. Le fichier n'est jamais deviné par le script.

**Rapport** : `.data/reports/legacy-import-report.json` (dossier gitignoré), plus un résumé JSON journalisé. Il contient les comptes par table, les anomalies (2012a et 2012b : N = 16 pour 11 listés, 2017 : 5,76 hors barème, joueurs sans cellule `Data`) et le diff de vérification : les classements ACP et All Time, les rangs, les participations et les titres recalculés par les fonctions de domaine sont comparés au classeur pour les 145 joueurs. Un écart inattendu **annule la transaction** (code de sortie 1) ; le rapport est écrit quand même. Les écarts attendus restent listés avec leur explication : le V/D des compétiteurs fusionnés (la colonne F du classeur est un `COUNTIF` sur le nom) et une égalité exacte à 8,76 que le `RANK` flottant du classeur départage.

**Impact d'un `npm run db:migration:revert` de M1** : il supprime toutes les tables métier, donc tout ce que la reprise a écrit, ainsi que les données saisies depuis dans l'application. L'archive brute reste intacte ; relancer `npm run db:import:legacy` reconstruit uniquement la partie issue du classeur.

```sh
# Tests d'intégration de la reprise (base jetable dont le nom finit par _test, variables en ligne de commande)
NUXT_DATABASE_HOST=127.0.0.1 NUXT_DATABASE_PORT=5544 NUXT_DATABASE_USERNAME=... \
NUXT_DATABASE_PASSWORD=... NUXT_DATABASE_DATABASE=ccc_test npm run test:db
```

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
| `NUXT_RATE_LIMIT_PUBLIC_READ_WINDOW_MS`, `_MAX_REQUESTS` | `60000`, `300` | Budget unique, partagé par toutes les routes publiques en lecture (clé `public-read`) : liste des compétiteurs (hors `?q=`), fiche, face-à-face, éditions et sous-ressources, stats, classements. `/health` et la recherche `?q=` gardent leur clé. |
| `NUXT_RATE_LIMIT_MAX_KEYS` | `10000` | Plafond de clés `ip:route` gardées en mémoire ; au-delà, la clé la plus anciennement utilisée est évincée. Les IPv6 sont agrégées par préfixe /64. |

Budget public (M3) : 300 requêtes par minute et par IP, partagées entre toutes les lectures publiques, pour qu'un client ne multiplie pas son budget par le nombre de routes. Les calculs portent sur environ 146 compétiteurs et 729 matchs, donc quelques millisecondes : une limite suffit contre l'abus, sans cache d'agrégats ni logique d invalidation ; les éditions closes ont déjà l'ETag (B-06). Le budget est généreux parce que, le soir du tournoi, le public est souvent derrière une seule IP (wifi du lieu). Derrière un proxy, l'IP lue est celle du proxy : voir T-SEC-02.

Corps des requêtes (M2) : les corps JSON sous `/api` sont plafonnés à 16 Kio (`API_JSON_BODY_MAX_BYTES`). Un `Content-Length` supérieur répond 413 `PAYLOAD_TOO_LARGE` sans lire le corps ; un envoi par morceaux est lu en flux et coupé au plafond. Le limiteur par IP du login passe avant la lecture du corps. Un corps qui n'est pas du JSON n'est pas lu (400). L'upload d'avatar multipart (B-16) aura son propre plafond.

En production (`NODE_ENV=production`), le démarrage échoue si `NUXT_DATABASE_HOST`, `_USERNAME`, `_PASSWORD` ou `_DATABASE` est vide ; le message nomme la variable, jamais sa valeur.

Les réglages du limiteur doivent être des entiers strictement positifs : le serveur refuse de démarrer sinon (le message nomme le réglage fautif). Un `0`, un négatif ou un `NaN` désactiverait sinon le plafond.

Limites connues du limiteur de débit : le plafond `maxKeys` est un LRU en mémoire. Un attaquant disposant de très nombreuses IPv4 distinctes peut faire évincer des compteurs légitimes, qui repartent alors de zéro. Cette limite est inhérente au stockage en mémoire ; un déploiement multi-instance ou exposé exigera un stockage partagé (ticket T-SEC-02). De plus : les compteurs sont en mémoire du processus. Avec plusieurs instances, chacune compte séparément ; l'IP lue est celle de la connexion socket, donc celle du reverse proxy s'il y en a un. Le mode de déploiement n'étant pas spécifié, ces limites sont acceptées pour une instance unique.

## API serveur

- Toutes les routes vivent sous `/api/v1/` (`server/api/v1/resource.method.ts`).
- `GET /api/v1/health` : `200 { "status": "ok" }` si la base répond à `SELECT 1`, `503 { "status": "unavailable" }` sinon. Aucun détail d'infrastructure n'est exposé.
- Lectures publiques des éditions (`/editions`, `/editions/{id}/…`, `/stats`) : voir `docs/api/editions.md`.
- Classements publics (B-07), calculés à la lecture à partir de `participations.points` figés ; seules les éditions `CLOSED` comptent (A8), ordonnées par `chronological_rank`. Les participations à `points = null` n'entrent pas dans les sommes. Ex aequo : rang partagé (`1, 2, 2, 4`), ordre d'affichage par `displayName`. Les réponses ne portent que `ICompetitorPublic`.
  - `GET /api/v1/classements/acp` : `IRankingRow[]`, `points` = somme des 5 dernières éditions clôturées (RG4) ; `participations`, `average` (RG5) et `titles` (RG6) sont ceux de la carrière.
  - `GET /api/v1/classements/all-time` : `IRankingRow[]`, `points` = somme de toutes les éditions clôturées, `average` = `points` / participations chiffrées.
  - `GET /api/v1/classements/evolution?type=acp|all-time&competiteur={uuid}` : `IRankingEvolutionPoint[]` (RG8, un point par édition clôturée depuis la première participation du joueur ; `[]` s'il n'a aucune participation classée). Sans `competiteur` : `IRankingEvolutionSeries[]` pour tous les joueurs en un seul appel (C5).
  - Erreurs : `type` absent ou hors enum, ou `competiteur` qui n'est pas un UUID : 400 `VALIDATION_FAILED` ; `competiteur` inconnu : 404 `NOT_FOUND`.
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

## Authentification (B-08)

Session serveur en base (table `sessions`, seul le SHA-256 du jeton est stocké) et cookie : `HttpOnly`, `SameSite=Lax`, `Path=/`, `Max-Age` 12 h. La session expire à l'inactivité après 2 h (`last_seen_at`, réécrit au plus une fois par minute ; une session inactive est refusée en 401 puis révoquée) et de façon absolue 12 h après sa création (`SESSION_IDLE_TIMEOUT_SECONDS`, `SESSION_ABSOLUTE_TIMEOUT_SECONDS`, décision SEC-A1). En production il s'appelle `__Host-ccc_session` (préfixe qui impose `Secure`, `Path=/` et aucun `Domain`) ; hors production, en HTTP, `ccc_session` sans `Secure`.

| Route | Accès | Réponse |
|---|---|---|
| `POST /api/v1/auth/login` `{ email, password }` | public, limité par IP et ralenti par compte | 200 `IMe` + cookie ; 401 `INVALID_CREDENTIALS` identique pour email inconnu et mot de passe faux ; 429 avec `Retry-After` (limite par IP, ou délai du compte) |
| `POST /api/v1/auth/logout` | public, idempotent | 204, session révoquée, cookie effacé |
| `GET /api/v1/moi` | authentifié | 200 `IMe` (seule route qui expose `phone`, à son titulaire) |
| `PATCH /api/v1/moi` | authentifié | liste blanche `avatarUrl`, `phone`, `currentPassword` + `newPassword` ; tout autre champ : 400. Un changement de mot de passe révoque les autres sessions (401 `INVALID_CURRENT_PASSWORD` si l'ancien est faux) |

Les écritures dont l'`Origin` (ou `Sec-Fetch-Site`) n'est pas celle du site répondent 403 `FORBIDDEN_ORIGIN`. **Une écriture sans en-tête `Origin` (ni `Sec-Fetch-Site`) est acceptée** : une telle requête ne vient pas d'un navigateur, et la défense CSRF repose sur `SameSite=Lax` plus la vérification d'`Origin` quand il est présent. Mots de passe : scrypt (`node:crypto`), 15 caractères minimum (OWASP Authentication Cheat Sheet, sans MFA), 128 maximum. Le limiteur de débit par IP est en mémoire (une instance).

Échecs de connexion par compte (SEC-A2, migration M3, colonnes `users.failed_login_count` et `users.throttled_until`) : aucun blocage dur. Jusqu'à 5 échecs consécutifs, aucun délai ; au-delà, un délai de 2^(échecs - 5) secondes, **plafonné à 300 s** (`LOGIN_FREE_FAILURES`, `LOGIN_DELAY_BASE_SECONDS`, `LOGIN_DELAY_MAX_SECONDS`). Pendant le délai, le login répond 429 avec `Retry-After` sans vérifier le mot de passe ; une connexion réussie remet le compteur à zéro. Un email inconnu ne crée aucun état (seule la limite par IP s'applique). **Risque accepté (SEC-A3, décision utilisateur 2026-10-20) : énumération de comptes.** Un 429 de délai ne se produit que pour un compte qui existe. Après 6 échecs sur un même email, un tiers peut donc savoir si cet email a un compte. Aucune parade n'est prévue. Déblocage immédiat par un opérateur : `npm run user:unlock -- <email>`, qui révoque aussi les appareils de confiance du compte.

Cookie d'appareil de confiance (SEC-A4, migration M4, table `login_devices` ; méthode OWASP « Slow Down Online Guessing Attacks with Device Cookies », https://community.owasp.org/Slow_Down_Online_Guessing_Attacks_with_Device_Cookies) : après une connexion réussie, le serveur émet `ccc_device` (`__Host-ccc_device` en production), `HttpOnly`, `SameSite=Lax`, `Secure` en production, 90 jours. Sa valeur est `base64url(JSON{u: id du compte, n: nonce, e: expiration})` suivie d'un HMAC-SHA256 ; le secret vient de **`NUXT_AUTH_DEVICE_COOKIE_SECRET`** (32 caractères minimum, `openssl rand -hex 32`), **obligatoire en production : l'application refuse de démarrer sans lui**. Hors production, un secret aléatoire propre au processus sert de repli. Un cookie valide pour CE compte, dont la ligne existe encore et n'a pas expiré, désigne un appareil reconnu : il n'est pas soumis au délai posé par les clients non reconnus et a son propre compteur d'échecs (mêmes règles : 5 échecs libres, puis 2^(n−5) s plafonnés à 300 s). Un cookie falsifié, expiré, révoqué ou appartenant à un autre compte est traité comme « non reconnu ». La limite par IP s'applique toujours. Au plus 20 appareils par compte (les plus anciens sont supprimés). **Un changement de mot de passe révoque aussi les appareils de confiance** du compte, dans la même transaction que la mise à jour du hash et la révocation des autres sessions (tout ou rien) : un cookie d'appareil volé perd son passe-droit, et l'appareil qui a fait le changement le retrouve à sa prochaine connexion réussie.

Premier administrateur : `npm run user:create-admin` (email lu sur l'entrée standard) crée un compte `INVITED` sans mot de passe ; le lien d'invitation qui lui permet d'en définir un arrive avec B-09.
