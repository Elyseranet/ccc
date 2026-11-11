import type { DataSource, EntityManager } from 'typeorm'
import { API_ERROR_MESSAGE } from '../consts/api-error.const.js'
import { POOLS_STAGE_STATUSES, PRE_POOLS_STATUSES } from '../consts/qualification.const.js'
import { ADMIN_MATCH_RELATIONS, OPEN_ROUND_STATUSES } from '../consts/match-score.const.js'
import { API_ERROR_CODE } from '../enums/api-error-code.enum.js'
import { EDITION_STATUS } from '../enums/edition.enum.js'
import { MATCH_PURPOSE, MATCH_STATUS } from '../enums/match.enum.js'
import { PARTICIPATION_STATUS, FINAL_STAGE } from '../enums/participation.enum.js'
import { MATCH_RECORD_KEY } from '../enums/match-record-key.enum.js'
import { ROUND_KIND } from '../enums/round.enum.js'
import type {
  IPoolContext,
  IQualificationComputation,
  IQualificationTie
} from '../interfaces/qualification-plan.interface.js'
import type {
  ICreateTiebreakRequest,
  IQualificationMember,
  IQualificationParameters,
  IQualificationResult,
  IQualificationStatus,
  IQualifiedParticipant,
  ITiebreakGroup
} from '../interfaces/qualification.interface.js'
import type { IAdminMatch } from '../interfaces/admin-match.interface.js'
import { EditionEntity } from '../server/db/typeorm/entities/edition.entity.js'
import { MatchSideEntity } from '../server/db/typeorm/entities/match-side.entity.js'
import { MatchEntity } from '../server/db/typeorm/entities/match.entity.js'
import { ParticipationEntity } from '../server/db/typeorm/entities/participation.entity.js'
import { PoolEntity } from '../server/db/typeorm/entities/pool.entity.js'
import { RoundEntity } from '../server/db/typeorm/entities/round.entity.js'
import { conflict, conflictWithCode, validationFailed } from '../utils/api-error.util.js'
import { toCompetitorPublic } from '../utils/competitor-public.mapper.util.js'
import { buildPools } from '../utils/edition-assemble.util.js'
import { toAdminMatch } from '../utils/match-admin.mapper.util.js'
import { toMatchRecord } from '../utils/match-record.mapper.util.js'
import { computeQualification, sameMembers } from '../utils/qualification-plan.util.js'
import { targetScore } from '../utils/score-rules.util.js'
import { generateUuids } from '../utils/uuid.util.js'
import { editionClosed, findEditionLocked, findEditionOrThrow } from './edition.service.js'

/*********************************************************
 * Qualification (B-13)
 *
 * @description
 * Arrêt de la liste des qualifiés à l'issue des poules (RG18), égalités à départager (RG19, RG20, A10, A11, R-1, R-2, R-6,
 * R-7) et création des matchs de départage. Les calculs sont dans `qualification-plan.util.ts` (fonctions pures) ; ce
 * service lit la base, verrouille l'édition et écrit. Les scores des départages passent par les routes de B-12.
 ********************************************************/

const notReady = (details?: Record<string, unknown>) =>
  conflictWithCode(API_ERROR_CODE.QUALIFICATION_NOT_READY, API_ERROR_MESSAGE.QUALIFICATION_NOT_READY, details)
const alreadyDone = () =>
  conflictWithCode(API_ERROR_CODE.QUALIFICATION_ALREADY_DONE, API_ERROR_MESSAGE.QUALIFICATION_ALREADY_DONE)
const tiebreakNotRequired = () =>
  conflictWithCode(API_ERROR_CODE.TIEBREAK_NOT_REQUIRED, API_ERROR_MESSAGE.TIEBREAK_NOT_REQUIRED)

/** Poules, inscrits en poule et matchs du tour de poules d'une édition. */
const loadPoolContext = async (manager: EntityManager, editionId: string): Promise<IPoolContext> => {
  const pools = await manager.getRepository(PoolEntity).find({ where: { editionId }, order: { rank: 'ASC' } })
  const participations = await manager.getRepository(ParticipationEntity).find({
    where: { editionId },
    relations: { competitor: true },
    order: { id: 'ASC' }
  })
  const matches = await manager.getRepository(MatchEntity).find({
    where: { editionId, round: { kind: ROUND_KIND.POOLS } },
    relations: { sides: true },
    order: { sequence: 'ASC' }
  })
  const poolInputs = pools.map((pool) => ({
    poolId: pool.id,
    memberIds: participations.filter((participation) => participation.poolId === pool.id).map((participation) => participation.id)
  }))
  const records = matches
    .filter((match) => match.status === MATCH_STATUS.VALIDATED || match.status === MATCH_STATUS.RESULT_UNKNOWN)
    .map((match) => toMatchRecord(match, MATCH_RECORD_KEY.PARTICIPATION))
  return { pools, participations, matches, poolInputs, records }
}

