import type { IRankingEvolutionSeries, IRankingRow, IRankingEvolutionPoint, IRankingSource } from '../interfaces/ranking.interface.js'
import { API_ENDPOINT } from '../enums/api-endpoint.enum.js'
import { RANKING_KIND } from '../enums/ranking-kind.enum.js'
import type { IBaseServiceOptions } from '../interfaces/api-client.interface.js'
import { BaseService } from './base.service.js'
import { In } from 'typeorm'
import { CompetitorEntity } from '../server/db/typeorm/entities/competitor.entity.js'
import { EditionEntity } from '../server/db/typeorm/entities/edition.entity.js'
import { ParticipationEntity } from '../server/db/typeorm/entities/participation.entity.js'
import { toCompetitorPublic } from '../utils/competitor-public.mapper.util.js'
import { notFound } from '../utils/api-error.util.js'
import { buildEvolutionSeries, buildRankingRows } from '../utils/public-ranking.util.js'
import { useDataSource } from '../utils/database.util.js'

/*********************************************************
 * ranking.service
 *
 * @description
 * Service unique du domaine (ARCH-2) : la classe navigateur (`$fetch`, via BaseService) et les
 * lectures serveur (TypeORM). Les fonctions serveur ne sont jamais référencées par le code
 * navigateur : le build client les élague, et `tests/build/client-bundle.test.ts` le prouve.
 ********************************************************/

/*********************************************************
 * RankingService
 *
 * @description
 * Classements ACP et All Time (RG4) et évolution annuelle de tous les joueurs (RG8, C5).
 ********************************************************/
export class RankingService extends BaseService {
  constructor (options: IBaseServiceOptions = {}) {
    super(options)
  }

  ranking (kind: RANKING_KIND): Promise<IRankingRow[]> {
    const isAcp = kind === RANKING_KIND.ACP
    return this.resolve<IRankingRow[]>(
      isAcp ? API_ENDPOINT.RANKING_ACP : API_ENDPOINT.RANKING_ALL_TIME,
      () => this.request<IRankingRow[]>(isAcp ? '/classements/acp' : '/classements/all-time'),
      async () => (await import('../assets/fixtures/ranking.fixture.js')).rankingFixture(kind)
    )
  }

  evolution (kind: RANKING_KIND): Promise<IRankingEvolutionSeries[]> {
    return this.resolve<IRankingEvolutionSeries[]>(
      API_ENDPOINT.RANKING_EVOLUTION,
      () => this.request<IRankingEvolutionSeries[]>('/classements/evolution', { query: { type: kind } }),
      async () => (await import('../assets/fixtures/ranking.fixture.js')).evolutionFixture(kind)
    )
  }
}

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

export async function getRanking(type: RANKING_KIND): Promise<IRankingRow[]> {
  const { competitors, editions, participations } = await loadSource()
  return buildRankingRows(type, competitors, editions, participations)
}

export async function getEvolutionForAll(type: RANKING_KIND): Promise<IRankingEvolutionSeries[]> {
  const { competitors, editions, participations } = await loadSource()
  return buildEvolutionSeries(type, competitors, editions, participations)
}

/** 404 si le compétiteur n'existe pas ; liste vide s'il existe sans participation classée. */
export async function getEvolutionForCompetitor(
  type: RANKING_KIND,
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
