# T-SEC-18 — Montée de nuxt 4.6.1 vers 4.6.3 (trois avis moderate dans le runtime de production)

- **Statut** : À faire. Ouvert le 2026-11-04 par `backend-lead`, à la demande du `project-manager`. La montée de patch est la seule correction possible : le `project-manager` n'a pas eu besoin de la soumettre à l'utilisateur.
- **Origine** : remesure de T-SEC-01 du 2026-11-04 (point « 2026-11-04 »).
- **Affectation** : `dev-b10`, après le merge de la vague T-SEC-08/10 et T-OPS-03.
- **Worktree** : `../CCC-T-SEC-18`, branche `feature/T-SEC-18-nuxt-4.6.3`, avec son propre `npm ci`.

## Constat

- `nuxt` 4.6.1 est installé. Comme c'est une devDependency, `npm audit --omit=dev` ne le compte pas. Son runtime et celui de nitro sont pourtant **bundlés dans `.output/server`**, donc ils tournent en production.
- Avis visés, tous moderate, mesurés sur develop @ 28544ad :
  - **GHSA-9v7c-q64q-vv33** : des segments `..` dans le chemin contournent les vérifications de chemin de `server/middleware` et les route rules des pages. Plage concernée : nuxt de 4.6.0 à moins de 4.6.3, et `@nuxt/nitro-server`.
  - **GHSA-vjh5-4x84-xrqp** : les route rules (`redirect`, `headers`, `proxy`, `ssr`) sont ignorées pour une variante de casse quand le routage est insensible à la casse. Plage : moins de 4.6.2.
  - **GHSA-xfq5-w38q-pc2x** : les server islands rendent l'entrée de `useHeadSafe` sans assainissement. Plage : moins de 4.6.2.
- `nuxt@4.6.3` est publié sur npm (`npm view nuxt@4.6.3 version`).
- Exposition de CCC à GHSA-9v7c : raisonnement sur le code, **non testé**. `src/server/middleware/10.auth.ts` sort si `event.path` ne commence pas par `/api`. Un contournement laisse `event.context.user` vide, et `requireUser` / `requireRole` répondent 401. Le contournement ferme donc l'accès au lieu de l'ouvrir. Il faut le vérifier par une requête réelle, avant et après la montée.

## À faire

1. Monter `nuxt` à **4.6.3, version exacte**, dans `package.json`, et régénérer le lockfile.
2. Relever et justifier les autres paquets que la montée fait bouger dans le lockfile, en particulier `@nuxt/nitro-server` et `nitropack`.
3. Vérifier `npm ls axios`, qui doit rester vide.
4. Relancer `npm audit --json` : les trois GHSA ci-dessus doivent disparaître. Donner les compteurs avant et après, paquet par paquet.
5. Test de régression de GHSA-9v7c, dans `tests/api/` :
   - une requête vers une route admin par un chemin à segments `..` (forme exacte selon l'avis) renvoie 401 sans session ;
   - une écriture cross-origin sur ce même chemin est refusée par la garde CSRF.

## Critères d'acceptation (tous dans une fenêtre confirmée par le frontend-lead)

- [ ] `nuxt build` vert, et `clientBundleGuard` sans erreur.
- [ ] `npm run test:run` vert.
- [ ] `npm run test:api` complet vert, sur un Postgres `--rm` puis `rm -fv`, sans exclure de test.
- [ ] Playwright complet du front vert (frontend-lead), sans régression de zone.
- [ ] `npm run test:release` vert.
- [ ] Preuve Docker : l'image se construit, démarre, et `/api/v1/health` répond 200 avec la version.
- [ ] `npm audit --json` : les trois avis ont disparu, et aucun nouveau high ni critical n'apparaît en production. L'audit de production **inclut nuxt** (voir T-SEC-01).
- [ ] gitleaks propre, typecheck vert.
