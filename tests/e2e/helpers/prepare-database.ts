import 'reflect-metadata'
import { randomBytes } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { IsNull } from 'typeorm'
import { USER_ROLE, USER_STATUS } from '../../../src/enums/user.enum'
import { CompetitorEntity } from '../../../src/server/db/typeorm/entities/competitor.entity'
import { InvitationEntity } from '../../../src/server/db/typeorm/entities/invitation.entity'
import { UserEntity } from '../../../src/server/db/typeorm/entities/user.entity'
import { issueInvitation } from '../../../src/utils/invitation-store.util'
import { createSession } from '../../../src/utils/session-store.util'
import { seedArchives } from '../../db/helpers/archives'
import { E2E_ACCOUNT_COMPETITORS, E2E_MEMBER_IDENTITY, E2E_PHONE, E2E_SESSIONS_FILE, E2E_TEST_DATABASE_SUFFIX } from './e2e.const'
import { rewindEditionToPoolsPhase } from './in-progress-edition'

/*********************************************************
 * Base des e2e (ARCH-9)
 *
 * @description
 * QA-2 : après le dump, 2026 est remise en phase de poules (`in-progress-edition.ts`, règle et constantes dans `e2e.const.ts`).
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
  const inProgress = await rewindEditionToPoolsPhase(dataSource)
  const { hashPassword } = await import('../../../src/utils/password.util')
  const account = async (email: string, role: USER_ROLE, password = randomBytes(32).toString('base64url')): Promise<string> => {
    const user = await dataSource.getRepository(UserEntity).save({
      email,
      role,
      status: USER_STATUS.ACTIVE,
      passwordHash: await hashPassword(password),
      competitorId: null
    })
    return createSession(dataSource, user.id)
  }
  const competitorOf = async (displayName: string): Promise<string> =>
    (await dataSource.getRepository(CompetitorEntity).findOneByOrFail({ displayName })).id
  const memberAccount = async (email: string, displayName: string, password: string, identity?: typeof E2E_MEMBER_IDENTITY): Promise<string> => {
    const competitorId = await competitorOf(displayName)
    await dataSource.getRepository(CompetitorEntity).update({ id: competitorId }, { phone: E2E_PHONE, ...(identity ?? {}) })
    const user = await dataSource.getRepository(UserEntity).save({
      email, role: USER_ROLE.PARTICIPANT, status: USER_STATUS.ACTIVE, passwordHash: await hashPassword(password), competitorId
    })
    return createSession(dataSource, user.id)
  }
  const invitedAccount = async (email: string, displayName: string): Promise<string> => {
    const user = await dataSource.getRepository(UserEntity).save({
      email, role: USER_ROLE.PARTICIPANT, status: USER_STATUS.INVITED, passwordHash: null, competitorId: await competitorOf(displayName)
    })
    return (await issueInvitation(dataSource.manager, user.id)).invitationToken
  }
  // Mots de passe de test tirés au hasard à chaque préparation, écrits avec les jetons dans le fichier gitignoré : aucun secret dans le dépôt.
  const secret = (): string => randomBytes(18).toString('base64url')
  const passwords = { login: secret(), loginAdmin: secret(), edit: secret() }
  const sessions = {
    admin: await account('e2e-admin@example.test', USER_ROLE.ADMIN),
    'admin-logout': await account('e2e-admin-logout@example.test', USER_ROLE.ADMIN),
    participant: await account('e2e-participant@example.test', USER_ROLE.PARTICIPANT),
    member: await memberAccount('e2e-member@example.test', E2E_ACCOUNT_COMPETITORS.member, secret(), E2E_MEMBER_IDENTITY),
    'member-edit': await memberAccount('e2e-member-edit@example.test', E2E_ACCOUNT_COMPETITORS.edit, passwords.edit),
    'member-logout': await memberAccount('e2e-member-logout@example.test', E2E_ACCOUNT_COMPETITORS.logout, secret()),
    'member-logout-header': await memberAccount('e2e-member-logout-header@example.test', E2E_ACCOUNT_COMPETITORS.logoutHeader, secret()),
    'member-expired': await memberAccount('e2e-member-expired@example.test', E2E_ACCOUNT_COMPETITORS.expired, secret()),
    'admin-logout-header': await account('e2e-admin-logout-header@example.test', USER_ROLE.ADMIN)
  }
  await memberAccount('e2e-login@example.test', E2E_ACCOUNT_COMPETITORS.login, passwords.login)
  await account('e2e-login-admin@example.test', USER_ROLE.ADMIN, passwords.loginAdmin)
  const invitations = {
    valid: await invitedAccount('e2e-invited@example.test', E2E_ACCOUNT_COMPETITORS.invited),
    flow: await invitedAccount('e2e-invited-flow@example.test', E2E_ACCOUNT_COMPETITORS.invitedFlow),
    expired: await invitedAccount('e2e-invited-expired@example.test', E2E_ACCOUNT_COMPETITORS.invitedExpired),
    consumed: await invitedAccount('e2e-invited-consumed@example.test', E2E_ACCOUNT_COMPETITORS.invitedConsumed)
  }
  const invitationOf = async (email: string): Promise<InvitationEntity> => {
    const user = await dataSource.getRepository(UserEntity).findOneByOrFail({ email })
    return dataSource.getRepository(InvitationEntity).findOneByOrFail({ userId: user.id, consumedAt: IsNull() })
  }
  await dataSource.getRepository(InvitationEntity).update({ id: (await invitationOf('e2e-invited-expired@example.test')).id }, { expiresAt: new Date(Date.now() - 60_000) })
  await dataSource.getRepository(InvitationEntity).update({ id: (await invitationOf('e2e-invited-consumed@example.test')).id }, { consumedAt: new Date() })
  writeFileSync(E2E_SESSIONS_FILE, JSON.stringify({ ...sessions, passwords, invitations }))
  await dataSource.destroy()
  process.stdout.write(`${JSON.stringify({ e2eDatabase: 'ready', ...counts, inProgressEdition: { code: inProgress.code, status: inProgress.status, matches: inProgress.matches } })}\n`)
}

run().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`)
  process.exitCode = 1
})
