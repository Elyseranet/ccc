import type { DataSource } from 'typeorm'

const TEST_DATABASE_SUFFIX = '_test'
const MIGRATION_TIMESTAMP_SUFFIX = /\d+$/

let current: DataSource | null = null

/**
 * À appeler en `beforeAll` : refuse toute base dont le nom ne finit pas par `_test`, puis repart d'un schéma
 * neuf (drop + migrations). Le fichier ne dépend donc ni de l'ordre d'exécution ni de l'état laissé avant lui.
 */
export const resetSchema = async (): Promise<DataSource> => {
  if (!(process.env.NUXT_DATABASE_DATABASE ?? '').endsWith(TEST_DATABASE_SUFFIX)) {
    throw new Error(`NUXT_DATABASE_DATABASE must name a dedicated test database (suffix ${TEST_DATABASE_SUFFIX})`)
  }
  const dataSource = (await import('../../../src/server/db/typeorm/data-source')).default
  if (!dataSource.isInitialized) {
    await dataSource.initialize()
  }
  await dataSource.dropDatabase()
  await dataSource.runMigrations()
  current = dataSource
  return dataSource
}

/**
 * À appeler en `afterAll` : rend une base migrée et vide de données (le fichier a pu insérer, annuler des
 * migrations ou créer des tables), puis ferme la connexion. La base est ainsi dans l'état où `resetSchema` l'a trouvée.
 */
export const cleanup = async (): Promise<void> => {
  if (current?.isInitialized) {
    await current.dropDatabase()
    await current.runMigrations()
    await current.destroy()
  }
  current = null
}

const appliedMigrationNames = async (dataSource: DataSource): Promise<string[]> => {
  const rows: Array<{ name: string }> = await dataSource.query(`SELECT name FROM migrations ORDER BY id DESC`)
  return rows.map((row) => row.name)
}

/**
 * Annule les migrations une à une, de la dernière vers la plus ancienne, jusqu'à ce que `migrationName` soit la
 * dernière appliquée (elle reste appliquée). Le nom s'écrit avec ou sans horodatage (`CreateIdentitySchema` ou
 * `CreateIdentitySchema1792509943930`). Aucun test ne suppose ainsi la position de la dernière migration : une
 * migration ajoutée plus tard ne casse pas les tests de réversibilité des précédentes.
 */
export const revertMigrationsUntil = async (dataSource: DataSource, migrationName: string): Promise<void> => {
  const matches = (applied: string): boolean =>
    applied === migrationName || applied.replace(MIGRATION_TIMESTAMP_SUFFIX, '') === migrationName
  if (!(await appliedMigrationNames(dataSource)).some(matches)) {
    throw new Error(`Migration ${migrationName} is not applied`)
  }
  while (!matches((await appliedMigrationNames(dataSource))[0]!)) {
    await dataSource.undoLastMigration()
  }
}

/** Annule toutes les migrations appliquées. */
export const revertAllMigrations = async (dataSource: DataSource): Promise<void> => {
  while ((await appliedMigrationNames(dataSource)).length > 0) {
    await dataSource.undoLastMigration()
  }
}
