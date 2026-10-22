import type { IEditionDetail, IEditionSummary, IEditionChampion } from '../interfaces/edition.interface.js'
import type { IMatch } from '../interfaces/match.interface.js'
import type { IPaginated } from '../interfaces/pagination.interface.js'
import type { IArchiveStats } from '../interfaces/stats.interface.js'
import { API_ENDPOINT } from '../enums/api-endpoint.enum.js'
import type { IEditionMatchesQuery, IBaseServiceOptions } from '../interfaces/api-client.interface.js'
import { BaseService } from './base.service.js'
import { In } from 'typeorm'
import type { DataSource } from 'typeorm'
import { DRAW_STATUS } from '../enums/draw.enum.js'
import { FINAL_STAGE } from '../enums/participation.enum.js'
import { MATCH_STATUS } from '../enums/match.enum.js'
import type { IDraw } from '../interfaces/draw.interface.js'
import { API_ERROR_MESSAGE } from '../consts/api-error.const.js'
import { MATCH_PUBLIC_RELATIONS } from '../consts/edition.const.js'
import { DrawAssignmentEntity } from '../server/db/typeorm/entities/draw-assignment.entity.js'
import { DrawEntity } from '../server/db/typeorm/entities/draw.entity.js'
import { CompetitorEntity } from '../server/db/typeorm/entities/competitor.entity.js'
import { EditionEntity } from '../server/db/typeorm/entities/edition.entity.js'
import { MatchEntity } from '../server/db/typeorm/entities/match.entity.js'
import { ParticipationEntity } from '../server/db/typeorm/entities/participation.entity.js'
import { PoolEntity } from '../server/db/typeorm/entities/pool.entity.js'
import { RoundEntity } from '../server/db/typeorm/entities/round.entity.js'
import { MATCH_SORT } from '../enums/match-sort.enum.js'
import type { IEditionContentStamp, IEditionMatchCounts, IMatchListQuery } from '../interfaces/edition-query.interface.js'
import { toCompetitorPublic } from '../utils/competitor-public.mapper.util.js'
import { toPublicDraw } from '../utils/draw-public.mapper.util.js'
import { notFound } from '../utils/api-error.util.js'
import { buildPaginated } from '../utils/pagination.util.js'
import { toPublicMatch, toStoredMatchStatuses } from '../utils/match-public.mapper.util.js'
import { isEditionUuid } from '../utils/edition-query.util.js'

/*********************************************************
 * edition.service
 *
 * @description
 * Service unique du domaine (ARCH-2) : la classe navigateur (`$fetch`, via BaseService) et les
 * lectures serveur (TypeORM). Les fonctions serveur ne sont jamais référencées par le code
 * navigateur : le build client les élague, et `tests/build/client-bundle.test.ts` le prouve.
 ********************************************************/

/*********************************************************
 * EditionService
 *
 * @description
 * Lecture des éditions, de leurs matchs et des compteurs d'archive (C1).
 ********************************************************/
export class EditionService extends BaseService {
  constructor (options: IBaseServiceOptions = {}) {
    super(options)
  }

  stats (): Promise<IArchiveStats> {
    return this.resolve<IArchiveStats>(
      API_ENDPOINT.STATS,
      () => this.request<IArchiveStats>('/stats'),
      async () => (await import('../assets/fixtures/edition.fixture.js')).STATS_FIXTURE
    )
  }

  list (): Promise<IEditionSummary[]> {
    return this.resolve<IEditionSummary[]>(
      API_ENDPOINT.EDITIONS,
      () => this.request<IEditionSummary[]>('/editions'),
      async () => (await import('../assets/fixtures/edition.fixture.js')).EDITIONS_FIXTURE
    )
  }

  detail (id: string): Promise<IEditionDetail> {
    return this.resolve<IEditionDetail>(
      API_ENDPOINT.EDITION,
      () => this.request<IEditionDetail>(`/editions/${encodeURIComponent(id)}`),
      async () => (await import('../assets/fixtures/edition.fixture.js')).editionDetailFixture(id)
    )
  }

  matches (id: string, query: IEditionMatchesQuery = {}): Promise<IPaginated<IMatch>> {
    return this.resolve<IPaginated<IMatch>>(
      API_ENDPOINT.EDITION_MATCHES,
      () => this.request<IPaginated<IMatch>>(`/editions/${encodeURIComponent(id)}/matchs`, { query: { ...query, statut: query.statut?.join(',') } }),
      async () => (await import('../assets/fixtures/edition.fixture.js')).editionMatchesFixture(id)
    )
  }
}

/** Accepte l'UUID ou le code (`2012a`). 404 si inconnue. */
export const findEditionOrThrow = async (dataSource: DataSource, idOrCode: string): Promise<EditionEntity> => {
  const where = isEditionUuid(idOrCode) ? { id: idOrCode } : { code: idOrCode }
  const edition = await dataSource.getRepository(EditionEntity).findOneBy(where)
  if (!edition) {
    throw notFound(API_ERROR_MESSAGE.EDITION_NOT_FOUND)
  }
  return edition
}

