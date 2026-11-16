import 'reflect-metadata'
import { fileURLToPath } from 'node:url'
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { API_ERROR_CODE } from '../../src/enums/api-error-code.enum'
import { ROUND_KIND, ROUND_STATUS } from '../../src/enums/round.enum'
import { USER_ROLE } from '../../src/enums/user.enum'
import type { IAdminMatch } from '../../src/interfaces/admin-match.interface'
import type { IAdminDraw } from '../../src/interfaces/draw.interface'
import type { IRoundDrawPreview } from '../../src/interfaces/qualification.interface'
import type { IRandomDrawResult } from '../../src/interfaces/random-draw.interface'
import type { IRound } from '../../src/interfaces/round.interface'
import { cookieHeaderOf, login, resetTestDatabase, seedUser } from './helpers/auth-fixtures'
import { API_TEST_SETUP_TIMEOUT_MS } from './helpers/nuxt-setup'
import { clearPool, seedPoolStage } from './helpers/seed-pool-stage'
import { requireTestDatabaseEnv } from './helpers/test-database'

const PASSWORD = 'a-long-enough-password'

/*********************************************************
 * Tour suivant après un tour validé (B-27)
 *
 * @description
 * 8 qualifiés, sans barrages : quarts tirés pas à pas (B-26) puis validés par l'API. Le tour suivant doit être proposé avec le
 * vivier des seuls vainqueurs, et le tour validé doit se lire COMPLETED sur `GET /editions/{id}/tours`.
 ********************************************************/
describe('next knockout round (B-27)', async () => {
  const env = requireTestDatabaseEnv()
  const dataSource = await resetTestDatabase()
  await seedUser(dataSource, { email: 'boss-b27@ccc.test', password: PASSWORD, role: USER_ROLE.ADMIN })
  const fixture = await seedPoolStage(dataSource, {
    code: '2081', rank: 21, pools: [clearPool('a'), clearPool('b'), clearPool('c'), clearPool('d')]
  })
  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    setupTimeout: API_TEST_SETUP_TIMEOUT_MS,
    server: true,
    env: { ...env, NUXT_AUTH_LOGIN_RATE_LIMIT_MAX_IP_ATTEMPTS: '1000' }
  })

  let cookie = ''
  const editionId = fixture.edition.id
  const send = (method: string, path: string, body?: unknown, headers: Record<string, string> = {}) =>
    fetch(path, {
      method,
      headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), Cookie: cookie, ...headers },
      body: body === undefined ? undefined : JSON.stringify(body)
    })
  beforeAll(async () => {
    cookie = cookieHeaderOf(await login('boss-b27@ccc.test', PASSWORD))
    const qualified = await send('POST', `/api/v1/editions/${editionId}/qualification`, { topPerPool: 2, bestNextCount: 0, withPlayoff: false })
    expect(qualified.status).toBe(200)
  })
  afterAll(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  })

  const preview = async () => await (await send('GET', `/api/v1/admin/editions/${editionId}/tirages/tour`)).json() as IRoundDrawPreview
  const rounds = async () => await (await send('GET', `/api/v1/editions/${editionId}/tours`)).json() as IRound[]

  /** Ouvre le brouillon, tire pas à pas jusqu'au bout (B-26), valide. */
  const drawRound = async (): Promise<void> => {
    const draw = await (await send('POST', `/api/v1/editions/${editionId}/tirages/tour`, {})).json() as IAdminDraw
    for (let remaining = 1; remaining > 0;) {
      const step = await send('POST', `/api/v1/tirages/${draw.id}/tirage-au-sort`)
      expect(step.status).toBe(200)
      remaining = (await step.json() as IRandomDrawResult).step.remaining
    }
    expect((await send('POST', `/api/v1/tirages/${draw.id}/validation`)).status).toBe(200)
  }
  /** Valide chaque match du tour : le premier côté gagne. Rend les vainqueurs. */
  const validateRound = async (kind: ROUND_KIND): Promise<string[]> => {
    const matches = await (await send('GET', `/api/v1/admin/editions/${editionId}/matchs?tour=${kind}`)).json() as IAdminMatch[]
    const winners: string[] = []
    for (const match of matches) {
      const scores = match.sides.map((side, index) => ({ participationId: side.participationId, score: index === 0 ? match.targetScore : 3 }))
      const recorded = await send('PUT', `/api/v1/matchs/${match.id}/score`, { scores }, { 'If-Match': `"${match.version}"` })
      expect(recorded.status, await recorded.clone().text()).toBe(200)
      const { version } = await recorded.json() as IAdminMatch
      const response = await send('POST', `/api/v1/matchs/${match.id}/validation`, { scores }, { 'If-Match': `"${version}"` })
      expect(response.status, await response.clone().text()).toBe(200)
      winners.push(match.sides[0]!.participationId)
    }
    return winners
  }

  it('quarters, semis then final: each next round is offered with the winners only', async () => {
    expect(await preview()).toMatchObject({ roundKind: ROUND_KIND.QUARTER })
    await drawRound()
    expect(await preview()).toMatchObject({ roundKind: null, blockedBy: API_ERROR_CODE.ROUND_NOT_COMPLETED })

    const quarterWinners = await validateRound(ROUND_KIND.QUARTER)
    expect(quarterWinners).toHaveLength(4)
    expect((await rounds()).find((round) => round.kind === ROUND_KIND.QUARTER)!.status).toBe(ROUND_STATUS.COMPLETED)
    const semis = await preview()
    expect(semis).toMatchObject({ roundKind: ROUND_KIND.SEMI, blockedBy: null })
    expect(semis.candidates.map((member) => member.participationId).sort()).toEqual([...quarterWinners].sort())

    await drawRound()
    const semiWinners = await validateRound(ROUND_KIND.SEMI)
    const final = await preview()
    expect(final).toMatchObject({ roundKind: ROUND_KIND.FINAL, blockedBy: null })
    expect(final.candidates.map((member) => member.participationId).sort()).toEqual([...semiWinners].sort())
  })
})
