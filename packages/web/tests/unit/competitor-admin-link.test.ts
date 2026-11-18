import { QueryFailedError } from 'typeorm'
import type { EntityManager } from 'typeorm'
import { describe, expect, it } from 'vitest'
import { API_ERROR_CODE } from '../../src/enums/api-error-code.enum'
import { USER_ROLE, USER_STATUS } from '../../src/enums/user.enum'
import { setCompetitorAccountEmail } from '../../src/services/competitor.service'

/** Faux gestionnaire : la fiche existe sans compte, l'admin est libre, mais la base refuse l'écriture (uq_users_competitor_id). */
const managerFailingOn = (update: () => Promise<unknown>): EntityManager => {
  const users = {
    findOne: async ({ where }: { where: Record<string, string> }) =>
      where.email ? { id: 'admin-1', role: USER_ROLE.ADMIN, status: USER_STATUS.ACTIVE, competitorId: null } : null,
    update,
    delete: async () => ({ affected: 0 })
  }
  return {
    findOne: async () => ({ id: 'card-1', firstName: 'A' }),
    getRepository: () => users
  } as unknown as EntityManager
}

describe('setCompetitorAccountEmail, link branch (B-32)', () => {
  it('translates a uq_users_competitor_id violation into 409 ACCOUNT_ALREADY_LINKED', async () => {
    const violation = new QueryFailedError('UPDATE', [], Object.assign(new Error('duplicate key'), { code: '23505', constraint: 'uq_users_competitor_id' }))
    const manager = managerFailingOn(async () => { throw violation })
    await expect(setCompetitorAccountEmail(manager, 'card-1', 'admin@ccc.test')).rejects.toMatchObject({
      statusCode: 409,
      data: { code: API_ERROR_CODE.ACCOUNT_ALREADY_LINKED }
    })
  })

  it('lets any other error through untouched', async () => {
    const boom = new Error('boom')
    await expect(setCompetitorAccountEmail(managerFailingOn(async () => { throw boom }), 'card-1', 'admin@ccc.test')).rejects.toBe(boom)
  })
})