export const loadParticipations = (dataSource: DataSource, editionId: string): Promise<ParticipationEntity[]> =>
  dataSource.getRepository(ParticipationEntity).find({
    where: { editionId },
    relations: { competitor: true },
    order: { competitor: { displayName: 'ASC' }, id: 'ASC' }
  })

export const loadPoolEntities = (dataSource: DataSource, editionId: string): Promise<PoolEntity[]> =>
  dataSource.getRepository(PoolEntity).find({ where: { editionId }, order: { rank: 'ASC' } })

export const loadRoundEntities = (dataSource: DataSource, editionId: string): Promise<RoundEntity[]> =>
  dataSource.getRepository(RoundEntity).find({ where: { editionId }, order: { sequence: 'ASC' } })

/** Tous les matchs d'une édition, avec de quoi construire le DTO public. */
export const loadEditionMatches = (dataSource: DataSource, editionId: string): Promise<MatchEntity[]> =>
  dataSource.getRepository(MatchEntity).find({
    where: { editionId },
    relations: MATCH_PUBLIC_RELATIONS,
    order: { sequence: 'ASC' }
  })

export const loadPublicMatchPage = async (
  dataSource: DataSource,
  editionId: string,
  query: IMatchListQuery
): Promise<IPaginated<IMatch>> => {
  const { pagination, roundKind, poolRank, statuses, sort } = query
  const [matches, total] = await dataSource.getRepository(MatchEntity).findAndCount({
    where: {
      editionId,
      ...(roundKind ? { round: { kind: roundKind } } : {}),
      ...(poolRank === undefined ? {} : { pool: { rank: poolRank } }),
      ...(statuses ? { status: In(statuses.flatMap(toStoredMatchStatuses)) } : {})
    },
    relations: MATCH_PUBLIC_RELATIONS,
    order: sort === MATCH_SORT.VALIDATED_AT_DESC
      ? { validatedAt: { direction: 'DESC', nulls: 'LAST' }, sequence: 'DESC' }
      : { sequence: 'ASC' },
    skip: pagination.skip,
    take: pagination.take
  })
  return buildPaginated(matches.map(toPublicMatch), total, pagination)
}

/** Seuls les tirages VALIDATED sont publics : un brouillon n'est jamais lu ici. */
export const loadValidatedDraws = async (dataSource: DataSource, editionId: string): Promise<IDraw[]> => {
  const draws = await dataSource.getRepository(DrawEntity).find({
    where: { editionId, status: DRAW_STATUS.VALIDATED },
    relations: { round: true },
    order: { validatedAt: 'ASC', createdAt: 'ASC' }
  })
  if (draws.length === 0) {
    return []
  }
  const assignments = await dataSource.getRepository(DrawAssignmentEntity).find({
    where: { drawId: In(draws.map((draw) => draw.id)) },
    relations: { participation: { competitor: true } }
  })
  return draws.map((draw) => toPublicDraw(draw, assignments.filter((assignment) => assignment.drawId === draw.id)))
}

const loadMatchCounts = async (dataSource: DataSource, editionIds: string[]): Promise<Map<string, IEditionMatchCounts>> => {
  const rows = await dataSource.getRepository(MatchEntity).createQueryBuilder('m')
    .select('m.editionId', 'edition_id')
    .addSelect('COUNT(*)', 'total')
    .addSelect('COUNT(*) FILTER (WHERE m.status = :validated)', 'scored')
    .addSelect('COUNT(*) FILTER (WHERE m.status = :unknown)', 'unknown')
    .where('m.editionId IN (:...editionIds)', { editionIds })
    .setParameters({ validated: MATCH_STATUS.VALIDATED, unknown: MATCH_STATUS.RESULT_UNKNOWN })
    .groupBy('m.editionId')
    .getRawMany<{ edition_id: string, total: string, scored: string, unknown: string }>()
  return new Map(rows.map((row) => [
    row.edition_id,
    { total: Number(row.total), scored: Number(row.scored), unknown: Number(row.unknown) }
  ]))
}

const loadParticipationCounts = async (dataSource: DataSource, editionIds: string[]): Promise<Map<string, number>> => {
  const rows = await dataSource.getRepository(ParticipationEntity).createQueryBuilder('p')
    .select('p.editionId', 'edition_id')
    .addSelect('COUNT(*)', 'total')
    .where('p.editionId IN (:...editionIds)', { editionIds })
    .groupBy('p.editionId')
    .getRawMany<{ edition_id: string, total: string }>()
  return new Map(rows.map((row) => [row.edition_id, Number(row.total)]))
}

