import 'reflect-metadata'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { DataSource } from 'typeorm'
import { EDITION_ORIGIN } from '../../shared/enums/edition.enum'
import { DRAW_KIND, DRAW_STATUS } from '../../shared/enums/draw.enum'
import { MATCH_PURPOSE } from '../../shared/enums/match.enum'
import { ROUND_KIND } from '../../shared/enums/round.enum'
import { CompetitorEntity } from '../../server/database/entities/competitor.entity'
import { DrawEntity } from '../../server/database/entities/draw.entity'
import { EditionEntity } from '../../server/database/entities/edition.entity'
import { MatchSideEntity } from '../../server/database/entities/match-side.entity'
import { MatchEntity } from '../../server/database/entities/match.entity'
import { ParticipationEntity } from '../../server/database/entities/participation.entity'
import { RoundEntity } from '../../server/database/entities/round.entity'

const DOMAIN_TABLES = [
  'competitors',
  'competitor_aliases',
  'editions',
  'pools',
  'rounds',
  'participations',
  'matches',
  'match_sides',
  'draws',
  'draw_assignments'
]

let dataSource: DataSource
let counter = 0

const tablesPresent = async (): Promise<string[]> => {
  const rows: Array<{ table_name: string }> = await dataSource.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ANY($1)`,
    [DOMAIN_TABLES]
  )
  return rows.map((row) => row.table_name).sort()
}

const createEdition = async (year: number): Promise<EditionEntity> => {
  counter += 1
  return dataSource.getRepository(EditionEntity).save({
    code: `t${counter}`,
    year,
    chronologicalRank: counter,
    origin: EDITION_ORIGIN.APP
  })
}

const createCompetitor = async (displayName: string): Promise<CompetitorEntity> =>
  dataSource.getRepository(CompetitorEntity).save({ displayName })

const createParticipation = async (editionId: string, competitorId: string): Promise<ParticipationEntity> =>
  dataSource.getRepository(ParticipationEntity).save({ editionId, competitorId })

const createRound = async (editionId: string, kind: ROUND_KIND, sequence: number): Promise<RoundEntity> =>
  dataSource.getRepository(RoundEntity).save({ editionId, kind, sequence })

const createMatch = async (editionId: string, roundId: string, sequence: number, targetScore = 5): Promise<MatchEntity> =>
  dataSource.getRepository(MatchEntity).save({ editionId, roundId, sequence, targetScore })

beforeAll(async () => {
  const databaseName = process.env.NUXT_DATABASE_DATABASE ?? ''

  if (!databaseName.endsWith('_test')) {
    throw new Error('NUXT_DATABASE_DATABASE must name a dedicated test database (suffix _test)')
  }

  dataSource = (await import('../../server/database/data-source')).default
  await dataSource.initialize()
  await dataSource.dropDatabase()
  await dataSource.runMigrations()
})

afterAll(async () => {
  if (dataSource?.isInitialized) {
    await dataSource.destroy()
  }
})

describe('migration M1', () => {
  it('creates the 10 domain tables', async () => {
    expect(await tablesPresent()).toEqual([...DOMAIN_TABLES].sort())
  })

  it('reverts to an empty domain schema then re-applies', async () => {
    await dataSource.undoLastMigration()
    expect(await tablesPresent()).toEqual([])

    const legacy: Array<{ table_name: string }> = await dataSource.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'legacy_workbook_%'`
    )
    expect(legacy).toHaveLength(2)

    const leftoverTypes: Array<{ typname: string }> = await dataSource.query(
      `SELECT typname FROM pg_type WHERE typtype = 'e'`
    )
    expect(leftoverTypes).toEqual([])

    await dataSource.runMigrations()
    expect(await tablesPresent()).toEqual([...DOMAIN_TABLES].sort())
  })
})

