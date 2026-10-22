# T-ARCH-03 — Schémas dans `src/server/schemas/`, stores dans `src/composables/`

- **Statut** : En cours. Ouvert le 2026-10-22 (décisions ARCH-13 et ARCH-14, `docs/design/ux/decisions.md`).
- **Périmètre** :
  1. Déplacer `src/schemas/*.schema.ts` vers `src/server/schemas/`, à plat, sans sous-dossier.
  2. Déplacer `src/stores/*.store.ts` vers `src/composables/`, renommés selon la convention des composables (`useCamelCase.ts`, par exemple `useAuthStore.ts`). Ce sont toujours des stores Pinia (`defineStore`), seul leur emplacement change. Aucun doublon avec un composable existant : un composable qui ne fait qu'envelopper le store est fusionné avec lui.
  3. Mettre à jour tous les imports, la garde `tests/unit/architecture.test.ts` (ni `stores/`, ni `src/schemas/`), le `CLAUDE.md` du projet et le README.
  4. Garde anti-bundle : un schéma serveur ne doit jamais être importé par du code client. Si un schéma sert aussi côté client, le remonter au chef de projet.
- **Critères** : `test:run`, `typecheck`, l'architecture, `test:bundle`, `test:db`, `test:api` et Playwright (routes, a11y) sont verts, sorties réelles à l'appui ; gitleaks est propre.
- **Impact sur les branches en cours** : les branches qui créent ou modifient des schémas ou des stores devront se reprendre sur ce develop. C'est le cas de la chaîne identité (B-09, B-10, B-16), de B-12, B-17, F-04, F-05, F-00h et F-00n.
