# T-SEC-01 — Remédiation npm audit (chaîne Nuxt)

- **Origine** : waiver AUDIT-1 (décision utilisateur 2026-10-20, `docs/design/ux/decisions.md`).
- **Constat** (mesuré sur `develop` @ 0fbc8d9, `npm audit --json`) : 12 high + 2 critical — `@nuxt/devtools`, `@nuxt/nitro-server`, `@nuxt/vite-builder`, `@nuxt/vite-server`, `simple-git`, `@simple-git/argv-parser`, `braces`, `fast-glob`, `globby`, `listhen`, `micromatch`, `nitropack`, `node-forge`, `nuxt`. `npm audit --omit=dev` = 0 (nuxt est en devDependency).
- **À faire** :
  1. Vérifier quels paquets vulnérables se retrouvent réellement dans le bundle `.output/` de production.
  2. Désactiver `@nuxt/devtools` hors dev.
  3. Surveiller les releases Nuxt / Nitro ; monter dès qu'un correctif non cassant existe ; relancer `npm audit`.
- **Fermeture** : `npm audit` à 0 high/critical, ou mesure prouvant qu'aucun paquet vulnérable n'atteint le runtime de prod, validée par l'utilisateur.

## Point 2026-10-28 (chef de projet) — **laissé ouvert**
- Remesure : 12 vulnérabilités (4 low, 3 moderate, 3 high, 2 critical), toutes dans la chaîne de développement. `--omit=dev` = 0. Le lockfile n'a pas changé depuis a90f586 : c'est la base d'avis qui a bougé. `undici` (high) entre dans la liste.
- Détail : `decisions.md`, « AUDIT-1 — remesure ».
- Reste : suivre les correctifs Nuxt et retirer le waiver quand la chaîne de développement est propre.

## Point 2026-11-04 (backend-lead) — **laissé ouvert**
- **Remesure** : `npm audit --json` sur `develop` @ 28544ad, avec le lockfile de develop dans un répertoire vierge, sans `npm ci`. Résultat : **23 vulnérabilités**, soit 3 low, 15 moderate, 3 high et 2 critical, contre 12 au point du 2026-10-28. `--omit=dev` : 3 moderate (glob, minimatch, typeorm), déjà suivis dans T-SEC-14.
- **Le lockfile n'a pas bougé depuis le 2026-10-28.** Son dernier changement est 964b40c, le 2026-10-22 (sharp). Les 11 vulnérabilités de plus viennent donc de la base d'avis. Correction du point du 2026-10-28 : il disait le lockfile inchangé depuis a90f586, or cce5635 et 964b40c l'ont modifié le 2026-10-22, avant cette mesure.
- **High et critical** : la liste n'a pas changé depuis le 2026-10-28. Ce sont `@nuxt/devtools` (high), `simple-git` et `@simple-git/argv-parser` (critical), `node-forge` (high) et `undici` (high).
- **Low et moderate** : le point du 2026-10-28 ne nommait pas les paquets, donc on ne peut pas faire de comparaison paquet par paquet (Je ne sais pas lesquels sont nouveaux). Liste du jour :
  - low : `@rollup/plugin-node-resolve`, `deepmerge`, `serialize-javascript` ;
  - moderate : `@nuxt/nitro-server`, `@nuxt/vite-builder`, `@vercel/nft`, `@vue/test-utils`, `archiver`, `archiver-utils`, `editorconfig`, `glob`, `js-beautify`, `minimatch`, `nitropack`, `nuxt`, `seroval`, `typeorm`, `zip-stream`.
- **Ce qui atteint le runtime** (point 1 de « À faire ») : mesure sur un `.output` construit le 2026-11-04 avec le même lockfile, dans le worktree de dev-b10. On a cherché les noms de paquets dans `.output/server/node_modules` et dans les `.mjs` bundlés.
  - `undici`, `node-forge`, `simple-git`, `seroval`, `serialize-javascript` et `deepmerge` sont **absents**.
  - `glob` 10.5.0 et `minimatch` 9.0.9 sont présents, via typeorm (T-SEC-14).
  - **Limite** : `--omit=dev` ne voit pas le code de `nuxt` et de `nitropack`, parce que `nuxt` est une devDependency. Ce code est pourtant **bundlé dans `.output/server`**. Les avis moderate suivants portent donc sur du code qui tourne en production :
    - GHSA-9v7c-q64q-vv33 : des segments `..` contournent les vérifications de chemin de `server/middleware` et les route rules des pages (nuxt de 4.6.0 à moins de 4.6.3) ;
    - GHSA-vjh5-4x84-xrqp : les route rules sont ignorées pour une variante de casse quand le routage est insensible à la casse (moins de 4.6.2) ;
    - GHSA-xfq5-w38q-pc2x : les server islands avec `useHeadSafe` (moins de 4.6.2).
  - Version installée : `nuxt` 4.6.1.
- **Exposition de CCC à GHSA-9v7c** : c'est un raisonnement sur le code, je ne l'ai **pas testé**. `10.auth.ts` sort si `event.path` ne commence pas par `/api`. Si un chemin à `..` évite ce middleware tout en atteignant une route `/api`, `event.context.user` n'est pas posé. `requireUser` et `requireRole` refusent alors la requête en 401. Le contournement ferme l'accès au lieu de l'ouvrir. Nos route rules ne font que des redirections. Une vérification réelle par requête reste à faire.
- **Correctif disponible** : `nuxt` 4.6.3 corrige les trois avis. C'est une montée de patch (4.6.1 vers 4.6.3) sur la chaîne qui produit le bundle de production. Elle demande un ticket avec `nuxt build`, test:api et Playwright.
