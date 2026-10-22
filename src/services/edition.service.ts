import type { IAdminParticipant, ICreateEditionRequest, IEditionChampion, IEditionDetail, IEditionParticipant, IEditionSummary, IUpdateEditionRequest } from '../interfaces/edition.interface.js'
import type { IMatch } from '../interfaces/match.interface.js'
import type { IPaginated } from '../interfaces/pagination.interface.js'
import type { IArchiveStats } from '../interfaces/stats.interface.js'
import type { IEditionMatchesQuery, IBaseServiceOptions } from '../interfaces/api-client.interface.js'
import { BaseService } from './base.service.js'
import { In, QueryFailedError } from 'typeorm'
import type { DataSource, EntityManager } from 'typeorm'
import { API_ERROR_CODE } from '../enums/api-error-code.enum.js'
import { DRAW_KIND, DRAW_STATUS } from '../enums/draw.enum.js'
import { EDITION_ORIGIN, EDITION_STATUS } from '../enums/edition.enum.js'
import { FINAL_STAGE } from '../enums/participation.enum.js'
import { MATCH_STATUS } from '../enums/match.enum.js'
import type { IDraw } from '../interfaces/draw.interface.js'
import { API_ERROR_MESSAGE } from '../consts/api-error.const.js'
import { EDITION_COMPUTED_UNIQUE_CONSTRAINTS, EDITION_CREATION_LOCK_KEY, MATCH_PUBLIC_RELATIONS, PARTICIPANT_EDITABLE_STATUSES } from '../consts/edition.const.js'
import { PG_UNIQUE_VIOLATION } from '../consts/invitation.const.js'
import { InvitationEntity } from '../server/db/typeorm/entities/invitation.entity.js'
import { UserEntity } from '../server/db/typeorm/entities/user.entity.js'
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
import { competitorNotFound, conflictWithCode, notFound } from '../utils/api-error.util.js'
import { toAdminParticipantAccount } from '../utils/account-state.util.js'
import { buildEditionCode } from '../utils/edition-code.util.js'
import { toEditionParticipant } from '../utils/edition-assemble.util.js'
import { buildPaginated } from '../utils/pagination.util.js'
import { toPublicMatch, toStoredMatchStatuses } from '../utils/match-public.mapper.util.js'
import { isEditionUuid } from '../utils/edition-query.util.js'
import { loadCareers } from './competitor.service.js'

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
    return this.request<IArchiveStats>('/stats')
  }

  list (): Promise<IEditionSummary[]> {
    return this.request<IEditionSummary[]>('/editions')
  }

  detail (id: string): Promise<IEditionDetail> {
    return this.request<IEditionDetail>(`/editions/${encodeURIComponent(id)}`)
  }

  matches (id: string, query: IEditionMatchesQuery = {}): Promise<IPaginated<IMatch>> {
    return this.request<IPaginated<IMatch>>(`/editions/${encodeURIComponent(id)}/matchs`, { query: { ...query, statut: query.statut?.join(',') } })
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
  const [lastMatchValidatedAt, publicMatchCount, lastDrawValidatedAt, participationCount, lastCompetitorUpdatedAt] = await Promise.all([
    maxOf(matchRepo.createQueryBuilder('m').select('MAX(m.validatedAt)', 'latest')
      .where({ editionId: edition.id, status: publicStatuses })),
    matchRepo.countBy({ editionId: edition.id, status: publicStatuses }),
    maxOf(drawRepo.createQueryBuilder('d').select('MAX(d.validatedAt)', 'latest')
      .where({ editionId: edition.id, status: DRAW_STATUS.VALIDATED })),
    dataSource.getRepository(ParticipationEntity).countBy({ editionId: edition.id }),
    maxOf(dataSource.getRepository(CompetitorEntity).createQueryBuilder('c').select('MAX(c.updatedAt)', 'latest')
      .innerJoin(ParticipationEntity, 'p', 'p.competitorId = c.id')
      .where('p.editionId = :editionId', { editionId: edition.id }))
  ])
  return {
    status: edition.status,
    lastMatchValidatedAt,
    publicMatchCount: publicMatchCount,
    lastDrawValidatedAt,
    participationCount,
    generalInfo: [edition.name, edition.heldOn, edition.location, edition.description],
    lastCompetitorUpdatedAt
  }
}

/*********************************************************
 * Écritures administrateur (B-10)
 ********************************************************/

const isUniqueViolation = (error: unknown): boolean =>
  error instanceof QueryFailedError && (error.driverError as { code?: string } | undefined)?.code === PG_UNIQUE_VIOLATION

const editionClosed = () => conflictWithCode(API_ERROR_CODE.EDITION_CLOSED, API_ERROR_MESSAGE.EDITION_CLOSED)
const registrationClosed = () => conflictWithCode(API_ERROR_CODE.REGISTRATION_CLOSED, API_ERROR_MESSAGE.REGISTRATION_CLOSED)
const alreadyRegistered = () =>
  conflictWithCode(API_ERROR_CODE.PARTICIPANT_ALREADY_REGISTERED, API_ERROR_MESSAGE.PARTICIPANT_ALREADY_REGISTERED)

