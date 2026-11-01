import type { DataSource, EntityManager } from 'typeorm'
import type { IBaseServiceOptions } from '../interfaces/api-client.interface.js'
import type {
  IAdminDraw,
  ICreatePoolDrawRequest,
  IDrawAssignmentInput,
  IDrawWriteOutcome,
  ISeedProposal,
  ISeedRankingContext,
  IUpdateDrawAssignmentsRequest
} from '../interfaces/draw.interface.js'
import type { IRankingEdition, IScoredParticipation, IStagedParticipation } from '../interfaces/ranking.interface.js'
import { API_ERROR_MESSAGE } from '../consts/api-error.const.js'
import { ADMIN_DRAW_RELATIONS, ASSIGNMENT_RELATIONS } from '../consts/draw.const.js'
import { PARTICIPANT_EDITABLE_STATUSES } from '../consts/edition.const.js'
import { API_ERROR_CODE } from '../enums/api-error-code.enum.js'
import { DRAW_KIND, DRAW_STATUS } from '../enums/draw.enum.js'
import { EDITION_STATUS } from '../enums/edition.enum.js'
import { MATCH_PURPOSE } from '../enums/match.enum.js'
import { PARTICIPATION_STATUS } from '../enums/participation.enum.js'
import { ROUND_KIND, ROUND_STATUS } from '../enums/round.enum.js'
import { DrawAssignmentEntity } from '../server/db/typeorm/entities/draw-assignment.entity.js'
import { DrawEntity } from '../server/db/typeorm/entities/draw.entity.js'
import { EditionEntity } from '../server/db/typeorm/entities/edition.entity.js'
import { MatchSideEntity } from '../server/db/typeorm/entities/match-side.entity.js'
import { MatchEntity } from '../server/db/typeorm/entities/match.entity.js'
import { ParticipationEntity } from '../server/db/typeorm/entities/participation.entity.js'
import { PoolEntity } from '../server/db/typeorm/entities/pool.entity.js'
import { RoundEntity } from '../server/db/typeorm/entities/round.entity.js'
import { badRequest, conflictWithCode, notFound } from '../utils/api-error.util.js'
import { toCompetitorPublic } from '../utils/competitor-public.mapper.util.js'
import { toAdminDraw } from '../utils/draw-public.mapper.util.js'
import { generateRoundRobin } from '../utils/round-robin.util.js'
import { targetScore } from '../utils/score-rules.util.js'
import { boundaryTies, competitionRank, isValidSeedSelection, rankSeedCandidates, countStagesReached } from '../utils/seeding.util.js'
import { computeAcp } from '../utils/ranking.util.js'
import { BaseService } from './base.service.js'
import { generateUuids } from '../utils/uuid.util.js'
import { editionClosed, findEditionLocked, findEditionOrThrow, registrationClosed } from './edition.service.js'

/*********************************************************
 * DrawService
 *
 * @description
 * Tirages, brouillons compris (C7). Service unique du domaine (ARCH-2) : la classe navigateur (`$fetch`, via BaseService)
 * et les fonctions serveur du tirage des poules (TypeORM, B-11) ; le code navigateur ne référence jamais ces dernières,
 * le build client les élague (`tests/build/client-bundle.test.ts`). L'écriture côté navigateur est ajoutée par F-11.
 ********************************************************/
export class DrawService extends BaseService {
  constructor (options: IBaseServiceOptions = {}) {
    super(options)
  }

  adminList (editionId: string): Promise<IAdminDraw[]> {
    return this.request<IAdminDraw[]>(`/admin/editions/${encodeURIComponent(editionId)}/tirages`)
  }
}

const drawAlreadyValidated = () =>
  conflictWithCode(API_ERROR_CODE.DRAW_ALREADY_VALIDATED, API_ERROR_MESSAGE.DRAW_ALREADY_VALIDATED)
