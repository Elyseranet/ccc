import 'reflect-metadata'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { DataSource } from 'typeorm'
import { EDITION_ORIGIN, EDITION_STATUS } from '../../src/enums/edition.enum'
import { MATCH_STATUS } from '../../src/enums/match.enum'
import { FINAL_STAGE } from '../../src/enums/participation.enum'
import { ROUND_KIND, ROUND_STATUS } from '../../src/enums/round.enum'
import { CompetitorEntity } from '../../src/server/db/typeorm/entities/competitor.entity'
import { EditionEntity } from '../../src/server/db/typeorm/entities/edition.entity'
import { MatchSideEntity } from '../../src/server/db/typeorm/entities/match-side.entity'
import { MatchEntity } from '../../src/server/db/typeorm/entities/match.entity'
import { ParticipationEntity } from '../../src/server/db/typeorm/entities/participation.entity'
import { RoundEntity } from '../../src/server/db/typeorm/entities/round.entity'
import { loadEditionSummaries } from '../../src/services/edition.service'
import { cleanup, resetSchema } from './helpers/test-database'

let dataSource: DataSource

const createEdition = (code: string, rank: number) => dataSource.getRepository(EditionEntity).save({
  code, year: 2040 + rank, chronologicalRank: rank, status: EDITION_STATUS.CLOSED, origin: EDITION_ORIGIN.APP
})
const createPlayer = (displayName: string) => dataSource.getRepository(CompetitorEntity).save({ displayName })
const participate = (editionId: string, competitorId: string, finalStage: FINAL_STAGE | null) =>
  dataSource.getRepository(ParticipationEntity).save({ editionId, competitorId, finalStage })

const addSemiMatch = async (round: RoundEntity, sequence: number, loser: ParticipationEntity, winner: ParticipationEntity) => {
  const match = await dataSource.getRepository(MatchEntity).save({
    editionId: round.editionId, roundId: round.id, sequence, targetScore: 10, status: MATCH_STATUS.VALIDATED
  })
  await dataSource.getRepository(MatchSideEntity).save([
    { matchId: match.id, position: 1, participationId: winner.id, recordedScore: 10, validatedScore: 10 },
    { matchId: match.id, position: 2, participationId: loser.id, recordedScore: 3, validatedScore: 3 }
  ])
}

beforeAll(async () => {
  dataSource = await resetSchema()
})

afterAll(cleanup)

describe('IEditionSummary.semiFinalists (B-19)', () => {
  it('orders by the sequence of the semi-final lost, not by name, then by name without a match', async () => {
    const edition = await createEdition('4001', 1)
    const [zed, abe, bob, ana, cat, dan] = await Promise.all(['Zed', 'Abe', 'Bob', 'Ana', 'Cat', 'Dan'].map(createPlayer))
    const champion = await participate(edition.id, cat!.id, FINAL_STAGE.CHAMPION)
    const finalist = await participate(edition.id, dan!.id, FINAL_STAGE.FINALIST)
    const semiOne = await participate(edition.id, zed!.id, FINAL_STAGE.SEMI)
    const semiTwo = await participate(edition.id, abe!.id, FINAL_STAGE.SEMI)
    const round = await dataSource.getRepository(RoundEntity).save({
      editionId: edition.id, kind: ROUND_KIND.SEMI, sequence: 1, status: ROUND_STATUS.COMPLETED
    })
    // Zed a perdu la demi-finale n° 1, Abe la n° 2 : l'ordre alphabétique serait l'inverse.
    await addSemiMatch(round, 1, semiOne, champion)
    await addSemiMatch(round, 2, semiTwo, finalist)

    const [summary] = await loadEditionSummaries(dataSource, [edition])
    expect(summary!.semiFinalists.map((entry) => entry.competitor.displayName)).toEqual(['Zed', 'Abe'])

    // Sans match de demi-finale, le nom départage (Ana avant Bob).
    const noMatch = await createEdition('4002', 2)
    await participate(noMatch.id, bob!.id, FINAL_STAGE.SEMI)
    await participate(noMatch.id, ana!.id, FINAL_STAGE.SEMI)
    const [bare] = await loadEditionSummaries(dataSource, [noMatch])
    expect(bare!.semiFinalists.map((entry) => entry.competitor.displayName)).toEqual(['Ana', 'Bob'])
  })

  it('is an empty array, never null, for an edition with no decided semi-final', async () => {
    const edition = await createEdition('4003', 3)
    const [summary] = await loadEditionSummaries(dataSource, [edition])
    expect(summary!.semiFinalists).toEqual([])
    expect(summary!.final).toBeNull()
  })

  it('counts titles up to the edition rank included, and ignores later titles', async () => {
    const early = await createEdition('4004', 4)
    const late = await createEdition('4005', 5)
    const [star, rival] = await Promise.all(['Star', 'Rival'].map(createPlayer))
    await participate(early.id, star!.id, FINAL_STAGE.CHAMPION)
    await participate(late.id, rival!.id, FINAL_STAGE.CHAMPION)
    await participate(late.id, star!.id, FINAL_STAGE.FINALIST)
    // Star gagne 4004 puis est finaliste en 4005 : 1 titre à date. Rival gagne en 4005 : 1 titre à date.
    const [first, second] = await loadEditionSummaries(dataSource, [early, late])
    expect(first!.champion!.titlesToDate).toBe(1)
    expect(second!.final!.runnerUpTitlesToDate).toBe(1)
    expect(second!.champion!.titlesToDate).toBe(1)

    // Star finaliste en 4004 aussi serait à 0 titre à date avant son sacre : un titre postérieur ne compte pas.
    const earlier = await createEdition('4000', 0)
    await participate(earlier.id, star!.id, FINAL_STAGE.FINALIST)
    await participate(earlier.id, rival!.id, FINAL_STAGE.CHAMPION)
    const [past] = await loadEditionSummaries(dataSource, [earlier])
    expect(past!.final!.runnerUpTitlesToDate).toBe(0)
  })
})
