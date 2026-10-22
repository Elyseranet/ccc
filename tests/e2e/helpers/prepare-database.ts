import 'reflect-metadata'
import { randomBytes } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { USER_ROLE, USER_STATUS } from '../../../src/enums/user.enum'
import { UserEntity } from '../../../src/server/db/typeorm/entities/user.entity'
import { createSession } from '../../../src/utils/session-store.util'
import { seedArchives } from '../../db/helpers/archives'
import { E2E_SESSIONS_FILE, E2E_TEST_DATABASE_SUFFIX } from './e2e.const'

/*********************************************************
 * Base des e2e (ARCH-9)
 *
 * @description
 * Lancé par `global-setup.ts` (via vite-node, qui lit les décorateurs TypeORM comme Vitest). Refuse toute base dont le
 * nom ne finit pas par `_test`, puis : schéma neuf (drop + migrations), archives réelles (`archives.sql`), un compte
 * administrateur et un compte participant actifs, sans mot de passe utilisable (hash d'un aléa jeté aussitôt), et une
 * session réelle pour chacun. Les jetons sont écrits dans `test-results/` (gitignoré) pour les specs. Aucune donnée
 * fictive dans l'application : seuls des comptes de test sont créés, dans une base de test.
 ********************************************************/
const run = async (): Promise<void> => {
  if (!(process.env.NUXT_DATABASE_DATABASE ?? '').endsWith(E2E_TEST_DATABASE_SUFFIX)) {
    throw new Error(`NUXT_DATABASE_DATABASE must name a dedicated test database (suffix ${E2E_TEST_DATABASE_SUFFIX})`)
  }
  const dataSource = (await import('../../../src/server/db/typeorm/data-source')).default
  await dataSource.initialize()
  await dataSource.dropDatabase()
  await dataSource.runMigrations()
  const counts = await seedArchives(dataSource)
  const { hashPassword } = await import('../../../src/utils/password.util')
  const account = async (email: string, role: USER_ROLE): Promise<string> => {
    const user = await dataSource.getRepository(UserEntity).save({
      email,
      role,
      status: USER_STATUS.ACTIVE,
      passwordHash: await hashPassword(randomBytes(32).toString('base64url')),
      competitorId: null
    })
    return createSession(dataSource, user.id)
  }
  const sessions = {
    admin: await account('e2e-admin@example.test', USER_ROLE.ADMIN),
    'admin-logout': await account('e2e-admin-logout@example.test', USER_ROLE.ADMIN),
    participant: await account('e2e-participant@example.test', USER_ROLE.PARTICIPANT)
  }
  writeFileSync(E2E_SESSIONS_FILE, JSON.stringify(sessions))
  await dataSource.destroy()
  process.stdout.write(`${JSON.stringify({ e2eDatabase: 'ready', ...counts })}\n`)
}

run().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`)
  process.exitCode = 1
})
