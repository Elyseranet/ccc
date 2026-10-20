# T-SEC-01 — Remédiation npm audit (chaîne Nuxt)

- **Origine** : waiver AUDIT-1 (décision utilisateur 2026-10-20, `docs/design/ux/decisions.md`).
- **Constat** (mesuré sur `develop` @ 0fbc8d9, `npm audit --json`) : 12 high + 2 critical — `@nuxt/devtools`, `@nuxt/nitro-server`, `@nuxt/vite-builder`, `@nuxt/vite-server`, `simple-git`, `@simple-git/argv-parser`, `braces`, `fast-glob`, `globby`, `listhen`, `micromatch`, `nitropack`, `node-forge`, `nuxt`. `npm audit --omit=dev` = 0 (nuxt est en devDependency).
- **À faire** :
  1. Vérifier quels paquets vulnérables se retrouvent réellement dans le bundle `.output/` de production.
  2. Désactiver `@nuxt/devtools` hors dev.
  3. Surveiller les releases Nuxt / Nitro ; monter dès qu'un correctif non cassant existe ; relancer `npm audit`.
- **Fermeture** : `npm audit` à 0 high/critical, ou mesure prouvant qu'aucun paquet vulnérable n'atteint le runtime de prod, validée par l'utilisateur.
