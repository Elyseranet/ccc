# T-QA-08 — Tests `tests/nuxt/front` en délai dépassé (5 s) sous forte charge

- **Statut** : À faire. Ouvert le 2026-11-05 par `backend-lead`, à la demande du `project-manager`.
- **Pilote proposé** : `qa-tester`, avec le `frontend-lead`, propriétaire de ces tests.
- **Distinct de T-QA-07** : T-QA-07 vise les tests d'API SEC-A2 (`tests/api/auth.test.ts`, vrais logins et scrypt). Ici, ce sont des tests unitaires d'environnement Nuxt dans Vitest, sans base de données.
- **Distinct de T-QA-01** : T-QA-01 concerne des échecs juste après modification de fichiers, avec une hypothèse de cache froid. Ici, les échecs coïncident avec une charge machine mesurée.

## Constat (rapports de dev-b10 et dev-b15, 2026-11-05)

- Pendant `npm run test:run`, sans variable DB, sur `feature/T-OPS-03-r4` @ 22fd0fd : 7 fichiers et 2 tests en échec au premier passage, dont `tests/nuxt/front/admin-more.test.ts` (« Test timed out in 5000ms ») et `tests/nuxt/front/players.test.ts`.
- **Load average de 29 à 35** au même moment (mesure backend-lead : 29,52 / 32,24 / 21,46 à 14:06). La charge venait surtout d'un Playwright d'un autre projet sur la même machine.
- La relance complète est verte, sans exclusion : 75 fichiers passés, 1 ignoré, 753 tests passés.
- dev-b15 rapporte les mêmes délais dépassés sur ces deux fichiers.

## À faire

1. Reproduire sous charge contrôlée, par exemple `stress-ng` ou une boucle CPU en parallèle, et relever les tests et les étapes lentes (montage, `mountSuspended`, import de `.nuxt`).
2. Choisir une correction en le justifiant :
   - réduire le coût du test ;
   - fixer un `testTimeout` explicite et motivé pour le projet `nuxt` de Vitest ;
   - limiter `maxWorkers`.
   Ne pas se contenter d'une relance verte.
3. Critère de fermeture : 10 passes de `test:run` complètes, sans exclusion, dont 5 sous une charge contrôlée (load ≥ 20), 0 échec.
