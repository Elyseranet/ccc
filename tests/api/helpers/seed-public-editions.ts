import type { DataSource } from 'typeorm'
import { DRAW_KIND, DRAW_STATUS } from '../../../src/enums/draw.enum'
import { EDITION_ORIGIN, EDITION_STATUS } from '../../../src/enums/edition.enum'
import { MATCH_PURPOSE, MATCH_STATUS } from '../../../src/enums/match.enum'
import { FINAL_STAGE, PARTICIPATION_STATUS } from '../../../src/enums/participation.enum'
import { ROUND_KIND, ROUND_STATUS } from '../../../src/enums/round.enum'
import { CompetitorEntity } from '../../../src/server/database/entities/competitor.entity'
import { DrawAssignmentEntity } from '../../../src/server/database/entities/draw-assignment.entity'
import { DrawEntity } from '../../../src/server/database/entities/draw.entity'
import { EditionEntity } from '../../../src/server/database/entities/edition.entity'
import { MatchSideEntity } from '../../../src/server/database/entities/match-side.entity'
import { MatchEntity } from '../../../src/server/database/entities/match.entity'
import { ParticipationEntity } from '../../../src/server/database/entities/participation.entity'
import { PoolEntity } from '../../../src/server/database/entities/pool.entity'
import { RoundEntity } from '../../../src/server/database/entities/round.entity'

export const SECRET_MATCH_COMMENT = 'SECRET-MATCH-COMMENT-A13'
export const SECRET_EDITION_COMMENT = 'SECRET-EDITION-COMMENT-R4'
export const SECRET_PHONE = '+33600000042'
/** Score saisi (non validé) : il ne doit apparaître nulle part dans une réponse publique. */
export const RECORDED_SCORES: [number, number] = [4, 2]

export interface IPublicFixture {
  editions: { legacyA: EditionEntity, legacyB: EditionEntity, live: EditionEntity }
  liveMatches: { validated: MatchEntity, recorded: MatchEntity, scheduled: MatchEntity }
  liveParticipations: ParticipationEntity[]
  validatedDraw: DrawEntity
  draftDraw: DrawEntity
}

interface IMatchSeed {
  edition: EditionEntity
  round: RoundEntity
  pool?: PoolEntity
  sequence: number
  status: MATCH_STATUS
  sides: [ParticipationEntity, number | null, number | null][]
  purpose?: MATCH_PURPOSE
  validatedAt?: Date
}

