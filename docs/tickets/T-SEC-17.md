# T-SEC-17 — Base de données : délais de connexion et de requête absents

- **Statut** : En revue, gates vertes (2026-11-12), en attente du merge par le `project-manager`. Ouvert le 2026-11-04 par `backend-lead`, sur demande du `project-manager`. Il fait suite à la revue de sécurité de T-OPS-03 (finding M1, medium).
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

## Gates de merge (backend-lead, 2026-11-12)

Branche `feature/T-SEC-17-db-timeouts`, rebasée sur develop @ `854f249f`, tête vérifiée `b440a570`. Bases `ccc_bl_test` et `ccc_bl_api_test`, variables en ligne de commande, aucun `.env` copié.

- Sur `b440a570` : typecheck vert ; `test:run` 89/89 fichiers, 904 réussis, 1 ignoré, 0 échec ; Playwright complet 356 passés, 0 échec (serveur lancé par Playwright, aucun serveur réutilisé, sous le verrou machine).
- Sur `8a869fc8` (même code, base `79f7fb1a` ; le rebase sur `854f249f` ne touche aucun fichier commun) : `test:db` 22/22 fichiers, 127/127 ; `test:api` 29/29 fichiers, 316/316 ; `npm audit` 0 high, 0 critical ; gitleaks : aucune fuite.
- Revue de sécurité du diff : aucune vulnérabilité à haute confiance. Le 503 ne porte aucun détail du pilote, et les délais passent au pilote comme options de connexion, jamais interpolés dans du SQL.
- Deux défauts de test corrigés pendant les gates :
  - `holdLock` renvoyait une promesse aplatie par la fonction async, si bien que le cas « attente de verrou » n'attendait rien ;
  - les serveurs « trou noir » bloquaient `afterAll` (60 s en `test:db`, 300 s en `test:api`) tant qu'un socket restait ouvert ; un helper partagé les détruit d'abord.
- Vérifié à la main dans psql (PostgreSQL 16.13) : une attente de verrou est bien annulée par `statement_timeout`.
