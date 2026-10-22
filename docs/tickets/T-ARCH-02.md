# T-ARCH-02 — Import d'un service fusionné dans l'environnement nuxt de Vitest

- **Statut** : **Fermé** (2026-10-22), cause environnementale ; voir « Fermeture ».
- **Branche** : `feature/T-ARCH-02` depuis `d7a5426` (develop).

## Signalement
Dans le projet Vitest `front` (environnement `nuxt`), importer un service fusionné (ARCH-2), par exemple `CompetitorService`, échouerait avec « SyntaxError: Invalid or unexpected token ». F-00h et F-05 contournent avec un `vi.mock` du service (`tests/nuxt/front/competitor-composables.test.ts`, commentaire « Retirer ce mock à la clôture de T-ARCH-02 »).

## Constat (mesures du 2026-10-22, worktree de l'architecte, `node_modules` propre au worktree, Node v22.22.2)
1. Reproduction minimale commitée : `tests/nuxt/front/merged-service-import.test.ts`. Elle importe `CompetitorService`, `EditionService` et `RankingService` par l'alias `~/` et `CompetitorService` par chemin relatif, sans mock. Résultat sur `d7a5426` : **« Test Files 1 passed (1), Tests 1 passed (1) »**.
2. Code de F-00h (`6e9e810`) appliqué sur `d7a5426`, mock retiré de `competitor-composables.test.ts` : **aucune SyntaxError**. Le service réel est importé. Trois tests échouent pour une raison fonctionnelle et non de chargement : sans mock, les appels partent vers l'API réelle (« expected vi.fn() to be called », « expected 404 to be 400 »). Projet `front` complet dans cet état : aucune occurrence de « SyntaxError » ni de « Invalid or unexpected token ».
3. L'hypothèse « le transformeur de Vitest ne gère pas les décorateurs dans l'environnement nuxt » **n'est pas vérifiée** dans cet environnement : les entités à décorateurs se chargent.
4. Différence d'environnement relevée : les worktrees de F-00h (`review-F-00h`) et de F-05 (`agent-a70ac359346e804a8`) ont un `node_modules` **symlinké** vers celui de la copie principale. Les caches `node_modules/.cache/{nuxt,vite,jiti}` y sont donc partagés entre worktrees de branches différentes. Les versions de l'outillage sont identiques des deux côtés (vite 8.3.4, rolldown 1.2.13, vitest 5.0.5, nuxt 4.6.1, @nuxt/test-utils 4.3.4, typescript 6.0.3) et les `package-lock.json` sont identiques. « Invalid or unexpected token » est le message de V8 sur un `@` de décorateur non transformé : le module d'entité aurait été exécuté par Node sans passer par la transformation de Vite. Ceci reste une **hypothèse**, à vérifier dans l'environnement qui échoue.

## À faire
- Obtenir du front-lead la commande exacte, le worktree et la pile complète de l'erreur (fichier et ligne).
- Lancer `tests/nuxt/front/merged-service-import.test.ts` dans l'environnement qui échoue. S'il échoue là-bas et passe ici, la cause est environnementale (`node_modules` et caches partagés), pas une limite de la fusion.
- Selon le résultat : corriger la config ou l'environnement, puis retirer le `vi.mock` de F-00h et de F-05.

## Critères d'acceptation
- [ ] Cause établie, avec reproduction minimale (le test ci-dessus, et la pile d'erreur de l'environnement qui échoue).
- [ ] Le test minimal passe dans l'environnement des développeurs front.
- [ ] `test:run`, `typecheck` et `test:bundle` verts ; la garde anti-bundle tient.

## Fermeture — 2026-10-22 (chef de projet)
- **Cause** : elle vient de l'environnement, pas du code. L'erreur « SyntaxError: Invalid or unexpected token » à l'import statique d'une entité TypeORM n'apparaissait que dans le worktree de dev-f05 (`agent-a70ac359346e804a8`), dont le `node_modules` était un lien symbolique vers celui de la copie principale.
- **Mesures** :
  - architecte, worktree propre : test minimal 1/1, aucune SyntaxError sur tout le projet front ;
  - front-lead, même commit `ac1b265`, `node_modules` également en lien symbolique, dans un autre worktree : 1/1. Le lien seul ne suffit donc pas, et l'état exact du cache en cause n'est pas établi ;
  - dev-f05, worktree neuf (`npm ci`, ni lien ni copie) : test de `41eab84` à 1/1, son test minimal à 1/1, `api-routes` et `admin-more` à 13 tests verts.
- **Suites** :
  - le `vi.mock` de contournement est retiré de F-00h (`2158d28`) ;
  - le test de non-régression `tests/nuxt/front/merged-service-import.test.ts` entre dans `develop` (cherry-pick de `41eab84`) ;
  - règle ajoutée au `CLAUDE.md` du projet : chaque worktree d'agent a son propre `node_modules` (`npm ci`), sans lien symbolique.
- Aucune configuration n'a été modifiée.
