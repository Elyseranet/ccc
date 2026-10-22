import 'reflect-metadata'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import type { DataSource } from 'typeorm'
import { API_ERROR_CODE } from '../../src/enums/api-error-code.enum'
import { EDITION_ORIGIN, EDITION_STATUS } from '../../src/enums/edition.enum'
import { MATCH_STATUS } from '../../src/enums/match.enum'
import { ROUND_KIND, ROUND_STATUS } from '../../src/enums/round.enum'
import { USER_ROLE, USER_STATUS } from '../../src/enums/user.enum'
import { UserEntity } from '../../src/server/db/typeorm/entities/user.entity'
import { CompetitorEntity } from '../../src/server/db/typeorm/entities/competitor.entity'
import { EditionEntity } from '../../src/server/db/typeorm/entities/edition.entity'
import { MatchSideEntity } from '../../src/server/db/typeorm/entities/match-side.entity'
import { MatchEntity } from '../../src/server/db/typeorm/entities/match.entity'
import { ParticipationEntity } from '../../src/server/db/typeorm/entities/participation.entity'
import { PoolEntity } from '../../src/server/db/typeorm/entities/pool.entity'
import { RoundEntity } from '../../src/server/db/typeorm/entities/round.entity'
import { correctMatch, recordScore, validateMatch } from '../../src/services/match.service'
import { toApiError } from '../../src/utils/api-error.util'
import { cleanup, resetSchema } from './helpers/test-database'

let dataSource: DataSource
let counter = 0
let adminId = ''

interface IScored {
  matchId: string
  participationIds: [string, string]
}

/** Un match de poule SCHEDULED dans un tour PLAYING, sans passer par l'API. */
const seedPoolMatch = async (): Promise<IScored> => {
  counter += 1
  const edition = await dataSource.getRepository(EditionEntity).save({
    code: `db-${counter}`, year: 3000 + counter, chronologicalRank: 9000 + counter,
    status: EDITION_STATUS.POOLS_PLAYING, origin: EDITION_ORIGIN.APP
  })
  const pool = await dataSource.getRepository(PoolEntity).save({ editionId: edition.id, rank: 1 })
  const round = await dataSource.getRepository(RoundEntity).save({
    editionId: edition.id, kind: ROUND_KIND.POOLS, sequence: 1, status: ROUND_STATUS.PLAYING
  })
  const competitors = await dataSource.getRepository(CompetitorEntity).save([{ displayName: `A${counter}` }, { displayName: `B${counter}` }])
  const participations = await dataSource.getRepository(ParticipationEntity).save(
    competitors.map((competitor) => ({ editionId: edition.id, competitorId: competitor.id, poolId: pool.id }))
  )
  const match = await dataSource.getRepository(MatchEntity).save({
    editionId: edition.id, roundId: round.id, poolId: pool.id, sequence: 1, targetScore: 5
  })
  await dataSource.getRepository(MatchSideEntity).save(participations.map((participation, index) => ({
    matchId: match.id, position: index + 1, participationId: participation.id
  })))
  return { matchId: match.id, participationIds: [participations[0]!.id, participations[1]!.id] }
}

const command = (seed: IScored, scores: [number, number], extra: { expectedVersion?: number } = {}) => ({
  matchId: seed.matchId,
  userId: adminId,
  scores: seed.participationIds.map((participationId, index) => ({ participationId, score: scores[index]! })),
  ...extra
})

beforeAll(async () => {
  dataSource = await resetSchema()
  adminId = (await dataSource.getRepository(UserEntity).save({
    email: 'admin-b12-db@ccc.test', role: USER_ROLE.ADMIN, status: USER_STATUS.ACTIVE, passwordHash: 'x'
  })).id
})

afterEach(() => {
  vi.restoreAllMocks()
})

afterAll(cleanup)

describe('match score service (B-12)', () => {
  it('validates exactly once when two validations race for the same match (row lock)', async () => {
    const seed = await seedPoolMatch()
    await recordScore(dataSource, command(seed, [5, 2]))
    const before = await dataSource.getRepository(MatchEntity).findOneByOrFail({ id: seed.matchId })

    const outcomes = await Promise.all([
      validateMatch(dataSource, command(seed, [5, 2])),
      validateMatch(dataSource, command(seed, [5, 2]))
    ])

    expect(outcomes.map((outcome) => outcome.replayed).sort()).toEqual([false, true])
    const after = await dataSource.getRepository(MatchEntity).findOneByOrFail({ id: seed.matchId })
    expect(after.status).toBe(MATCH_STATUS.VALIDATED)
    expect(after.version).toBe(before.version + 1)
  })

  it('does not touch a validated match on replay, and refuses other scores', async () => {
    const seed = await seedPoolMatch()
    await recordScore(dataSource, command(seed, [5, 1]))
    await validateMatch(dataSource, command(seed, [5, 1]))
    const validated = await dataSource.getRepository(MatchEntity).findOneByOrFail({ id: seed.matchId })

    const replay = await validateMatch(dataSource, command(seed, [5, 1], { expectedVersion: 0 }))
    expect(replay.replayed).toBe(true)
    expect((await dataSource.getRepository(MatchEntity).findOneByOrFail({ id: seed.matchId })).version).toBe(validated.version)

    await expect(validateMatch(dataSource, command(seed, [5, 4]))).rejects.toSatisfy(
      (error: unknown) => toApiError(error).code === API_ERROR_CODE.MATCH_ALREADY_VALIDATED
    )
  })

  it('journals match_corrected with the previous and the new score, the author and the match', async () => {
    const seed = await seedPoolMatch()
    await recordScore(dataSource, command(seed, [5, 1]))
    await validateMatch(dataSource, command(seed, [5, 1]))
    const validated = await dataSource.getRepository(MatchEntity).findOneByOrFail({ id: seed.matchId })

    const lines: string[] = []
    vi.spyOn(process.stdout, 'write').mockImplementation(((chunk: string | Uint8Array) => {
      lines.push(String(chunk))
      return true
    }) as typeof process.stdout.write)
    await correctMatch(dataSource, command(seed, [2, 5], { expectedVersion: validated.version }))
    vi.restoreAllMocks()

    const entry = lines.map((line) => { try { return JSON.parse(line) as Record<string, unknown> } catch { return null } })
      .find((parsed) => parsed?.event === 'match_corrected')
    expect(entry).toBeDefined()
    expect(entry).toMatchObject({
      matchId: seed.matchId,
      userId: adminId,
      previousScores: [
        { participationId: seed.participationIds[0], score: 5 },
        { participationId: seed.participationIds[1], score: 1 }
      ],
      newScores: [
        { participationId: seed.participationIds[0], score: 2 },
        { participationId: seed.participationIds[1], score: 5 }
      ]
    })

    const after = await dataSource.getRepository(MatchEntity).findOneByOrFail({ id: seed.matchId })
    expect(after.validatedAt!.getTime()).toBeGreaterThan(validated.validatedAt!.getTime())
    const sides = await dataSource.getRepository(MatchSideEntity).find({ where: { matchId: seed.matchId }, order: { position: 'ASC' } })
    expect(sides.map((side) => [side.recordedScore, side.validatedScore])).toEqual([[2, 2], [5, 5]])
  })
})
