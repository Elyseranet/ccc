# T-ARCH-04 — Passer CCC en monorepo npm workspaces (`packages/web`)

- **Statut** : En revue (2026-11-16, branche `feature/T-ARCH-04-monorepo`, découpages 1 à 3 faits ; 4 et 5 restent après merge). Branches soldées le 2026-11-16 : 97 worktrees et 118 branches locales retirés (déjà mergés, intégrés ou remplacés, tri en lecture seule puis accord de l'utilisateur) ; aucune branche distante touchée. Démarre après le merge de F-48. Chantiers gelés, à rebaser après la migration (décision utilisateur) : lot 3 d'accessibilité (`feature/T-A11Y-01-should-3-v2`, F-45) et F-30 (`feature/F-30-draws-remainder`, F-46) ; maquette F-18 (`feature/F-18-correction-mockup`).
- **Demande** (utilisateur, 2026-11-16) : mettre CCC au même format que Elysera, origam et i18n-dashboard (monorepo), en gardant l'arborescence interne `src/` (ARCH-1 à ARCH-15).
- **Étude** : rapport de l'architect du 2026-11-16 (comparatif des trois projets, plan fichier par fichier, impact Coolify).
- **Décisions utilisateur (2026-11-16)** :
  - Q1 : package `packages/web`, nom npm `@ccc/web` ; racine `ccc`, `workspaces: ["packages/*"]`, npm (pas pnpm).
  - Q2 : `Dockerfile` et `docker/` restent à la racine ; contexte de build = racine ; Coolify inchangé (Base Directory `/`, Dockerfile Location `/Dockerfile`).
  - Q3 : `tests/` et `scripts/` dans `packages/web/`.
  - Q4 : solder les branches ouvertes avant la migration (tri en cours).
- **Découpage** :
  1. Migration atomique (`git mv` vers `packages/web/` : `src/`, `public/`, `tests/`, `scripts/`, `nuxt.config.ts`, `.nuxtrc`, tsconfig, configs vitest et playwright ; `package.json` racine et package ; lock régénéré ; chemins en dur : `scripts/gen-mockup-tokens.mjs`, `scripts/typecheck.util.mjs`). Non parallélisable.
  2. `Dockerfile` (modèle Elysera : `npm ci --workspaces --include-workspace-root`, `npm run build --workspace=packages/web`), `.dockerignore` (`packages/*/node_modules`), `docker/ccc-ops.sh`, seed `archives.sql`. Mesurer `npm ci --omit=dev` avec workspaces.
  3. README et `CLAUDE.md` CCC (chemins `packages/web/src/…`). Les tickets archivés ne sont pas réécrits.
  4. Redéploiement Coolify dev et contrôle `/api/v1/health`.
  5. Réaligner les worktrees restants (`npm ci` à la racine).
- **Critères** : typecheck, `test:run`, `test:release`, `test:bundle` verts ; build Docker local OK ; dev redéployé sain ; `architecture.test.ts` adapté.