const seedsInvalid = () => conflictWithCode(API_ERROR_CODE.DRAW_SEEDS_INVALID, API_ERROR_MESSAGE.DRAW_SEEDS_INVALID)
const drawIncomplete = () => conflictWithCode(API_ERROR_CODE.DRAW_INCOMPLETE, API_ERROR_MESSAGE.DRAW_INCOMPLETE)
const drawInconsistent = () => conflictWithCode(API_ERROR_CODE.DRAW_INCONSISTENT, API_ERROR_MESSAGE.DRAW_INCONSISTENT)
const seedWithdrawn = () => conflictWithCode(API_ERROR_CODE.DRAW_SEED_WITHDRAWN, API_ERROR_MESSAGE.DRAW_SEED_WITHDRAWN)

/** Le tirage chargé avec ses relations d'affichage, ses affectations triées et leurs relations. */
const loadAdminDraw = async (manager: EntityManager, drawId: string): Promise<IAdminDraw> => {
  const draw = await manager.getRepository(DrawEntity).findOneOrFail({ where: { id: drawId }, relations: ADMIN_DRAW_RELATIONS })
  const assignments = await manager.getRepository(DrawAssignmentEntity).find({
    where: { drawId },
    relations: ASSIGNMENT_RELATIONS,
    order: { drawnOrder: 'ASC' }
  })
  return toAdminDraw(draw, assignments)
}

/**
 * Verrous dans UN SEUL ordre partout : l'édition, puis le tirage (`FOR UPDATE` chacun). Une écriture qui part d'un
 * `drawId` lit d'abord son `editionId` sans verrou, verrouille l'édition, verrouille le tirage, puis revérifie que le
 * tirage existe encore (un brouillon remplacé entre-temps disparaît : 404) et appartient bien à cette édition. Aucun
 * verrou n'est pris dans l'ordre inverse, donc deux écritures simultanées se sérialisent sans interblocage.
 * 404 si le tirage n'existe pas ou n'est pas un tirage de poules.
 */
const lockEditionThenDraw = async (manager: EntityManager, drawId: string): Promise<{ draw: DrawEntity, edition: EditionEntity }> => {
  const peek = await manager.getRepository(DrawEntity).findOne({ where: { id: drawId }, select: { id: true, editionId: true, kind: true } })
  if (!peek || peek.kind !== DRAW_KIND.POOLS) {
    throw notFound(API_ERROR_MESSAGE.DRAW_NOT_FOUND)
  }
  const edition = await manager.getRepository(EditionEntity).findOneOrFail({ where: { id: peek.editionId }, lock: { mode: 'pessimistic_write' } })
  const draw = await manager.getRepository(DrawEntity).findOne({ where: { id: drawId }, lock: { mode: 'pessimistic_write' } })
  if (!draw || draw.editionId !== edition.id || draw.kind !== DRAW_KIND.POOLS) {
    throw notFound(API_ERROR_MESSAGE.DRAW_NOT_FOUND)
  }
  return { draw, edition }
}

/**
 * Une édition close ne se tire plus (EDITION_CLOSED). Au-delà de l'inscription, la réponse dit si c'est parce que le
 * tirage des poules est validé (DRAW_ALREADY_VALIDATED) ou parce que l'édition a simplement avancé (REGISTRATION_CLOSED).
 */
const assertEditionOpenForDraw = async (manager: EntityManager, edition: EditionEntity): Promise<void> => {
  if (edition.status === EDITION_STATUS.CLOSED) {
    throw editionClosed()
  }
  if (!PARTICIPANT_EDITABLE_STATUSES.includes(edition.status)) {
    const validated = await manager.getRepository(DrawEntity).existsBy({ editionId: edition.id, kind: DRAW_KIND.POOLS, status: DRAW_STATUS.VALIDATED })
    throw validated ? drawAlreadyValidated() : registrationClosed()
  }
}

const toRankingEdition = (edition: EditionEntity): IRankingEdition =>
  ({ id: edition.id, chronologicalRank: edition.chronologicalRank, status: edition.status })

/**
 * RG9, RG10 : les inscrits de l'édition classés pour les têtes de série. ACP sur les 5 dernières éditions CLOSED (A8),
 * puis titres, finales, demies… jusqu'au nombre de participations (éditions closes). Les identifiants du classement sont
 * des participationId : une égalité parfaite n'est jamais tranchée (RG10), elle remonte dans `unresolvedTies`.
 */
