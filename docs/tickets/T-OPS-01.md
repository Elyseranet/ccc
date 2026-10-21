# T-OPS-01 — Image Docker de production livrable sur Coolify

- **Statut** : **Fermé** — mergé dans `develop` @ `a72f3ac` (voir « Fermeture »).
- **Origine** : demande utilisateur du 2026-10-20 : « générer un fichier docker comme sur tous les projets, pour livrer automatiquement sur Coolify ».
- **Référence interne** : convention des autres projets (i18n-dashboard : `Dockerfile` multi-stage `node:22-alpine`, image **agnostique de l'environnement**, configuration 100 % par variables `NUXT_*` injectées par Coolify ; `curl` installé pour la sonde de santé Coolify ; `HEALTHCHECK` dans l'image ; ADR i18n-dashboard 0001 « environment lives in Coolify env vars »).
- **Inclut T-REL-01** : le build de l'image doit échouer si un endpoint est encore en fixture (`npm run test:release` avant `nuxt build`).

## Attendu
1. `Dockerfile` multi-stage (build → runner) : `npm ci` déterministe (cache BuildKit), `nuxt build`, runner minimal non-root, `curl` + `HEALTHCHECK` sur `GET /api/v1/health`, `PORT` configurable.
2. **Migrations TypeORM au démarrage** (ou étape dédiée documentée) : `migration:run` avant le serveur, échec explicite si la base est injoignable ; jamais de `synchronize`.
3. Commandes d'exploitation disponibles dans l'image : `user:create-admin`, `user:unlock`, `db:import:legacy` (documentées pour `docker exec` / commande Coolify).
4. `docker-compose.yml` de prod (app + Postgres 16, volume, healthchecks) utilisable tel quel en « Docker Compose » Coolify ; aucune valeur secrète par défaut (`${VAR:?…}`).
5. `.dockerignore` vérifié : ni `.env*` (hors `.env.example`), ni `.claude/`, ni `node_modules`, ni `.output`, ni `docs/tickets/F-00-captures/`.
6. README « Déploiement Coolify » : variables requises (DB, `NUXT_SESSION_*`, SMTP, rate limits, cache), domaine, sonde de santé, procédure de première mise en route (migrations, import legacy, création admin).
7. Fermeture de T-REL-01 (build release bloquant sur fixtures) et rappel de T-SEC-02 (proxy de confiance / `X-Forwarded-For` derrière Coolify/Traefik, SSL PostgreSQL) et T-RGPD-01.

## Critères d'acceptation
- `docker build` passe en local ; l'image démarre contre un Postgres jetable, applique les migrations, `GET /api/v1/health` = 200 ; `docker inspect` montre l'utilisateur non-root et le healthcheck.
- Avec un endpoint en fixture, le build échoue (preuve : sortie).
- `grep` dans l'image : aucun `.env`, aucun secret (gitleaks sur le contexte de build).
- Taille de l'image rapportée.

## Fermeture — 2026-10-21

- **Statut** : fermé. `feature/T-OPS-01` @ `de8704e` (rebasée sur `develop` @ `1e7ad2a` par dev-ops) a été mergée dans `develop` au commit `a72f3ac`.
- **Conflit résolu** : il portait sur `docker-compose.yml`. Le secret `NUXT_AUTH_DEVICE_COOKIE_SECRET` est conservé et rendu obligatoire (`:?`). En production, le port est exposé par `expose: "3000"` au lieu d'être publié ; les ports locaux sont définis dans `docker-compose.local.yml`.
- **Vérifié sur `de8704e`** (dev-ops) :
  - `test:run` : 34 fichiers, 365 tests réussis, 1 ignoré. `test:release` : 1/1. `typecheck` : 0 erreur.
  - `docker build` réussi : image d'environ 98 Mo, utilisateur non-root (uid 1000), `HEALTHCHECK` en place.
  - Lancée contre un Postgres jetable, l'image applique ses 5 migrations au démarrage, `/api/v1/health` répond 200 et le conteneur passe `healthy`. Si la base est injoignable, l'entrypoint sort avec le code 1.
  - Garde OPS-3 prouvée : avec `HOME` passé à `delivered: true`, le `docker build` échoue sur `test:release`.
  - e2e release lancés contre le conteneur : 28/28. gitleaks : aucune fuite. `npm ls axios` : vide.
- **Revérifié par le chef de projet sur `develop`** après le merge du garde-fou T-QA-01 (`2913c81`) :
  - `test:run` : 38/38 fichiers exécutés, 389 tests réussis, 1 ignoré, 0 en échec ;
  - `typecheck` : 0 erreur ;
  - `test:release` : 1/1 ;
  - Playwright routes, a11y et visuel : 46/46.
- **Revue de sécurité** sur `develop..95823da` : 0 high, 0 medium, 2 low. Ils sont non bloquants et suivis par [T-OPS-02](T-OPS-02.md).
- **Waiver AUDIT-1** : remédiation suivie par [T-SEC-01](T-SEC-01.md).
- **Reste ouvert ailleurs** : le domaine (OPS-4) ; [T-SEC-02](T-SEC-02.md) (proxy et SSL) ; la variable `NUXT_AUTH_DEVICE_COOKIE_SECRET` à créer dans Coolify ; l'accès de Coolify au dépôt privé (échec du 2026-10-21, voir le BOARD).