describe('domain constraints', () => {
  it('accepts two editions of the same year', async () => {
    const first = await createEdition(2012)
    const second = await createEdition(2012)

    expect(first.id).not.toEqual(second.id)
    expect(second.year).toBe(2012)
  })

  it('rejects a duplicate edition code', async () => {
    const edition = await createEdition(2020)

    await expect(
      dataSource.getRepository(EditionEntity).save({
        code: edition.code,
        year: 2021,
        chronologicalRank: 9000,
        origin: EDITION_ORIGIN.APP
      })
    ).rejects.toThrow(/uq_editions_code/)
  })

  it('rejects a duplicate (edition_id, competitor_id) participation', async () => {
    const edition = await createEdition(2021)
    const competitor = await createCompetitor('Doublon')
    await createParticipation(edition.id, competitor.id)

    await expect(createParticipation(edition.id, competitor.id)).rejects.toThrow(
      /uq_participations_edition_competitor/
    )
  })

  it('stores points as a number with two decimals', async () => {
    const edition = await createEdition(2022)
    const competitor = await createCompetitor('Points')
    const participation = await createParticipation(edition.id, competitor.id)

    await dataSource.getRepository(ParticipationEntity).update(participation.id, { points: 6.48 })
    const reloaded = await dataSource.getRepository(ParticipationEntity).findOneByOrFail({ id: participation.id })

    expect(reloaded.points).toBe(6.48)
  })

  it('rejects a duplicate (match_id, position) side', async () => {
    const edition = await createEdition(2023)
    const round = await createRound(edition.id, ROUND_KIND.POOLS, 1)
    const match = await createMatch(edition.id, round.id, 1)
    const a = await createParticipation(edition.id, (await createCompetitor('A')).id)
    const b = await createParticipation(edition.id, (await createCompetitor('B')).id)
    const sides = dataSource.getRepository(MatchSideEntity)

    await sides.save({ matchId: match.id, position: 1, participationId: a.id })

    await expect(sides.save({ matchId: match.id, position: 1, participationId: b.id })).rejects.toThrow(
      /uq_match_sides_match_position/
    )
  })

  it('rejects the same participation twice in a match', async () => {
    const edition = await createEdition(2023)
    const round = await createRound(edition.id, ROUND_KIND.POOLS, 1)
    const match = await createMatch(edition.id, round.id, 1)
    const a = await createParticipation(edition.id, (await createCompetitor('C')).id)
    const sides = dataSource.getRepository(MatchSideEntity)

    await sides.save({ matchId: match.id, position: 1, participationId: a.id })

    await expect(sides.save({ matchId: match.id, position: 2, participationId: a.id })).rejects.toThrow(
      /uq_match_sides_match_participation/
    )
  })

  it('accepts four sides and rejects position 0 (A11, R-1)', async () => {
    const edition = await createEdition(2024)
    const round = await createRound(edition.id, ROUND_KIND.POOLS, 1)
    const match = await dataSource.getRepository(MatchEntity).save({
      editionId: edition.id,
      roundId: round.id,
      sequence: 1,
      targetScore: 3,
      purpose: MATCH_PURPOSE.TIEBREAK
    })
    const sides = dataSource.getRepository(MatchSideEntity)

    for (const position of [1, 2, 3, 4]) {
      const participation = await createParticipation(edition.id, (await createCompetitor(`T${position}`)).id)
      await sides.save({ matchId: match.id, position, participationId: participation.id })
    }

    const extra = await createParticipation(edition.id, (await createCompetitor('T0')).id)

    await expect(sides.save({ matchId: match.id, position: 0, participationId: extra.id })).rejects.toThrow(
      /ck_match_sides_position/
    )
  })

  it('rejects a negative recorded or validated score', async () => {
    const edition = await createEdition(2025)
    const round = await createRound(edition.id, ROUND_KIND.POOLS, 1)
    const match = await createMatch(edition.id, round.id, 1)
    const a = await createParticipation(edition.id, (await createCompetitor('N1')).id)
    const b = await createParticipation(edition.id, (await createCompetitor('N2')).id)
    const sides = dataSource.getRepository(MatchSideEntity)

    await expect(
      sides.save({ matchId: match.id, position: 1, participationId: a.id, recordedScore: -1 })
    ).rejects.toThrow(/ck_match_sides_recorded_score/)

    await expect(
      sides.save({ matchId: match.id, position: 2, participationId: b.id, validatedScore: -1 })
    ).rejects.toThrow(/ck_match_sides_validated_score/)
  })

  it.each([3, 5, 10])('accepts target_score %i', async (targetScore) => {
    const edition = await createEdition(2026)
    const round = await createRound(edition.id, ROUND_KIND.POOLS, 1)

    await expect(createMatch(edition.id, round.id, 1, targetScore)).resolves.toBeDefined()
  })

  it.each([0, 4, 7, 11])('rejects target_score %i', async (targetScore) => {
    const edition = await createEdition(2026)
    const round = await createRound(edition.id, ROUND_KIND.POOLS, 1)

    await expect(createMatch(edition.id, round.id, 1, targetScore)).rejects.toThrow(/ck_matches_target_score/)
  })

  it('rejects a duplicate match sequence in an edition and increments the version on update', async () => {
    const edition = await createEdition(2027)
    const round = await createRound(edition.id, ROUND_KIND.POOLS, 1)
    const match = await createMatch(edition.id, round.id, 1)

    await expect(createMatch(edition.id, round.id, 1)).rejects.toThrow(/uq_matches_edition_sequence/)

    await dataSource.getRepository(MatchEntity).update(match.id, { comment: 'edited' })
    const reloaded = await dataSource.getRepository(MatchEntity).findOneByOrFail({ id: match.id })
    expect(reloaded.version).toBe(match.version + 1)
  })

  it('allows a single DRAFT draw per (edition, kind, round)', async () => {
    const edition = await createEdition(2028)
    const round = await createRound(edition.id, ROUND_KIND.PLAYOFF, 2)
    const draws = dataSource.getRepository(DrawEntity)
    const parameters = { poolCount: 4, seedCount: 4 }

    await draws.save({ editionId: edition.id, kind: DRAW_KIND.POOLS, parameters })
    await expect(draws.save({ editionId: edition.id, kind: DRAW_KIND.POOLS, parameters })).rejects.toThrow(
      /uq_draws_draft_without_round/
    )

    await draws.save({ editionId: edition.id, kind: DRAW_KIND.ROUND, roundId: round.id, parameters })
    await expect(
      draws.save({ editionId: edition.id, kind: DRAW_KIND.ROUND, roundId: round.id, parameters })
    ).rejects.toThrow(/uq_draws_draft_with_round/)

    await draws.save({
      editionId: edition.id,
      kind: DRAW_KIND.POOLS,
      status: DRAW_STATUS.VALIDATED,
      parameters
    })
  })

  it('has no email column and a single private phone column on competitors', async () => {
    const columns: Array<{ column_name: string }> = await dataSource.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'competitors'`
    )
    const names = columns.map((column) => column.column_name)

    expect(names).not.toContain('email')
    expect(names).toContain('phone')
  })
})