const loadSeedRanking = async (manager: EntityManager, editionId: string): Promise<ISeedRankingContext> => {
  const participations = await manager.getRepository(ParticipationEntity).find({
    where: { editionId },
    relations: { competitor: true },
    order: { id: 'ASC' }
  })
  const editions = await manager.getRepository(EditionEntity).find()
  const closedIds = new Set(editions.filter((edition) => edition.status === EDITION_STATUS.CLOSED).map((edition) => edition.id))
  const history = (await manager.getRepository(ParticipationEntity).find({
    select: { competitorId: true, editionId: true, points: true, finalStage: true }
  })).filter((row) => closedIds.has(row.editionId))

  const scored: IScoredParticipation[] = history
    .filter((row) => row.points !== null)
    .map((row) => ({ playerId: row.competitorId, editionId: row.editionId, points: row.points! }))
  const acp = new Map(computeAcp(scored, editions.map(toRankingEdition)).map((score) => [score.playerId, score.total]))
  const staged: IStagedParticipation[] = history
    .filter((row) => row.finalStage !== null)
    .map((row) => ({ playerId: row.competitorId, editionId: row.editionId, finalStage: row.finalStage! }))

  const acpByParticipation = new Map<string, number>()
  const candidates = participations.map((participation) => {
    const total = acp.get(participation.competitorId) ?? 0
    acpByParticipation.set(participation.id, total)
    const counters = countStagesReached(staged.filter((row) => row.playerId === participation.competitorId))
    return {
      playerId: participation.id,
      acp: total,
      ...counters,
      // Toutes les participations des éditions closes comptent, classées ou non (RG10, interprétation de seeding.util).
      participations: history.filter((row) => row.competitorId === participation.competitorId).length
    }
  })
  const { ranked, unresolvedTies } = rankSeedCandidates(candidates)
  return { ranked, unresolvedTies, acpByParticipation, participations }
}

/**
 * `GET /editions/{id}/tetes-de-serie?poules={n}` : propose les n têtes de série (RG9) et signale les égalités parfaites
 * qui chevauchent la frontière (RG10) : l'administrateur choisit alors parmi les ex æquo.
 */
export const loadSeedProposal = async (dataSource: DataSource, idOrCode: string, poolCount: number): Promise<ISeedProposal> => {
  const edition = await findEditionOrThrow(dataSource, idOrCode)
  const context = await loadSeedRanking(dataSource.manager, edition.id)
  if (poolCount > context.participations.length) {
    throw badRequest(API_ERROR_MESSAGE.DRAW_POOL_COUNT_INVALID)
  }
  const byId = new Map(context.participations.map((participation) => [participation.id, participation]))
  return {
    seeds: context.ranked.slice(0, poolCount).map((candidate) => ({
      participationId: candidate.playerId,
      competitor: toCompetitorPublic(byId.get(candidate.playerId)!.competitor),
      rank: competitionRank(context.ranked, candidate),
      acp: candidate.acp
    })),
    unresolvedTies: boundaryTies(context, poolCount)
  }
}

/**
 * `POST /editions/{id}/tirages/poules` : ouvre le brouillon du tirage. Un brouillon existant est remplacé (on recommence
 * le tirage). Les têtes de série sont enregistrées en premier (RG11), `drawnOrder` 1..n dans l'ordre reçu, sans poule.
 */
