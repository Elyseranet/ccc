import type { DataSource } from 'typeorm'

const TEST_DATABASE_SUFFIX = '_test'

let current: DataSource | null = null

/**
 * À appeler en `beforeAll` : refuse toute base dont le nom ne finit pas par `_test`, puis repart d'un schéma
 * neuf (drop + migrations). Le fichier ne dépend donc ni de l'ordre d'exécution ni de l'état laissé avant lui.
 */
export const resetSchema = async (): Promise<DataSource> => {
  if (!(process.env.NUXT_DATABASE_DATABASE ?? '').endsWith(TEST_DATABASE_SUFFIX)) {
    throw new Error(`NUXT_DATABASE_DATABASE must name a dedicated test database (suffix ${TEST_DATABASE_SUFFIX})`)
  }
  const dataSource = (await import('../../../src/server/database/data-source')).default
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
