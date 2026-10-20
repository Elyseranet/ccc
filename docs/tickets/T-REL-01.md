# T-REL-01 — Interdire un build de production sur fixtures

- **Origine** : revue sécurité de F-00 (`a5e04e4`, 2026-10-20), constat HAUT H1.
- **Constat** : les 13 endpoints de `app/consts/api-sources.const.ts` sont en `API_SOURCE.FIXTURE` et se retrouvent dans le build `.output`. La garde `tests/nuxt/front/api-sources.release.test.ts` ne tourne qu'avec `RELEASE_BUILD=true` (`npm run test:release`) ; ni le `Dockerfile` ni aucun script de build ne l'appellent.
- **Impact** : une release servirait de fausses données et un faux `/moi`.
- **Correctif** : exécuter `npm run test:release` avant `nuxt build` dans le `Dockerfile` (ou un `prebuild` dédié release) ; documenter dans le README les prérequis de release ; en build release, retirer la branche « test » de `isFixtureSelectionAllowed` (constat BAS B2).
- **Fermeture** : un build release échoue tant qu'un endpoint est en fixture (preuve : sortie du build).
