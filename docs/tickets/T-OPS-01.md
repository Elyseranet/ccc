# T-OPS-01 — Image Docker de production livrable sur Coolify

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