/** Jeu de données minimal mais complet pour les lectures publiques (B-06). */
export const seedPublicEditions = async (dataSource: DataSource): Promise<IPublicFixture> => {
  const competitorRepo = dataSource.getRepository(CompetitorEntity)
  const editionRepo = dataSource.getRepository(EditionEntity)
  const participationRepo = dataSource.getRepository(ParticipationEntity)
  const matchRepo = dataSource.getRepository(MatchEntity)

  const names = ['Alice', 'Bruno', 'Chloé', 'David', 'Emma', 'Farid']
  const competitors = await competitorRepo.save(names.map((displayName) => ({ displayName, phone: SECRET_PHONE })))

  const createEdition = (code: string, year: number, rank: number, extra: Partial<EditionEntity>) =>
    editionRepo.save({ code, year, chronologicalRank: rank, comment: SECRET_EDITION_COMMENT, ...extra })

  const legacyA = await createEdition('2012a', 2012, 1, {
    status: EDITION_STATUS.CLOSED,
    origin: EDITION_ORIGIN.LEGACY_IMPORT,
    participantCount: 16,
    closedAt: new Date('2012-06-01T00:00:00Z')
  })
  const legacyB = await createEdition('2012b', 2012, 2, {
    status: EDITION_STATUS.CLOSED,
    origin: EDITION_ORIGIN.LEGACY_IMPORT,
    participantCount: 16,
    closedAt: new Date('2012-12-01T00:00:00Z')
  })
  const live = await createEdition('2026', 2026, 3, {
    status: EDITION_STATUS.POOLS_PLAYING,
    origin: EDITION_ORIGIN.APP
  })

  const participate = (edition: EditionEntity, indexes: number[], extra: (i: number) => Partial<ParticipationEntity> = () => ({})) =>
    participationRepo.save(indexes.map((i) => ({ editionId: edition.id, competitorId: competitors[i]!.id, ...extra(i) })))

  // 2012a : 11 listés sur 16 déclarés dans le classeur ; ici 4 pour garder le jeu petit.
  const partsA = await participate(legacyA, [0, 1, 2, 3], (i) => i === 0 ? { finalStage: FINAL_STAGE.CHAMPION, status: PARTICIPATION_STATUS.WINNER, points: 5.76 } : {})
  const partsB = await participate(legacyB, [0, 1, 2], (i) => i === 0 ? { finalStage: FINAL_STAGE.CHAMPION, status: PARTICIPATION_STATUS.WINNER } : {})

  const poolLive = await dataSource.getRepository(PoolEntity).save({ editionId: live.id, rank: 1 })
  const liveParts = await participate(live, [0, 1, 2, 3], () => ({ poolId: poolLive.id, status: PARTICIPATION_STATUS.IN_POOL }))

  const roundRepo = dataSource.getRepository(RoundEntity)
  const roundA = await roundRepo.save({ editionId: legacyA.id, kind: ROUND_KIND.POOLS, sequence: 1, status: ROUND_STATUS.COMPLETED })
  const roundLive = await roundRepo.save({ editionId: live.id, kind: ROUND_KIND.POOLS, sequence: 1, status: ROUND_STATUS.PLAYING })
  await roundRepo.save({ editionId: live.id, kind: ROUND_KIND.FINAL, sequence: 2, status: ROUND_STATUS.PENDING })

  const createMatch = async (seed: IMatchSeed): Promise<MatchEntity> => {
    const match = await matchRepo.save({
      editionId: seed.edition.id,
      roundId: seed.round.id,
      poolId: seed.pool?.id ?? null,
      sequence: seed.sequence,
      targetScore: 5,
      status: seed.status,
      purpose: seed.purpose ?? MATCH_PURPOSE.REGULAR,
      comment: SECRET_MATCH_COMMENT,
      validatedAt: seed.validatedAt ?? null
    })
    await dataSource.getRepository(MatchSideEntity).save(seed.sides.map(([participation, recorded, validated], index) => ({
      matchId: match.id,
      position: index + 1,
      participationId: participation.id,
      recordedScore: recorded,
      validatedScore: validated
    })))
    return match
  }

  // Archive : un match avec score, un au résultat inconnu.
  await createMatch({
    edition: legacyA, round: roundA, sequence: 1, status: MATCH_STATUS.VALIDATED,
    sides: [[partsA[0]!, null, 5], [partsA[1]!, null, 3]], validatedAt: new Date('2012-05-01T10:00:00Z')
  })
  await createMatch({
    edition: legacyA, round: roundA, sequence: 2, status: MATCH_STATUS.RESULT_UNKNOWN,
    sides: [[partsA[2]!, null, null], [partsA[3]!, null, null]]
  })
  await createMatch({
    edition: legacyB, round: await roundRepo.save({ editionId: legacyB.id, kind: ROUND_KIND.POOLS, sequence: 1, status: ROUND_STATUS.COMPLETED }),
    sequence: 1, status: MATCH_STATUS.VALIDATED,
    sides: [[partsB[0]!, null, 5], [partsB[1]!, null, 1]], validatedAt: new Date('2012-11-01T10:00:00Z')
  })

  // Édition en cours : validé, saisi non validé, à jouer.
  const validated = await createMatch({
    edition: live, round: roundLive, pool: poolLive, sequence: 1, status: MATCH_STATUS.VALIDATED,
    sides: [[liveParts[0]!, 5, 5], [liveParts[1]!, 2, 2]], validatedAt: new Date('2026-10-01T20:00:00Z')
  })
  const recorded = await createMatch({
    edition: live, round: roundLive, pool: poolLive, sequence: 2, status: MATCH_STATUS.RECORDED,
    sides: [[liveParts[2]!, RECORDED_SCORES[0], null], [liveParts[3]!, RECORDED_SCORES[1], null]]
  })
  const scheduled = await createMatch({
    edition: live, round: roundLive, pool: poolLive, sequence: 3, status: MATCH_STATUS.SCHEDULED,
    sides: [[liveParts[0]!, null, null], [liveParts[2]!, null, null]]
  })

  const drawRepo = dataSource.getRepository(DrawEntity)
  const validatedDraw = await drawRepo.save({
    editionId: live.id, kind: DRAW_KIND.POOLS, status: DRAW_STATUS.VALIDATED,
    parameters: { poolCount: 1, seedCount: 1 }, validatedAt: new Date('2026-09-30T18:00:00Z')
  })
  const draftDraw = await drawRepo.save({
    editionId: live.id, kind: DRAW_KIND.ROUND, roundId: roundLive.id, status: DRAW_STATUS.DRAFT,
    parameters: { poolCount: 1, seedCount: 0 }
  })
  const assignmentRepo = dataSource.getRepository(DrawAssignmentEntity)
  await assignmentRepo.save(liveParts.map((participation, index) => ({
    drawId: validatedDraw.id, participationId: participation.id, poolId: poolLive.id, drawnOrder: index + 1
  })))
  await assignmentRepo.save({ drawId: draftDraw.id, participationId: liveParts[0]!.id, drawnOrder: 1 })

  return {
    editions: { legacyA, legacyB, live },
    liveMatches: { validated, recorded, scheduled },
    liveParticipations: liveParts,
    validatedDraw,
    draftDraw
  }
}
