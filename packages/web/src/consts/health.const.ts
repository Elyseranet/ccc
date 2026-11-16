/** Version déployée acceptée dans la réponse : un SHA de commit, un tag ou un numéro (jamais une phrase ni une URL). */
export const HEALTH_VERSION_PATTERN = /^[A-Za-z0-9._-]{1,64}$/

/** Nom du lot de fichiers du serveur (`nitro.serverAssets`) qui porte la liste des migrations livrées avec le build. */
export const MIGRATIONS_ASSET_BASE_NAME = 'migrations'
export const MIGRATIONS_ASSET_STORAGE = `assets:${MIGRATIONS_ASSET_BASE_NAME}`

/** Fichier de migration `<horodatage à 13 chiffres>-<Nom>.ts|js` : l'horodatage est celui que TypeORM enregistre. */
export const MIGRATION_FILE_PATTERN = /^(\d{13})-.+\.(?:ts|js)$/

/** Table de suivi de TypeORM et code PostgreSQL d'une table absente (base neuve, migrations jamais jouées). */
export const MIGRATIONS_TABLE_QUERY = 'SELECT "timestamp" FROM "migrations"'
export const PG_UNDEFINED_TABLE = '42P01'
