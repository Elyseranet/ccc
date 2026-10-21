# T-REL-01 — Interdire un build de production sur fixtures

- **Origine** : revue sécurité de F-00 (`a5e04e4`, 2026-10-20), constat HAUT H1.
- **Constat** : les 13 endpoints de `app/consts/api-sources.const.ts` sont en `API_SOURCE.FIXTURE` et se retrouvent dans le build `.output`. La garde `tests/nuxt/front/api-sources.release.test.ts` ne tourne qu'avec `RELEASE_BUILD=true` (`npm run test:release`) ; ni le `Dockerfile` ni aucun script de build ne l'appellent.
- **Impact** : une release servirait de fausses données et un faux `/moi`.
- **Correctif** : exécuter `npm run test:release` avant `nuxt build` dans le `Dockerfile` (ou un `prebuild` dédié release) ; documenter dans le README les prérequis de release ; en build release, retirer la branche « test » de `isFixtureSelectionAllowed` (constat BAS B2).
- **Fermeture** : un build release échoue tant qu'un endpoint est en fixture (preuve : sortie du build).

## Fermeture — 2026-10-21

- **Statut** : fermé par [T-OPS-01](T-OPS-01.md), mergé dans `develop` au commit `a72f3ac`. Le critère est appliqué **par page livrée**, conformément à la décision OPS-3 (`docs/design/ux/decisions.md`) : un build de production échoue dès qu'une page marquée `delivered: true` consomme un endpoint en fixture.
- **Preuve** : `HOME` a été passé à `delivered: true` à titre de test. `docker build` échoue alors à `RUN npm run test:release` avec le message « aucune page livrée ne consomme un endpoint en FIXTURE … expected [ { page: '/', endpoint: 'ME' }, …(6) ] to deeply equal [] » et le code de sortie 1.
- **Les pages non livrées répondent 404 en production.** C'est vrai aussi avec `?fixture=` (8 requêtes vérifiées dans le conteneur).
- **B2** : `isFixtureSelectionAllowed` vaut `import.meta.dev || import.meta.test`, et le bundle de production le compile en `()=>!1`.
- **Limite** : la même fonction n'a pas été relue dans le bundle serveur.
