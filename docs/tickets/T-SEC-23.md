# T-SEC-23 — Remédiation npm audit : 11 high, 4 moderate (dépendances de production)

- **Statut** : Ouvert (2026-11-18). Remédiation sur `fix/T-SEC-23-audit` : `nuxt` ^4.6.4, `typeorm` ^1.1.3, `@nuxt/cli` 4.0.3 (lockfile) ; reste 1 avis high sans correctif (picomatch GHSA-fc5q-39xc-vjpf), dérogé jusqu'au 2026-12-17 : voir `docs/security-waivers.md` (SW-1, décision utilisateur 2026-11-18).
- **Constat** : `npm audit --omit=dev` sur develop (`8d8ec512`) : 15 vulnérabilités (11 high, 4 moderate, 0 critical) — `@nuxt/kit`, `@pinia/nuxt`, `vue-router`, `vite`, `picomatch`, `tinyglobby`, `typeorm` (moderate), etc. Préexistantes à B-30 (nouveaux avis publiés), relevées par dev-b30.
- **Règle** : pre-delivery — zéro high / critical avant tout passage sur main ; toute dérogation est approuvée par l'utilisateur, datée, documentée, avec ticket de suivi.
- **Décision utilisateur (2026-11-18)** : traiter tout de suite, en parallèle.
- **Attendu** : montées de version corrigées (non cassantes d'abord : `npm audit fix` sans `--force`, puis montées ciblées), pas d'`overrides` sans justification ; pour un avis sans correctif publié (ex. picomatch GHSA-fc5q-39xc-vjpf, déjà dérogé côté Origam jusqu'au 2026-12-17), proposer une dérogation datée à l'utilisateur. Vérifier `npm ls axios` vide.
- **Critères** : `npm audit --omit=dev` : 0 high / 0 critical (hors dérogations approuvées) ; passe e2e complète verte ; typecheck, `test:run`, `test:release`, `test:bundle`, test:api, test:db verts ; build Docker de prod OK.