/** Champion de chaque édition close, avec ses titres cumulés à la date de l'édition (C1). */
const loadChampions = async (dataSource: DataSource): Promise<Map<string, IEditionChampion>> => {
  const winners = await dataSource.getRepository(ParticipationEntity).find({
    where: { finalStage: FINAL_STAGE.CHAMPION },
    relations: { competitor: true, edition: true }
  })
  const champions = new Map<string, IEditionChampion>()
  for (const winner of winners) {
    const titlesToDate = winners.filter((other) =>
      other.competitorId === winner.competitorId
      && other.edition.chronologicalRank <= winner.edition.chronologicalRank).length
    champions.set(winner.editionId, { competitor: toCompetitorPublic(winner.competitor), titlesToDate })
  }
  return champions
}

export const loadEditionSummaries = async (
  dataSource: DataSource,
  editions: EditionEntity[]
): Promise<IEditionSummary[]> => {
  if (editions.length === 0) {
    return []
  }
  const ids = editions.map((edition) => edition.id)
  const [matchCounts, participationCounts, champions] = await Promise.all([
    loadMatchCounts(dataSource, ids),
    loadParticipationCounts(dataSource, ids),
    loadChampions(dataSource)
  ])
  return editions.map((edition) => {
    const counts = matchCounts.get(edition.id)
    const listed = participationCounts.get(edition.id) ?? 0
    return {
      id: edition.id,
      code: edition.code,
      year: edition.year,
      name: edition.name,
      heldOn: edition.heldOn,
      location: edition.location,
      status: edition.status,
      origin: edition.origin,
      participantCount: edition.participantCount,
      unidentifiedParticipantCount: edition.participantCount === null
        ? null
        : Math.max(0, edition.participantCount - listed),
      matchCount: counts?.total ?? 0,
      scoredMatchCount: counts?.scored ?? 0,
      unknownResultMatchCount: counts?.unknown ?? 0,
      champion: champions.get(edition.id) ?? null
    }
  })
}

export const loadAllEditionSummaries = async (dataSource: DataSource): Promise<IEditionSummary[]> => {
  const editions = await dataSource.getRepository(EditionEntity).find({ order: { chronologicalRank: 'DESC' } })
  return loadEditionSummaries(dataSource, editions)
}

/** A16 : les matchs comptés sont les matchs joués (VALIDATED ou RESULT_UNKNOWN) ; un match à jouer n'en est pas un. */
export const loadArchiveStats = async (dataSource: DataSource): Promise<IArchiveStats> => {
  const [editions, competitors, scoredMatches, unknownResultMatches] = await Promise.all([
    dataSource.getRepository(EditionEntity).count(),
    dataSource.getRepository(CompetitorEntity).count(),
    dataSource.getRepository(MatchEntity).countBy({ status: MATCH_STATUS.VALIDATED }),
    dataSource.getRepository(MatchEntity).countBy({ status: MATCH_STATUS.RESULT_UNKNOWN })
  ])
  return { editions, competitors, matches: scoredMatches + unknownResultMatches, scoredMatches, unknownResultMatches }
}

const maxOf = async (query: { getRawOne: <T>() => Promise<T | undefined> }): Promise<string | null> => {
  const row = await query.getRawOne<{ latest: Date | null }>()
  return row?.latest?.toISOString() ?? null
}

/**
 * Empreinte du contenu PUBLIC d'une édition : dernier match validé, nombre de matchs publics,
 * dernier tirage validé, effectif. Un score saisi mais non validé ne la fait pas bouger : l'ETag
 * ne trahit donc pas une saisie (E-f). Le MAX passe par le QueryBuilder : `Repository.maximum`
 * convertit en nombre et perdrait la date.
 */
export const loadEditionContentStamp = async (
  dataSource: DataSource,
  edition: EditionEntity
): Promise<IEditionContentStamp> => {
  const publicStatuses = In([MATCH_STATUS.VALIDATED, MATCH_STATUS.RESULT_UNKNOWN])
  const matchRepo = dataSource.getRepository(MatchEntity)
  const drawRepo = dataSource.getRepository(DrawEntity)
  const [lastMatchValidatedAt, publicMatchCount, lastDrawValidatedAt, participationCount] = await Promise.all([
    maxOf(matchRepo.createQueryBuilder('m').select('MAX(m.validatedAt)', 'latest')
      .where({ editionId: edition.id, status: publicStatuses })),
    matchRepo.countBy({ editionId: edition.id, status: publicStatuses }),
    maxOf(drawRepo.createQueryBuilder('d').select('MAX(d.validatedAt)', 'latest')
      .where({ editionId: edition.id, status: DRAW_STATUS.VALIDATED })),
    dataSource.getRepository(ParticipationEntity).countBy({ editionId: edition.id })
  ])
  return {
    status: edition.status,
    lastMatchValidatedAt,
    publicMatchCount: publicMatchCount,
    lastDrawValidatedAt,
    participationCount
  }
}
