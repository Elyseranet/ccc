import type { DataSource } from 'typeorm'
import { DRAW_KIND, DRAW_STATUS } from '../../../src/enums/draw.enum'
import { EDITION_ORIGIN, EDITION_STATUS } from '../../../src/enums/edition.enum'
import { MATCH_STATUS } from '../../../src/enums/match.enum'
import { PARTICIPATION_STATUS } from '../../../src/enums/participation.enum'
import { ROUND_KIND, ROUND_STATUS } from '../../../src/enums/round.enum'
import { CompetitorEntity } from '../../../src/server/db/typeorm/entities/competitor.entity'
import { DrawEntity } from '../../../src/server/db/typeorm/entities/draw.entity'
import { EditionEntity } from '../../../src/server/db/typeorm/entities/edition.entity'
import { MatchSideEntity } from '../../../src/server/db/typeorm/entities/match-side.entity'
import { MatchEntity } from '../../../src/server/db/typeorm/entities/match.entity'
import { ParticipationEntity } from '../../../src/server/db/typeorm/entities/participation.entity'
import { RoundEntity } from '../../../src/server/db/typeorm/entities/round.entity'

export interface IKnockoutFixture {
  edition: EditionEntity
  participations: ParticipationEntity[]
  semiOne: MatchEntity
  semiTwo: MatchEntity
  final: MatchEntity
  semiRound: RoundEntity
  finalRound: RoundEntity
}

interface IKnockoutOptions {
  code: string
  year: number
  chronologicalRank: number
  /** Un tirage (DRAFT) existe pour la finale : les demi-finales ne sont plus corrigibles (R-3). */
  withFinalDraw: boolean
}

/**
 * Phase finale minimale : deux demi-finales VALIDATED (cible 10) et une finale à jouer (tour DRAWN, donc ouvert).
 * Aucune dépendance à B-10 ni à B-11 : tout est semé directement en base.
 */
export const seedKnockoutEdition = async (dataSource: DataSource, options: IKnockoutOptions): Promise<IKnockoutFixture> => {
  const edition = await dataSource.getRepository(EditionEntity).save({
    code: options.code,
    year: options.year,
    chronologicalRank: options.chronologicalRank,
    status: EDITION_STATUS.PLAYOFFS,
    origin: EDITION_ORIGIN.APP
  })
  const competitors = await dataSource.getRepository(CompetitorEntity).save(
    ['K1', 'K2', 'K3', 'K4'].map((displayName) => ({ displayName: `${displayName}-${options.code}` }))
  )
  const participations = await dataSource.getRepository(ParticipationEntity).save(
    competitors.map((competitor) => ({
      editionId: edition.id,
      competitorId: competitor.id,
      status: PARTICIPATION_STATUS.QUALIFIED
    }))
  )
  const roundRepo = dataSource.getRepository(RoundEntity)
  const semiRound = await roundRepo.save({ editionId: edition.id, kind: ROUND_KIND.SEMI, sequence: 1, status: ROUND_STATUS.PLAYING })
  const finalRound = await roundRepo.save({ editionId: edition.id, kind: ROUND_KIND.FINAL, sequence: 2, status: ROUND_STATUS.DRAWN })

  const matchRepo = dataSource.getRepository(MatchEntity)
  const sideRepo = dataSource.getRepository(MatchSideEntity)
  const createMatch = async (
    round: RoundEntity,
    sequence: number,
    status: MATCH_STATUS,
    sides: [ParticipationEntity, number | null][]
  ): Promise<MatchEntity> => {
    const validated = status === MATCH_STATUS.VALIDATED
    const match = await matchRepo.save({
      editionId: edition.id,
      roundId: round.id,
      sequence,
      targetScore: 10,
      status,
      validatedAt: validated ? new Date('2027-01-01T20:00:00Z') : null
    })
    await sideRepo.save(sides.map(([participation, score], index) => ({
      matchId: match.id,
      position: index + 1,
      participationId: participation.id,
      recordedScore: score,
      validatedScore: validated ? score : null
    })))
    return match
  }
  const [k1, k2, k3, k4] = participations as [ParticipationEntity, ParticipationEntity, ParticipationEntity, ParticipationEntity]
  const semiOne = await createMatch(semiRound, 1, MATCH_STATUS.VALIDATED, [[k1, 10], [k3, 4]])
  const semiTwo = await createMatch(semiRound, 2, MATCH_STATUS.VALIDATED, [[k2, 10], [k4, 7]])
  const final = await createMatch(finalRound, 3, MATCH_STATUS.SCHEDULED, [[k1, null], [k2, null]])

  if (options.withFinalDraw) {
    await dataSource.getRepository(DrawEntity).save({
      editionId: edition.id,
      kind: DRAW_KIND.ROUND,
      roundId: finalRound.id,
      status: DRAW_STATUS.DRAFT,
      parameters: { poolCount: 1, seedCount: 0 }
    })
  }
  return { edition, participations, semiOne, semiTwo, final, semiRound, finalRound }
}
