# T-ARCH-05 — Rebaser les branches gelées sur le monorepo

- **Statut** : À faire (2026-11-16). Suite de [T-ARCH-04](T-ARCH-04.md) (merge `afd19b80`).
- **Décision utilisateur (2026-11-16)** : les chantiers ouverts sont gelés pendant la migration, puis rebasés sur la nouvelle arborescence quand ils reprennent.
- **Branches concernées** :
  - `feature/T-A11Y-01-should-3-v2` (lot 3 d'accessibilité S3, S10, S16 ; F-45 en dépend), avec ses maquettes `feature/T-A11Y-01-should-3`, `feature/A11Y-S10-underline-mockup-v2`, `feature/A11Y-S16-sitemap-mockup`, `feature/A11Y-S3-afficher-mockup` ;
  - `feature/F-30-draws-remainder` (F-30, F-46), avec `feature/F-30-dialog-mockup`, `scratch/F-30-text-footer`, `scratch/F-30-dialog-theme` et les worktrees `dev-f30d`, `dev-f30t`, `dev-f30u` (modifications non commitées) ;
  - `feature/F-18-correction-mockup` (F-18).
- **À faire** : au moment de la reprise de chaque chantier, rebaser sur `develop`. T-ARCH-04 a fait des renommages purs vers `packages/web/` (`git log --follow` les suit). Puis `npm ci` à la racine du worktree et gates (typecheck, `test:run`).
- **Critères** : chaque branche reprise est rebasée et verte avant son merge.
