import { In } from 'typeorm'
import type {
  IRankingEvolutionPoint,
  IRankingEvolutionSeries,
  IRankingRow
} from '../../interfaces/ranking.interface'
import type { RANKING_TYPE } from '../../enums/ranking.enum'
import { CompetitorEntity } from '../database/entities/competitor.entity'
import { EditionEntity } from '../database/entities/edition.entity'
import { ParticipationEntity } from '../database/entities/participation.entity'
import type { IRankingSource } from '../interfaces/ranking.interface'
import { toCompetitorPublic } from '../utils/competitor/competitor-public.mapper.util'
import { notFound } from '../utils/http/api-error.util'
import { buildEvolutionSeries, buildRankingRows } from '../utils/ranking/public-ranking.util'

/** Lit tout le périmètre (quelques milliers de lignes) ; le calcul est fait à la lecture, sans cache. */
async function loadSource(): Promise<IRankingSource> {
  const dataSource = await useDataSource()
  const [editionRows, participationRows] = await Promise.all([
    dataSource.getRepository(EditionEntity).find(),
    dataSource.getRepository(ParticipationEntity).find({
      select: { competitorId: true, editionId: true, points: true, finalStage: true },
    }),
  ])
  const competitorRows = await dataSource.getRepository(CompetitorEntity).find({
    where: { id: In([...new Set(participationRows.map((row) => row.competitorId))]) },
  })
  return {
    competitors: new Map(competitorRows.map((row) => [row.id, toCompetitorPublic(row)])),
    editions: editionRows.map((row) => ({
      id: row.id,
      code: row.code,
      year: row.year,
      chronologicalRank: row.chronologicalRank,
      status: row.status,
    })),
    participations: participationRows.map((row) => ({
      playerId: row.competitorId,
      editionId: row.editionId,
      points: row.points,
      finalStage: row.finalStage,
    })),
  }
}

export async function getRanking(type: RANKING_TYPE): Promise<IRankingRow[]> {
  const { competitors, editions, participations } = await loadSource()
  return buildRankingRows(type, competitors, editions, participations)
}

export async function getEvolutionForAll(type: RANKING_TYPE): Promise<IRankingEvolutionSeries[]> {
  const { competitors, editions, participations } = await loadSource()
  return buildEvolutionSeries(type, competitors, editions, participations)
}

/** 404 si le compétiteur n'existe pas ; liste vide s'il existe sans participation classée. */
export async function getEvolutionForCompetitor(
  type: RANKING_TYPE,
  competitorId: string,
): Promise<IRankingEvolutionPoint[]> {
  const dataSource = await useDataSource()
  const exists = await dataSource.getRepository(CompetitorEntity).existsBy({ id: competitorId })
  if (!exists) {
    throw notFound()
  }
  const { competitors, editions, participations } = await loadSource()
  return buildEvolutionSeries(type, competitors, editions, participations, competitorId)[0]?.points ?? []
}
