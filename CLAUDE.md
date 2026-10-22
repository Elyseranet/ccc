

## Worktrees d'agents (T-ARCH-02, 2026-10-22)

- Chaque worktree a **son propre `node_modules`**, installé par `npm ci`. **Pas de lien symbolique** vers celui de la copie principale : les caches partagés entre branches ont provoqué de faux échecs Vitest (« SyntaxError: Invalid or unexpected token » sur les entités TypeORM).
