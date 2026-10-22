/**
 * Modules strictement serveur (T-ARCH-01, ARCH-1 et ARCH-2) : ORM, pilote PostgreSQL, métadonnées des décorateurs,
 * tout `src/server/` (entités et DataSource TypeORM compris, ARCH-6) et modules natifs Node. Le build navigateur les déclare sans effet de bord (ils disparaissent
 * quand plus rien ne les référence) et échoue si l'un d'eux reste malgré tout dans un chunk client.
 */
export const SERVER_ONLY_MODULE_PATTERN = /node_modules\/(typeorm|pg|pg-[a-z-]+|pgpass|reflect-metadata)\/|\/src\/server\/|^node:/

/**
 * Empreintes recherchées dans les chunks client par `tests/build/client-bundle.test.ts` : chaînes que la
 * minification conserve (messages et identifiants littéraux) et qui n'existent que dans le code serveur.
 */
export const SERVER_ONLY_BUNDLE_MARKERS = [
  '@reflect-metadata:registry',
  'emitDecoratorMetadata',
  'createQueryBuilder',
  'getRepository',
  'SCRAM-SHA-256',
  'node:crypto',
  'scrypt',
  'legacy_workbook_rows',
  'match_sides'
] as const

export const CLIENT_BUNDLE_GUARD_PLUGIN_NAME = 'ccc:client-bundle-guard'