/**
 * Prend le verrou global de création d'édition, jusqu'à la fin de la transaction. SQL brut assumé :
 * `pg_advisory_xact_lock` est un appel de fonction PostgreSQL, TypeORM n'a pas d'API pour cela et il ne touche à aucune donnée.
 */
const acquireEditionCreationLock = async (manager: EntityManager): Promise<void> => {
  await manager.query('SELECT pg_advisory_xact_lock($1)', [EDITION_CREATION_LOCK_KEY])
}

const isComputedFieldCollision = (error: unknown): boolean =>
  error instanceof QueryFailedError
  && (error.driverError as { code?: string, constraint?: string } | undefined)?.code === PG_UNIQUE_VIOLATION
  && EDITION_COMPUTED_UNIQUE_CONSTRAINTS.includes((error.driverError as { constraint?: string }).constraint ?? '')

/** Crée l'édition. `code` et `chronological_rank` sont calculés sous verrou : deux créations simultanées ne se marchent pas dessus. */
export const createEdition = (dataSource: DataSource, input: ICreateEditionRequest): Promise<EditionEntity> =>
  dataSource.transaction(async (manager) => {
    await acquireEditionCreationLock(manager)
    const repository = manager.getRepository(EditionEntity)
    const sameYear = await repository.find({ where: { year: input.year }, select: { code: true } })
    const code = buildEditionCode(input.year, sameYear.map((edition) => edition.code))
    if (code === null) {
      throw conflictWithCode(API_ERROR_CODE.EDITION_CODE_EXHAUSTED, API_ERROR_MESSAGE.EDITION_CODE_EXHAUSTED)
    }
    const { max } = (await repository.createQueryBuilder('e').select('MAX(e.chronologicalRank)', 'max').getRawOne<{ max: number | null }>())!
    return repository.save(repository.create({
      code,
      year: input.year,
      chronologicalRank: (max ?? 0) + 1,
      name: input.name,
      heldOn: input.heldOn ?? null,
      description: input.description ?? null,
      location: input.location ?? null,
      status: EDITION_STATUS.CREATED,
      origin: EDITION_ORIGIN.APP,
      participantCount: null,
      closedAt: null,
      comment: null
    }))
  }).catch((error: unknown) => {
    // Insertion concurrente hors verrou (import, script) : 409 neutre plutôt qu'un 500.
    throw isComputedFieldCollision(error) ? conflictWithCode(API_ERROR_CODE.EDITION_CONFLICT, API_ERROR_MESSAGE.EDITION_CONFLICT) : error
  })

const findEditionLocked = async (manager: EntityManager, idOrCode: string): Promise<EditionEntity> => {
  const edition = await manager.getRepository(EditionEntity).findOne({
    where: isEditionUuid(idOrCode) ? { id: idOrCode } : { code: idOrCode },
    lock: { mode: 'pessimistic_write' }
  })
  if (!edition) {
    throw notFound(API_ERROR_MESSAGE.EDITION_NOT_FOUND)
  }
  return edition
}

/** Informations générales uniquement (liste blanche du schéma). 409 si l'édition est CLOSED. */
export const updateEdition = (dataSource: DataSource, idOrCode: string, patch: IUpdateEditionRequest): Promise<EditionEntity> =>
  dataSource.transaction(async (manager) => {
    const edition = await findEditionLocked(manager, idOrCode)
    if (edition.status === EDITION_STATUS.CLOSED) {
      throw editionClosed()
    }
    const changes: Partial<EditionEntity> = {}
    if (patch.name !== undefined) changes.name = patch.name
    if (patch.heldOn !== undefined) changes.heldOn = patch.heldOn
    if (patch.description !== undefined) changes.description = patch.description
    if (patch.location !== undefined) changes.location = patch.location
    return manager.getRepository(EditionEntity).save(Object.assign(edition, changes))
  })

const hasPoolsDraw = (manager: EntityManager, editionId: string, status?: DRAW_STATUS): Promise<boolean> =>
  manager.getRepository(DrawEntity).existsBy({ editionId, kind: DRAW_KIND.POOLS, ...(status ? { status } : {}) })

/**
 * Rattache un compétiteur à l'édition, en une transaction. `resolveCompetitor` fournit le compétiteur dans cette
 * transaction : un compétiteur existant (404 sinon), ou, pour `{ newCompetitor }`, le service de création de B-09.
 * La première inscription fait passer l'édition de CREATED à REGISTRATION.
 */
