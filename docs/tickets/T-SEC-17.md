# T-SEC-17 — Base de données : délais de connexion et de requête absents

- **Statut** : À faire. Ouvert le 2026-11-04 par `backend-lead`, sur demande du `project-manager`. Il fait suite à la revue de sécurité de T-OPS-03 (finding M1, medium).
- **Origine** : défaut antérieur à T-OPS-03, un peu aggravé par lui, puisque la sonde de santé fait désormais une requête de plus sur la base.

## Constat (d'après la revue, à revérifier au traitement)

- Les options de la `DataSource` (`src/server/db/typeorm/data-source-options.ts`, `src/utils/database-config.util.ts`) ne fixent **aucun délai** : ni de connexion, ni de requête, ni d'instruction côté PostgreSQL. Je n'ai trouvé par grep aucun `connectionTimeoutMillis`, `query_timeout` ni `statement_timeout`.
- Une base lente ou injoignable peut donc faire attendre une requête sans borne, y compris `GET /api/v1/health`, appelée toutes les 30 s par le `HEALTHCHECK` et par Coolify. Les requêtes s'accumulent, et la sonde ne répond ni 200 ni 503 dans son propre délai (5 s).

## Correctif proposé

- Dans les options passées au pilote `pg` (`extra`) : `connectionTimeoutMillis`, `query_timeout` et `statement_timeout` autour de **3 s**, en constantes dans `src/consts/`. La valeur exacte est à justifier au traitement par rapport aux requêtes les plus lourdes, par exemple les classements et `loadEditionSummaries`.
- Vérifier que la sonde répond 503 dans son délai quand la base ne répond pas. Le test existant `health-database-down.test.ts` couvre une base injoignable, pas une base lente.

## Critères d'acceptation

- [ ] Tests : base injoignable et base lente (par exemple un `pg_sleep` au-delà du délai) donnent une erreur bornée, sans attente sans fin, et la sonde répond 503 en moins de 5 s.
- [ ] Les requêtes réelles les plus lourdes sur `archives.sql` restent sous le délai retenu, avec la mesure à l'appui.
- [ ] Une passe `test:api` complète verte.
