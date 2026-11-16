/** Sous-commande de `run-migrations-cli.util.ts` (appelée par `ccc-ops migrate` et `ccc-ops migrate:revert`). */
export enum MIGRATION_COMMAND {
  UP = 'up',
  REVERT = 'revert',
}
