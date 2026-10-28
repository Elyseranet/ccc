import 'reflect-metadata'
import type { DataSource } from 'typeorm'
import { COMPETITOR_ALIAS_SOURCE } from '../../../src/enums/competitor.enum'
import { EDITION_ORIGIN, EDITION_STATUS } from '../../../src/enums/edition.enum'
import { MATCH_PURPOSE, MATCH_STATUS } from '../../../src/enums/match.enum'
import { FINAL_STAGE } from '../../../src/enums/participation.enum'
import { ROUND_KIND, ROUND_STATUS } from '../../../src/enums/round.enum'
import { CompetitorAliasEntity } from '../../../src/server/db/typeorm/entities/competitor-alias.entity'
import { CompetitorEntity } from '../../../src/server/db/typeorm/entities/competitor.entity'
import { EditionEntity } from '../../../src/server/db/typeorm/entities/edition.entity'
import { MatchSideEntity } from '../../../src/server/db/typeorm/entities/match-side.entity'
import { MatchEntity } from '../../../src/server/db/typeorm/entities/match.entity'
import { ParticipationEntity } from '../../../src/server/db/typeorm/entities/participation.entity'
import { PoolEntity } from '../../../src/server/db/typeorm/entities/pool.entity'
import { RoundEntity } from '../../../src/server/db/typeorm/entities/round.entity'

export const PRIVATE_PHONE = '+33600000042'

export interface ICompetitorFixtures {
  nicolas: string
  remi: string
  remiPlain: string
  paul: string
  lonely: string
  editionA: string
  editionB: string
  editionACode: string
}

/** Recrée le schéma sur la base `_test` puis y pose un jeu de données minimal. */
export const resetAndSeedCompetitors = async (): Promise<{ dataSource: DataSource, ids: ICompetitorFixtures }> => {
  const dataSource = (await import('../../../src/server/db/typeorm/data-source')).default
  await dataSource.initialize()
  await dataSource.dropDatabase()
  await dataSource.runMigrations()

  const competitor = (displayName: string, extra: Partial<CompetitorEntity> = {}) =>
    dataSource.getRepository(CompetitorEntity).save({ displayName, phone: PRIVATE_PHONE, ...extra })
  const nicolas = await competitor('Nicolas Deseine', { firstName: 'Nicolas', lastName: 'Deseine' })
  const remi = await competitor('Rémi Durand', { firstName: 'Rémi', lastName: 'Durand' })
  const remiPlain = await competitor('Remi Petit', { nickname: 'Rem' })
  const paul = await competitor('Paul Martin')
  const lonely = await competitor('Zoé Sansscore')
  await competitor('100%_fun')

  await dataSource.getRepository(CompetitorAliasEntity).save({
    competitorId: paul.id,
    alias: 'Remy-Paulo',
    source: COMPETITOR_ALIAS_SOURCE.LEGACY_SCORES
  })

  const edition = (code: string, year: number, rank: number) =>
    dataSource.getRepository(EditionEntity).save({
      code, year, chronologicalRank: rank, origin: EDITION_ORIGIN.APP, status: EDITION_STATUS.CLOSED, name: `Édition ${code}`
    })
  const editionA = await edition('2020', 2020, 1)
  const editionB = await edition('2021', 2021, 2)

  const participation = (
    editionId: string,
    competitorId: string,
    finalStage: FINAL_STAGE | null = null,
    points: number | null = null,
    extra: Partial<ParticipationEntity> = {}
  ) => dataSource.getRepository(ParticipationEntity).save({ editionId, competitorId, finalStage, points, ...extra })
  // G2 : l'édition A a une poule n°2 ; Nicolas y est 1er (place), l'édition B n'a pas de poule.
  const poolA = await dataSource.getRepository(PoolEntity).save({ editionId: editionA.id, rank: 2 })
  const pa = {
    nicolas: await participation(editionA.id, nicolas.id, FINAL_STAGE.FINALIST, 12.5, { poolId: poolA.id, poolRank: 1 }),
    remi: await participation(editionA.id, remi.id, FINAL_STAGE.CHAMPION, 20, { poolId: poolA.id, poolRank: 2 }),
    paul: await participation(editionA.id, paul.id, null, null, { poolId: poolA.id, poolRank: 3 })
  }
  const pb = {
    nicolas: await participation(editionB.id, nicolas.id, FINAL_STAGE.CHAMPION, 30),
    // G4 : finaliste de l'édition B, battu 5-2 par Nicolas.
    remi: await participation(editionB.id, remi.id, FINAL_STAGE.FINALIST)
  }
  const lonelyB = await participation(editionB.id, lonely.id)

  const roundA = await dataSource.getRepository(RoundEntity).save({ editionId: editionA.id, kind: ROUND_KIND.POOLS, sequence: 1, status: ROUND_STATUS.COMPLETED })
  const roundB = await dataSource.getRepository(RoundEntity).save({ editionId: editionB.id, kind: ROUND_KIND.FINAL, sequence: 1, status: ROUND_STATUS.COMPLETED })

  let sequence = 0
  const match = async (
    editionId: string,
    roundId: string,
    status: MATCH_STATUS,
    sides: Array<[string, number | null]>,
    purpose = MATCH_PURPOSE.REGULAR
  ) => {
    sequence += 1
    const saved = await dataSource.getRepository(MatchEntity).save({
      editionId, roundId, poolId: roundId === roundA.id ? poolA.id : null, sequence, targetScore: 5, status, purpose, comment: 'private admin note'
    })
    await dataSource.getRepository(MatchSideEntity).save(sides.map(([participationId, validatedScore], index) => ({
      matchId: saved.id,
      position: index + 1,
      participationId,
      validatedScore,
      recordedScore: validatedScore
    })))
  }

  // Nicolas contre Rémi : 2 victoires, 1 défaite avec score, 1 résultat inconnu.
  await match(editionA.id, roundA.id, MATCH_STATUS.VALIDATED, [[pa.nicolas.id, 5], [pa.remi.id, 3]])
  await match(editionA.id, roundA.id, MATCH_STATUS.VALIDATED, [[pa.remi.id, 5], [pa.nicolas.id, 4]])
  await match(editionA.id, roundA.id, MATCH_STATUS.RESULT_UNKNOWN, [[pa.nicolas.id, null], [pa.remi.id, null]])
  await match(editionB.id, roundB.id, MATCH_STATUS.VALIDATED, [[pb.nicolas.id, 5], [pb.remi.id, 2]])
  // Exclus des bilans : départage, et score saisi non validé.
  await match(editionA.id, roundA.id, MATCH_STATUS.VALIDATED, [[pa.nicolas.id, 3], [pa.remi.id, 1]], MATCH_PURPOSE.TIEBREAK)
  await match(editionA.id, roundA.id, MATCH_STATUS.RECORDED, [[pa.nicolas.id, 5], [pa.remi.id, 0]])
  // G11 : une paire uniquement au résultat inconnu (Nicolas contre Zoé).
  await match(editionB.id, roundB.id, MATCH_STATUS.RESULT_UNKNOWN, [[pb.nicolas.id, null], [lonelyB.id, null]])
  // Nicolas contre Paul.
  await match(editionA.id, roundA.id, MATCH_STATUS.VALIDATED, [[pa.nicolas.id, 5], [pa.paul.id, 1]])

  return {
    dataSource,
    ids: {
      nicolas: nicolas.id,
      remi: remi.id,
      remiPlain: remiPlain.id,
      paul: paul.id,
      lonely: lonely.id,
      editionA: editionA.id,
      editionB: editionB.id,
      editionACode: editionA.code
    }
  }
}
