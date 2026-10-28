# T-ARCH-03 — Schémas dans `src/server/schemas/`, stores dans `src/composables/`

- **Statut** : **Fermé** (2026-10-22), mergé dans `develop` @ `5efed01` ; voir « Fermeture ».
- **Périmètre** :
  1. Déplacer `src/schemas/*.schema.ts` vers `src/server/schemas/`, à plat, sans sous-dossier.
  2. Déplacer `src/stores/*.store.ts` vers `src/composables/`, renommés selon la convention des composables (`useCamelCase.ts`, par exemple `useAuthStore.ts`). Ce sont toujours des stores Pinia (`defineStore`), seul leur emplacement change. Aucun doublon avec un composable existant : un composable qui ne fait qu'envelopper le store est fusionné avec lui.
  3. Mettre à jour tous les imports, la garde `tests/unit/architecture.test.ts` (ni `stores/`, ni `src/schemas/`), le `CLAUDE.md` du projet et le README.
  4. Garde anti-bundle : un schéma serveur ne doit jamais être importé par du code client. Si un schéma sert aussi côté client, le remonter au chef de projet.
- **Critères** : `test:run`, `typecheck`, l'architecture, `test:bundle`, `test:db`, `test:api` et Playwright (routes, a11y) sont verts, sorties réelles à l'appui ; gitleaks est propre.
- **Impact sur les branches en cours** : les branches qui créent ou modifient des schémas ou des stores devront se reprendre sur ce develop. C'est le cas de la chaîne identité (B-09, B-10, B-16), de B-12, B-17, F-04, F-05, F-00h et F-00n.

## Fermeture — 2026-10-22 (chef de projet)
- Branche `feature/T-ARCH-03` @ `a0a8382`, mergée dans `develop` @ `5efed01` (`--no-ff`, aucun conflit avec F-00o / F-00g bis).
- Contrôles relancés sur l'arbre fusionné :
  - `npm run typecheck` : vert, 0 erreur hors Origam (#1133) ;
  - `npm run test:run` : 42 fichiers, 371 tests verts, 1 ignoré, dont `tests/unit/architecture.test.ts`.
- Suite : la vague 3a back et les tickets front en cours se reprennent sur `5efed01`.