/** Les matchs REGULAR du tour de poules qui n'ont ni score validé ni résultat inconnu : ils bloquent. */
const countPendingRegular = (context: IPoolContext): number =>
  context.matches.filter((match) => match.purpose === MATCH_PURPOSE.REGULAR
    && match.status !== MATCH_STATUS.VALIDATED && match.status !== MATCH_STATUS.RESULT_UNKNOWN).length

/** Tous les matchs du tour de poules (départages compris) sans résultat : ils bloquent l'arrêt de la liste. */
const countPendingAll = (context: IPoolContext): number =>
  context.matches.filter((match) => match.status !== MATCH_STATUS.VALIDATED && match.status !== MATCH_STATUS.RESULT_UNKNOWN).length

/** Bornes liées à l'édition : le schéma a déjà contrôlé le type et les bornes absolues. 400 `VALIDATION_FAILED` sinon. */
const assertParametersWithinPools = (parameters: Pick<IQualificationParameters, 'topPerPool' | 'bestNextCount'>, context: IPoolContext): void => {
  const largestPool = Math.max(0, ...context.poolInputs.map((pool) => pool.memberIds.length))
  const details = [
    ...(parameters.topPerPool > largestPool ? [{ path: 'topPerPool', message: `Must be at most the size of the largest pool (${largestPool})` }] : []),
    ...(parameters.bestNextCount > context.pools.length ? [{ path: 'bestNextCount', message: `Must be at most the number of pools (${context.pools.length})` }] : [])
  ]
  if (details.length > 0) {
    throw validationFailed(details)
  }
}

export const toQualificationMember = (participation: ParticipationEntity): IQualificationMember =>
  ({ participationId: participation.id, competitor: toCompetitorPublic(participation.competitor) })

const toGroup = (tie: IQualificationTie, byId: Map<string, ParticipationEntity>): ITiebreakGroup => ({
  scope: tie.scope,
  poolId: tie.poolId,
  startRank: tie.startRank,
  format: tie.format,
  slots: tie.slots,
  members: tie.playerIds.map((id) => toQualificationMember(byId.get(id)!))
})

const toQualified = (computation: IQualificationComputation, byId: Map<string, ParticipationEntity>): IQualifiedParticipant[] | null =>
  computation.qualified === null
    ? null
    : computation.qualified.map((entry) => ({
      ...toQualificationMember(byId.get(entry.playerId)!),
      poolId: entry.poolId,
      poolRank: entry.poolRank,
      route: entry.route
    }))

const isListFinalized = (edition: EditionEntity): boolean =>
  edition.qualification !== null && ![...PRE_POOLS_STATUSES, ...POOLS_STAGE_STATUSES].includes(edition.status)

/**
 * `GET /admin/editions/{id}/qualification` : l'état de la qualification, sans rien écrire. `simulation` (n et m de la requête)
 * ne sert que tant que la liste n'est pas figée ; une fois figée, la configuration enregistrée prime.
 */
export const loadQualificationStatus = async (
  dataSource: DataSource,
  idOrCode: string,
  simulation: Pick<IQualificationParameters, 'topPerPool' | 'bestNextCount'> | null
): Promise<IQualificationStatus> => {
  const edition = await findEditionOrThrow(dataSource, idOrCode)
  const context = await loadPoolContext(dataSource.manager, edition.id)
  const listFinalized = isListFinalized(edition)
  const parameters = listFinalized ? edition.qualification : simulation ? { ...simulation, withPlayoff: false } : null
  if (!listFinalized && simulation) {
    assertParametersWithinPools(simulation, context)
  }
  const computation = computeQualification(context.poolInputs, context.records, parameters)
  const byId = new Map(context.participations.map((participation) => [participation.id, participation]))
  const tiebreakMatches = await dataSource.getRepository(MatchEntity).find({
    where: { editionId: edition.id, purpose: MATCH_PURPOSE.TIEBREAK },
    relations: ADMIN_MATCH_RELATIONS,
    order: { sequence: 'ASC' }
  })
  return {
    listFinalized,
    parameters: edition.qualification ?? (parameters ? parameters : null),
    pools: buildPools(context.pools, context.participations, context.matches),
    pendingMatchCount: countPendingAll(context),
    ties: computation.blockingTies.map((tie) => toGroup(tie, byId)),
    tiebreakMatches: tiebreakMatches.map(toAdminMatch),
    qualified: toQualified(computation, byId)
  }
}