export const createPoolDraw = (
  dataSource: DataSource,
  idOrCode: string,
  userId: string,
  request: ICreatePoolDrawRequest
): Promise<IDrawWriteOutcome> =>
  dataSource.transaction(async (manager) => {
    const edition = await findEditionLocked(manager, idOrCode)
    await assertEditionOpenForDraw(manager, edition)
    const context = await loadSeedRanking(manager, edition.id)
    if (request.poolCount > context.participations.length) {
      throw badRequest(API_ERROR_MESSAGE.DRAW_POOL_COUNT_INVALID)
    }
    const seeds = new Set(request.seeds)
    // RG9 : autant de têtes de série que de poules ; des identifiants étrangers à l'édition ne sont jamais des têtes de série valables.
    if (request.seedCount !== request.poolCount || request.seeds.length !== request.seedCount || seeds.size !== request.seeds.length
      || !isValidSeedSelection(context.ranked, seeds)) {
      throw seedsInvalid()
    }

    await manager.getRepository(DrawEntity).delete({ editionId: edition.id, kind: DRAW_KIND.POOLS, status: DRAW_STATUS.DRAFT })
    const draw = await manager.getRepository(DrawEntity).save({
      editionId: edition.id,
      kind: DRAW_KIND.POOLS,
      roundId: null,
      status: DRAW_STATUS.DRAFT,
      parameters: { poolCount: request.poolCount, seedCount: request.seedCount },
      createdByUserId: userId
    })
    await manager.getRepository(DrawAssignmentEntity).insert(request.seeds.map((participationId, index) => ({
      drawId: draw.id,
      participationId,
      poolNumber: null,
      drawnOrder: index + 1
    })))
    return { draw: await loadAdminDraw(manager, draw.id), editionId: edition.id, replayed: false, matchCount: 0 }
  })

/**
 * Cohérence d'un brouillon (RG11) : `drawnOrder` distincts (des trous sont permis, un retrait d'inscrit en laisse un),
 * une participation une seule fois, numéros de poule de 1 à `poolCount`, les têtes de série (`drawnOrder` <= `seedCount`)
 * dans des poules deux à deux différentes.
 */
const assertAssignmentsConsistent = (assignments: readonly IDrawAssignmentInput[], poolCount: number, seedCount: number): void => {
  const distinctOrders = new Set(assignments.map((assignment) => assignment.drawnOrder)).size === assignments.length
  const distinctParticipations = new Set(assignments.map((assignment) => assignment.participationId)).size === assignments.length
  const inRange = assignments.every((assignment) => assignment.poolNumber <= poolCount)
  const seedPools = assignments.filter((assignment) => assignment.drawnOrder <= seedCount).map((assignment) => assignment.poolNumber)
  if (!distinctOrders || !distinctParticipations || !inRange || new Set(seedPools).size !== seedPools.length) {
    throw drawInconsistent()
  }
}

/**
 * `PUT /tirages/{id}/affectations` : enregistre le tirage physique (A1). Le contenu du brouillon est remplacé, donc
 * l'appel est idempotent. Chaque participation doit appartenir à l'édition du tirage (vérifié en base), et les têtes de
 * série fixées à la création restent les `seedCount` premières affectations.
 */
export const saveDrawAssignments = (
  dataSource: DataSource,
  drawId: string,
  request: IUpdateDrawAssignmentsRequest
): Promise<IDrawWriteOutcome> =>
  dataSource.transaction(async (manager) => {
    const { draw, edition } = await lockEditionThenDraw(manager, drawId)
    if (draw.status === DRAW_STATUS.VALIDATED) {
      throw drawAlreadyValidated()
    }
    await assertEditionOpenForDraw(manager, edition)
    const { poolCount, seedCount } = draw.parameters
    const { assignments } = request

    const participantIds = new Set((await manager.getRepository(ParticipationEntity).find({
      where: { editionId: draw.editionId }, select: { id: true }
    })).map((participation) => participation.id))
    const seedIds = new Set((await manager.getRepository(DrawAssignmentEntity).find({ where: { drawId } }))
      .filter((assignment) => assignment.drawnOrder <= seedCount)
      .map((assignment) => assignment.participationId))

    // Un retrait de tête de série (B-10) a supprimé son affectation : le brouillon ne peut plus se compléter.
    if (seedIds.size < seedCount) {
      throw seedWithdrawn()
    }
    const sentSeeds = new Set(assignments.filter((assignment) => assignment.drawnOrder <= seedCount).map((assignment) => assignment.participationId))
    const sameSeeds = sentSeeds.size === seedIds.size && [...seedIds].every((id) => sentSeeds.has(id))
    if (!assignments.every((assignment) => participantIds.has(assignment.participationId)) || !sameSeeds) {
      throw drawInconsistent()
    }
    assertAssignmentsConsistent(assignments, poolCount, seedCount)

    await manager.getRepository(DrawAssignmentEntity).delete({ drawId })
    if (assignments.length > 0) {
      await manager.getRepository(DrawAssignmentEntity).insert(assignments.map((assignment) => ({
        drawId,
        participationId: assignment.participationId,
        poolNumber: assignment.poolNumber,
        drawnOrder: assignment.drawnOrder
      })))
    }
    return { draw: await loadAdminDraw(manager, drawId), editionId: draw.editionId, replayed: false, matchCount: 0 }
  })