export const addParticipant = (
  dataSource: DataSource,
  idOrCode: string,
  resolveCompetitor: (manager: EntityManager) => Promise<CompetitorEntity>
): Promise<{ edition: EditionEntity, participant: IEditionParticipant }> =>
  dataSource.transaction(async (manager) => {
    const edition = await findEditionLocked(manager, idOrCode)
    if (edition.status === EDITION_STATUS.CLOSED) {
      throw editionClosed()
    }
    if (!PARTICIPANT_EDITABLE_STATUSES.includes(edition.status) || await hasPoolsDraw(manager, edition.id, DRAW_STATUS.VALIDATED)) {
      throw registrationClosed()
    }

    const competitor = await resolveCompetitor(manager)
    const participations = manager.getRepository(ParticipationEntity)
    if (await participations.existsBy({ editionId: edition.id, competitorId: competitor.id })) {
      throw alreadyRegistered()
    }
    let saved: ParticipationEntity
    try {
      saved = await participations.save(participations.create({ editionId: edition.id, competitorId: competitor.id }))
    } catch (error) {
      throw isUniqueViolation(error) ? alreadyRegistered() : error
    }
    if (edition.status === EDITION_STATUS.CREATED) {
      edition.status = EDITION_STATUS.REGISTRATION
      await manager.getRepository(EditionEntity).save(edition)
    }
    const stored = await participations.findOneOrFail({ where: { id: saved.id }, relations: { competitor: true } })
    return { edition, participant: toEditionParticipant(stored) }
  })

/** Rattache un compétiteur déjà connu : 404 `COMPETITOR_NOT_FOUND` s'il n'existe pas. */
export const findExistingCompetitor = (competitorId: string) => async (manager: EntityManager): Promise<CompetitorEntity> => {
  const competitor = await manager.getRepository(CompetitorEntity).findOneBy({ id: competitorId })
  if (!competitor) {
    throw competitorNotFound()
  }
  return competitor
}

/**
 * Retrait d'un inscrit, permis tant que le tirage des poules n'est pas validé (Q1). Dans la même transaction, son
 * affectation dans un brouillon est supprimée. 409 `REGISTRATION_CLOSED` une fois le tirage validé.
 */
export const removeParticipant = (dataSource: DataSource, idOrCode: string, participationId: string): Promise<EditionEntity> =>
  dataSource.transaction(async (manager) => {
    const edition = await findEditionLocked(manager, idOrCode)
    if (edition.status === EDITION_STATUS.CLOSED) {
      throw editionClosed()
    }
    if (!PARTICIPANT_EDITABLE_STATUSES.includes(edition.status) || await hasPoolsDraw(manager, edition.id, DRAW_STATUS.VALIDATED)) {
      throw registrationClosed()
    }
    const participations = manager.getRepository(ParticipationEntity)
    const participation = await participations.findOneBy({ id: participationId, editionId: edition.id })
    if (!participation) {
      throw notFound(API_ERROR_MESSAGE.PARTICIPATION_NOT_FOUND)
    }
    // Explicite, même si la clé étrangère est en CASCADE : le brouillon ne doit jamais garder un joueur retiré.
    await manager.getRepository(DrawAssignmentEntity).delete({ participationId: participation.id })
    await participations.delete({ id: participation.id })
    return edition
  })

/**
 * Vue administrateur des inscrits : participants publics + éditions jouées + état du compte. Ni email ni téléphone.
 * `editionsPlayed` vient de `loadCareers` (B-05), le même calcul que la liste des compétiteurs.
 */
export const loadAdminParticipants = async (dataSource: DataSource, idOrCode: string, now = new Date()): Promise<IAdminParticipant[]> => {
  const edition = await findEditionOrThrow(dataSource, idOrCode)
  const participations = await loadParticipations(dataSource, edition.id)
  if (participations.length === 0) {
    return []
  }
  const competitorIds = participations.map((participation) => participation.competitorId)
  const [careers, users] = await Promise.all([
    loadCareers(dataSource),
    dataSource.getRepository(UserEntity).find({ where: { competitorId: In(competitorIds) }, select: { id: true, competitorId: true, status: true } })
  ])
  const invitations = users.length === 0
    ? []
    : await dataSource.getRepository(InvitationEntity).find({
      where: { userId: In(users.map((user) => user.id)) },
      order: { createdAt: 'DESC', id: 'DESC' }
    })
  const userByCompetitor = new Map(users.map((user) => [user.competitorId, user]))
  // Trié du plus récent au plus ancien : la première invitation rencontrée par compte est la plus récente.
  const latestInvitation = new Map<string, InvitationEntity>()
  for (const invitation of invitations) {
    if (!latestInvitation.has(invitation.userId)) {
      latestInvitation.set(invitation.userId, invitation)
    }
  }

  return participations.map((participation): IAdminParticipant => {
    const user = userByCompetitor.get(participation.competitorId)
    return {
      ...toEditionParticipant(participation),
      editionsPlayed: careers.get(participation.competitorId)?.editionsPlayed ?? 0,
      account: user
        ? toAdminParticipantAccount({ status: user.status, latestInvitation: latestInvitation.get(user.id) ?? null }, now)
        : null
    }
  })
}