const buildResult = (
  parameters: IQualificationParameters,
  status: EDITION_STATUS,
  computation: IQualificationComputation,
  context: IPoolContext,
  replayed: boolean
): IQualificationResult => {
  const byId = new Map(context.participations.map((participation) => [participation.id, participation]))
  const qualified = toQualified(computation, byId) ?? []
  const inPool = context.participations.filter((participation) => participation.poolId !== null)
  return { parameters, editionStatus: status, qualified, eliminatedCount: inPool.length - qualified.length, replayed }
}

/**
 * `POST /editions/{id}/qualification` : fige la liste des qualifiés (RG18). Une transaction sous `FOR UPDATE` de l'édition :
 * les qualifiés passent QUALIFIED, les autres ELIMINATED avec le stade POOL_ELIMINATED, la place en poule est enregistrée,
 * la configuration est conservée et l'édition passe à QUALIFIED (B-12 en dépend : R-3 refuse alors la correction d'un
 * match de poule). Idempotent : rejouée avec les mêmes paramètres, elle renvoie 200 sans effet ; avec d'autres, 409.
 */
export const finalizeQualification = (
  dataSource: DataSource,
  idOrCode: string,
  parameters: IQualificationParameters
): Promise<IQualificationResult & { editionId: string }> =>
  dataSource.transaction(async (manager) => {
    const edition = await findEditionLocked(manager, idOrCode)
    if (edition.status === EDITION_STATUS.CLOSED) {
      throw editionClosed()
    }
    const context = await loadPoolContext(manager, edition.id)
    if (isListFinalized(edition)) {
      const stored = edition.qualification!
      if (stored.topPerPool !== parameters.topPerPool || stored.bestNextCount !== parameters.bestNextCount || stored.withPlayoff !== parameters.withPlayoff) {
        throw alreadyDone()
      }
      const replay = computeQualification(context.poolInputs, context.records, stored)
      return { ...buildResult(stored, edition.status, replay, context, true), editionId: edition.id }
    }
    if (PRE_POOLS_STATUSES.includes(edition.status) || context.pools.length === 0) {
      throw notReady({ reason: 'POOLS_NOT_DRAWN' })
    }
    assertParametersWithinPools(parameters, context)
    const pending = countPendingAll(context)
    if (pending > 0) {
      throw notReady({ pendingMatchCount: pending })
    }
    const computation = computeQualification(context.poolInputs, context.records, parameters)
    const byId = new Map(context.participations.map((participation) => [participation.id, participation]))
    if (computation.blockingTies.length > 0) {
      throw conflictWithCode(API_ERROR_CODE.TIEBREAK_REQUIRED, API_ERROR_MESSAGE.TIEBREAK_REQUIRED, {
        ties: computation.blockingTies.map((tie) => toGroup(tie, byId))
      })
    }

    const qualifiedIds = new Set(computation.qualified!.map((entry) => entry.playerId))
    const placeById = new Map(computation.standings.flatMap((standing) => standing.entries.map((entry) => [entry.playerId, entry.rank] as const)))
    for (const participation of context.participations.filter((candidate) => candidate.poolId !== null)) {
      const qualified = qualifiedIds.has(participation.id)
      await manager.getRepository(ParticipationEntity).update({ id: participation.id }, {
        poolRank: placeById.get(participation.id) ?? null,
        status: qualified ? PARTICIPATION_STATUS.QUALIFIED : PARTICIPATION_STATUS.ELIMINATED,
        finalStage: qualified ? null : FINAL_STAGE.POOL_ELIMINATED
      })
    }
    await manager.getRepository(EditionEntity).update({ id: edition.id }, { qualification: parameters, status: EDITION_STATUS.QUALIFIED })

    const refreshed = await loadPoolContext(manager, edition.id)
    return { ...buildResult(parameters, EDITION_STATUS.QUALIFIED, computation, refreshed, false), editionId: edition.id }
  })