/**
 * `POST /tirages/{id}/validation` : fige le tirage, crée les poules, affecte les participants, génère le round-robin
 * (RG15) et passe l'édition à POOLS_DRAWN, en une transaction sous `SELECT … FOR UPDATE` sur le tirage. Idempotent :
 * rejouée sur un tirage VALIDATED, elle renvoie l'état courant sans regénérer de match (invariant 6).
 * Q2 : 409 tant qu'un inscrit n'est pas affecté. Le tour de poules est créé DRAWN (visible du public, scores ouverts).
 */
export const validatePoolDraw = (dataSource: DataSource, drawId: string, userId: string, now = new Date()): Promise<IDrawWriteOutcome> =>
  dataSource.transaction(async (manager) => {
    const { draw, edition } = await lockEditionThenDraw(manager, drawId)
    if (draw.status === DRAW_STATUS.VALIDATED) {
      return { draw: await loadAdminDraw(manager, drawId), editionId: draw.editionId, replayed: true, matchCount: 0 }
    }
    await assertEditionOpenForDraw(manager, edition)
    const { poolCount, seedCount } = draw.parameters
    const assignments = await manager.getRepository(DrawAssignmentEntity).find({ where: { drawId }, order: { drawnOrder: 'ASC' } })
    // Une tête de série retirée pendant le brouillon (B-10) : il faut recommencer le tirage, avant tout autre contrôle.
    if (assignments.filter((assignment) => assignment.drawnOrder <= seedCount).length < seedCount) {
      throw seedWithdrawn()
    }
    const participations = await manager.getRepository(ParticipationEntity).find({ where: { editionId: edition.id } })

    const assigned = new Set(assignments.map((assignment) => assignment.participationId))
    const participantIds = new Set(participations.map((participation) => participation.id))
    if (participations.some((participation) => !assigned.has(participation.id))) {
      throw drawIncomplete()
    }
    const ordered = assignments.map((assignment): IDrawAssignmentInput => ({
      participationId: assignment.participationId,
      poolNumber: assignment.poolNumber ?? 0,
      drawnOrder: assignment.drawnOrder
    }))
    // Un `poolNumber` null donne 0, hors de 1..poolCount : le brouillon est alors incohérent.
    if (assignments.some((assignment) => !participantIds.has(assignment.participationId) || (assignment.poolNumber ?? 0) < 1)) {
      throw drawInconsistent()
    }
    assertAssignmentsConsistent(ordered, poolCount, seedCount)
    // RG11 : une tête de série par poule, donc toutes les poules en ont une.
    const seedAssignments = ordered.filter((assignment) => assignment.drawnOrder <= seedCount)
    const seedPools = new Set(seedAssignments.map((assignment) => assignment.poolNumber))
    if (seedCount !== poolCount || seedAssignments.length !== seedCount || seedPools.size !== poolCount) {
      throw drawInconsistent()
    }

    const poolsRepository = manager.getRepository(PoolEntity)
    const roundsRepository = manager.getRepository(RoundEntity)
    if (await poolsRepository.existsBy({ editionId: edition.id }) || await roundsRepository.existsBy({ editionId: edition.id, kind: ROUND_KIND.POOLS })) {
      throw drawAlreadyValidated()
    }

    const poolIds = await generateUuids(poolCount)
    await poolsRepository.insert(poolIds.map((id, index) => ({ id, editionId: edition.id, rank: index + 1 })))
    const poolIdByNumber = new Map(poolIds.map((id, index) => [index + 1, id]))

    const members = new Map<number, string[]>()
    for (const assignment of ordered) {
      const poolId = poolIdByNumber.get(assignment.poolNumber)!
      const isSeed = assignment.drawnOrder <= seedCount
      await manager.getRepository(DrawAssignmentEntity).update({ drawId, participationId: assignment.participationId }, { poolId })
      await manager.getRepository(ParticipationEntity).update({ id: assignment.participationId }, {
        poolId,
        isSeed,
        seedRank: isSeed ? assignment.drawnOrder : null,
        status: PARTICIPATION_STATUS.IN_POOL
      })
      members.set(assignment.poolNumber, [...(members.get(assignment.poolNumber) ?? []), assignment.participationId])
    }

    const lastRound = await roundsRepository.createQueryBuilder('r').select('MAX(r.sequence)', 'max')
      .where('r.editionId = :editionId', { editionId: edition.id }).getRawOne<{ max: number | null }>()
    const round = await roundsRepository.save({
      editionId: edition.id,
      kind: ROUND_KIND.POOLS,
      sequence: (lastRound?.max ?? 0) + 1,
      status: ROUND_STATUS.DRAWN
    })

    const lastMatch = await manager.getRepository(MatchEntity).createQueryBuilder('m').select('MAX(m.sequence)', 'max')
      .where('m.editionId = :editionId', { editionId: edition.id }).getRawOne<{ max: number | null }>()
    let sequence = lastMatch?.max ?? 0
    const target = targetScore(ROUND_KIND.POOLS, MATCH_PURPOSE.REGULAR, 2)
    const pairs: Array<{ poolId: string, pair: [string, string] }> = []
    for (let number = 1; number <= poolCount; number += 1) {
      for (const pair of generateRoundRobin(members.get(number) ?? [])) {
        pairs.push({ poolId: poolIdByNumber.get(number)!, pair })
      }
    }
    if (pairs.length > 0) {
      const matchIds = await generateUuids(pairs.length)
      await manager.getRepository(MatchEntity).insert(pairs.map(({ poolId }, index) => {
        sequence += 1
        return { id: matchIds[index]!, editionId: edition.id, roundId: round.id, poolId, sequence, purpose: MATCH_PURPOSE.REGULAR, targetScore: target }
      }))
      await manager.getRepository(MatchSideEntity).insert(pairs.flatMap(({ pair }, index) =>
        pair.map((participationId, side) => ({ matchId: matchIds[index]!, position: side + 1, participationId }))))
    }

    await manager.getRepository(EditionEntity).update({ id: edition.id }, { status: EDITION_STATUS.POOLS_DRAWN })
    await manager.getRepository(DrawEntity).update({ id: drawId }, {
      status: DRAW_STATUS.VALIDATED,
      validatedAt: now,
      validatedByUserId: userId
    })
    return { draw: await loadAdminDraw(manager, drawId), editionId: edition.id, replayed: false, matchCount: pairs.length }
  })

/** `GET /admin/editions/{id}/tirages` (C7) : tous les tirages de l'édition, brouillons compris, avec auteur et horodatages. */
export const loadAdminDraws = async (dataSource: DataSource, idOrCode: string): Promise<IAdminDraw[]> => {
  const edition = await findEditionOrThrow(dataSource, idOrCode)
  const draws = await dataSource.getRepository(DrawEntity).find({
    where: { editionId: edition.id },
    relations: ADMIN_DRAW_RELATIONS,
    order: { createdAt: 'ASC', id: 'ASC' }
  })
  const result: IAdminDraw[] = []
  for (const draw of draws) {
    const assignments = await dataSource.getRepository(DrawAssignmentEntity).find({
      where: { drawId: draw.id }, relations: ASSIGNMENT_RELATIONS, order: { drawnOrder: 'ASC' }
    })
    result.push(toAdminDraw(draw, assignments))
  }
  return result
}