/** Lecture d'un match admin dans la transaction en cours (l'écriture n'est pas encore visible d'une autre connexion). */
const loadAdminMatchIn = async (manager: EntityManager, matchId: string): Promise<IAdminMatch> =>
  toAdminMatch(await manager.getRepository(MatchEntity).findOneOrFail({ where: { id: matchId }, relations: ADMIN_MATCH_RELATIONS }))

/**
 * `POST /editions/{id}/departages` : crée UN match de départage pour exactement un groupe d'égalité courant. Cible 5 à
 * deux joueurs, 3 à N >= 3 (A11, R-1) ; le match est dans le tour de poules, avec la poule de l'égalité (`POOL`) ou sans
 * poule (`BOUNDARY`). Idempotent : si un départage non joué existe déjà pour ce groupe, il est renvoyé sans en créer un autre.
 * R-7 : une fois ce match validé, les perdants qui restent à égalité réapparaissent dans l'état, et la même route crée le suivant.
 */
export const createTiebreak = (
  dataSource: DataSource,
  idOrCode: string,
  request: ICreateTiebreakRequest
): Promise<{ match: IAdminMatch, editionId: string, replayed: boolean }> =>
  dataSource.transaction(async (manager) => {
    const edition = await findEditionLocked(manager, idOrCode)
    if (edition.status === EDITION_STATUS.CLOSED) {
      throw editionClosed()
    }
    if (isListFinalized(edition)) {
      throw alreadyDone()
    }
    const context = await loadPoolContext(manager, edition.id)
    if (PRE_POOLS_STATUSES.includes(edition.status) || context.pools.length === 0) {
      throw notReady({ reason: 'POOLS_NOT_DRAWN' })
    }
    const pendingRegular = countPendingRegular(context)
    if (pendingRegular > 0) {
      throw notReady({ pendingMatchCount: pendingRegular })
    }
    if (request.parameters) {
      assertParametersWithinPools(request.parameters, context)
    }
    const computation = computeQualification(context.poolInputs, context.records, request.parameters ?? null)
    const group = [...computation.blockingTies, ...computation.poolTies].find((tie) => sameMembers(tie.playerIds, request.participationIds))
    if (!group) {
      throw tiebreakNotRequired()
    }

    const sideCount = group.playerIds.length
    const open = context.matches.find((match) => match.purpose === MATCH_PURPOSE.TIEBREAK
      && match.status !== MATCH_STATUS.VALIDATED && match.status !== MATCH_STATUS.RESULT_UNKNOWN
      && sameMembers(match.sides.map((side) => side.participationId), group.playerIds))
    if (open) {
      return { match: await loadAdminMatchIn(manager, open.id), editionId: edition.id, replayed: true }
    }

    const round = context.matches[0]
      ? await manager.getRepository(RoundEntity).findOneByOrFail({ id: context.matches[0].roundId })
      : await manager.getRepository(RoundEntity).findOneByOrFail({ editionId: edition.id, kind: ROUND_KIND.POOLS })
    if (!OPEN_ROUND_STATUSES.includes(round.status)) {
      throw conflict('The pools round is not open')
    }
    const last = await manager.getRepository(MatchEntity).createQueryBuilder('m').select('MAX(m.sequence)', 'max')
      .where('m.editionId = :editionId', { editionId: edition.id }).getRawOne<{ max: number | null }>()
    const [matchId] = await generateUuids(1)
    await manager.getRepository(MatchEntity).insert({
      id: matchId!,
      editionId: edition.id,
      roundId: round.id,
      poolId: group.poolId,
      sequence: (last?.max ?? 0) + 1,
      purpose: MATCH_PURPOSE.TIEBREAK,
      targetScore: targetScore(ROUND_KIND.POOLS, MATCH_PURPOSE.TIEBREAK, sideCount)
    })
    await manager.getRepository(MatchSideEntity).insert(group.playerIds.map((participationId, index) => ({
      matchId: matchId!, position: index + 1, participationId
    })))
    return { match: await loadAdminMatchIn(manager, matchId!), editionId: edition.id, replayed: false }
  })
