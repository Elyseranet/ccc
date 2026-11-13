import type { IAdminMatch } from '../interfaces/admin-match.interface.js'
import type { IAdminMatchesQuery, IBaseServiceOptions } from '../interfaces/api-client.interface.js'
import { BaseService } from './base.service.js'
import { In } from 'typeorm'
import type { DataSource, EntityManager } from 'typeorm'
import { DRAW_KIND } from '../enums/draw.enum.js'
import { EDITION_STATUS } from '../enums/edition.enum.js'
import { MATCH_STATUS } from '../enums/match.enum.js'
import { ROUND_KIND } from '../enums/round.enum.js'
import type { IPool } from '../interfaces/pool.interface.js'
import type { IMatchValidationResult, IScoreSubmission } from '../interfaces/score.interface.js'
import { MATCH_PUBLIC_RELATIONS } from '../consts/edition.const.js'
import { LOG_EVENT } from '../consts/log-event.const.js'
import { ADMIN_MATCH_RELATIONS, OPEN_ROUND_STATUSES, QUALIFICATION_STOPPED_EDITION_STATUSES } from '../consts/match-score.const.js'
import { DrawEntity } from '../server/db/typeorm/entities/draw.entity.js'
import { EditionEntity } from '../server/db/typeorm/entities/edition.entity.js'
import { MatchSideEntity } from '../server/db/typeorm/entities/match-side.entity.js'
import { MatchEntity } from '../server/db/typeorm/entities/match.entity.js'
import { PoolEntity } from '../server/db/typeorm/entities/pool.entity.js'
import { RoundEntity } from '../server/db/typeorm/entities/round.entity.js'
import type { IAdminMatchListQuery, ILockedMatch, IScoreCommand, IScoreWriteOutcome } from '../interfaces/match-score.interface.js'
import { buildPools, buildRounds } from '../utils/edition-assemble.util.js'
import {
  conflict,
  matchAlreadyValidated,
  matchNotFound,
  nextRoundEngaged,
  scoreInconsistent,
  scoreMismatch,
  versionConflict
} from '../utils/api-error.util.js'
import { logger } from '../utils/logger.util.js'
import { toIfMatchHeaders } from '../utils/if-match-header.util.js'
import { toAdminMatch } from '../utils/match-admin.mapper.util.js'
import { toPublicMatch } from '../utils/match-public.mapper.util.js'
import { alignScores, hasSameScores, sidesInOrder } from '../utils/match-score.util.js'
import { validateScore } from '../utils/score-rules.util.js'
import { loadParticipations } from './edition.service.js'

/*********************************************************
 * MatchService
 *
 * @description
 * File admin des scores (C6). Service unique du domaine (ARCH-2) : la classe navigateur (`$fetch`, via BaseService)
 * et les fonctions serveur d'écriture des scores (TypeORM, B-12) ; le code navigateur ne référence jamais ces dernières,
 * le build client les élague (`tests/build/client-bundle.test.ts`). Les écritures navigateur (`record`, `validate`) portent `If-Match` (F-08, SEC-Q).
 ********************************************************/
export class MatchService extends BaseService {
  constructor (options: IBaseServiceOptions = {}) {
    super(options)
  }

  adminList (editionId: string, query: IAdminMatchesQuery = {}): Promise<IAdminMatch[]> {
    return this.request<IAdminMatch[]>(`/admin/editions/${encodeURIComponent(editionId)}/matchs`, { query: { ...query, statut: query.statut?.join(',') } })
  }

  /** « Enregistrer » : `PUT /matchs/{id}/score`, version lue obligatoire (`If-Match`). Rend le match à jour, version comprise. */
  record (matchId: string, submission: IScoreSubmission, version: number): Promise<IAdminMatch> {
    return this.request<IAdminMatch>(`/matchs/${encodeURIComponent(matchId)}/score`, {
      method: 'PUT',
      body: { scores: submission.scores },
      headers: toIfMatchHeaders(version)
    })
  }

  /** « Valider » : `POST /matchs/{id}/validation`. La réponse porte l'état recalculé (match, poule, tour) : aucune relecture. */
  validate (matchId: string, submission: IScoreSubmission, version: number): Promise<IMatchValidationResult> {
    return this.request<IMatchValidationResult>(`/matchs/${encodeURIComponent(matchId)}/validation`, {
      method: 'POST',
      body: { scores: submission.scores },
      headers: toIfMatchHeaders(version)
    })
  }
}

/** Verrouille la ligne du match (FOR UPDATE) : deux écritures simultanées se sérialisent. Relit ensuite avec ses relations. */
const lockMatch = async (manager: EntityManager, matchId: string): Promise<ILockedMatch> => {
  const locked = await manager.findOne(MatchEntity, { where: { id: matchId }, lock: { mode: 'pessimistic_write' } })
  if (!locked) {
    throw matchNotFound()
  }
  const match = await manager.findOneOrFail(MatchEntity, { where: { id: matchId }, relations: ADMIN_MATCH_RELATIONS })
  const edition = await manager.findOneByOrFail(EditionEntity, { id: match.editionId })
  return { match, edition }
}

/** Écriture d'un score : ni archive sans résultat, ni édition close, ni tour fermé. */
const assertWritable = ({ match, edition }: ILockedMatch): void => {
  if (match.status === MATCH_STATUS.RESULT_UNKNOWN || match.winnerParticipationId !== null) {
    throw conflict('The result of this match is unknown and cannot be scored')
  }
  if (edition.status === EDITION_STATUS.CLOSED) {
    throw conflict('The edition is closed')
  }
  if (!OPEN_ROUND_STATUSES.includes(match.round.status)) {
    throw conflict('The round of this match is not open')
  }
}

/** Contrôle de version obligatoire (SEC-Q) : 412 `VERSION_CONFLICT` avec la version courante. */
const assertVersion = (match: MatchEntity, expected: number): void => {
  if (expected !== match.version) {
    throw versionConflict(match.version)
  }
}

const assertConsistent = (match: MatchEntity, scores: number[]): void => {
  const result = validateScore(match.round.kind, match.purpose, scores)
  if (!result.valid) {
    throw scoreInconsistent(result.reason ?? 'Scores are inconsistent')
  }
}

/** R-3 : un tour suivant est engagé si la qualification est arrêtée (poule) ou si un tirage existe pour un tour suivant. */
const isNextRoundEngaged = async ({ match, edition }: ILockedMatch, manager: EntityManager): Promise<boolean> => {
  if (match.round.kind === ROUND_KIND.POOLS) {
    return QUALIFICATION_STOPPED_EDITION_STATUSES.includes(edition.status)
  }
  return manager.getRepository(DrawEntity).createQueryBuilder('d')
    .innerJoin('d.round', 'r')
    .where('d.editionId = :editionId', { editionId: match.editionId })
    .andWhere('d.kind = :kind', { kind: DRAW_KIND.ROUND })
    .andWhere('r.sequence > :sequence', { sequence: match.round.sequence })
    .getExists()
}

const writeSides = async (
  manager: EntityManager,
  match: MatchEntity,
  values: (side: MatchSideEntity, score: number) => Partial<MatchSideEntity>,
  scores: number[]
): Promise<void> => {
  for (const [index, side] of sidesInOrder(match).entries()) {
    await manager.update(MatchSideEntity, { id: side.id }, values(side, scores[index]!))
  }
}

const outcomeOf = (match: MatchEntity, replayed: boolean): IScoreWriteOutcome =>
  ({ matchId: match.id, editionId: match.editionId, replayed })

/** « Enregistrer » : idempotent par nature, aucun effet public. 409 sur un match VALIDATED (voir la correction). */
export const recordScore = (dataSource: DataSource, command: IScoreCommand): Promise<IScoreWriteOutcome> =>
  dataSource.transaction(async (manager) => {
    const locked = await lockMatch(manager, command.matchId)
    const { match } = locked
    const scores = alignScores(match, command.scores)
    if (match.status === MATCH_STATUS.VALIDATED) {
      throw matchAlreadyValidated()
    }
    assertWritable(locked)
    // Un rejeu (mêmes scores déjà enregistrés) ne change rien : il réussit même avec une version périmée, comme la validation.
    const unchanged = match.status === MATCH_STATUS.RECORDED
      && hasSameScores(sidesInOrder(match).map((side) => side.recordedScore), scores)
    if (!unchanged) {
      assertVersion(match, command.expectedVersion)
      await writeSides(manager, match, (_side, score) => ({ recordedScore: score }), scores)
      await manager.update(MatchEntity, { id: match.id }, { status: MATCH_STATUS.RECORDED, recordedAt: new Date() })
      logger.info(LOG_EVENT.MATCH_RECORDED, {
        requestId: command.requestId, matchId: match.id, editionId: match.editionId, userId: command.userId
      })
    }
    return outcomeOf(match, unchanged)
  })

/**
 * « Valider » : copie `recorded_score` vers `validated_score`. Un rejeu (match déjà VALIDATED, mêmes scores)
 * renvoie l'état courant sans effet ; d'autres scores donnent MATCH_ALREADY_VALIDATED. Les scores du corps sont
 * ce que l'organisateur a vu. Contrôles dans l'ordre : 412 VERSION_CONFLICT si `If-Match` est périmé, puis 409 SCORE_MISMATCH
 * si les scores diffèrent du score saisi.
 */
export const validateMatch = (dataSource: DataSource, command: IScoreCommand): Promise<IScoreWriteOutcome> =>
  dataSource.transaction(async (manager) => {
    const locked = await lockMatch(manager, command.matchId)
    const { match } = locked
    const scores = alignScores(match, command.scores)
    if (match.status === MATCH_STATUS.VALIDATED) {
      if (hasSameScores(sidesInOrder(match).map((side) => side.validatedScore), scores)) {
        return outcomeOf(match, true)
      }
      throw matchAlreadyValidated()
    }
    assertWritable(locked)
    if (match.status !== MATCH_STATUS.RECORDED) {
      throw conflict('No recorded score to validate')
    }
    // Version d'abord (412), puis concordance des scores (409) : avec une version à jour, des scores différents du score
    // saisi ne viennent que d'un client qui n'envoie pas ce qu'il a lu.
    assertVersion(match, command.expectedVersion)
    if (!hasSameScores(sidesInOrder(match).map((side) => side.recordedScore), scores)) {
      throw scoreMismatch()
    }
    assertConsistent(match, scores)
    await writeSides(manager, match, (side) => ({ validatedScore: side.recordedScore }), scores)
    await manager.update(MatchEntity, { id: match.id }, {
      status: MATCH_STATUS.VALIDATED,
      validatedAt: new Date(),
      validatedByUserId: command.userId
    })
    return outcomeOf(match, false)
  })

/**
 * A15 : réécrit `recorded_score` et `validated_score` d'un match VALIDATED, met `validated_at` à jour (l'ETag
 * public en dépend) et journalise l'ancien et le nouveau score. 409 NEXT_ROUND_ENGAGED (R-3) si un tour suivant est engagé.
 */
export const correctMatch = (dataSource: DataSource, command: IScoreCommand): Promise<IScoreWriteOutcome> =>
  dataSource.transaction(async (manager) => {
    const locked = await lockMatch(manager, command.matchId)
    const { match, edition } = locked
    const scores = alignScores(match, command.scores)
    if (match.status !== MATCH_STATUS.VALIDATED) {
      throw conflict('Only a validated match can be corrected')
    }
    if (match.winnerParticipationId !== null) {
      throw conflict('The result of this match is imported from the archives and cannot be corrected')
    }
    if (edition.status === EDITION_STATUS.CLOSED) {
      throw conflict('The edition is closed')
    }
    assertVersion(match, command.expectedVersion)
    if (await isNextRoundEngaged(locked, manager)) {
      throw nextRoundEngaged()
    }
    assertConsistent(match, scores)
    const sides = sidesInOrder(match)
    const previousScores = sides.map((side) => ({ participationId: side.participationId, score: side.validatedScore }))
    const newScores = sides.map((side, index) => ({ participationId: side.participationId, score: scores[index]! }))
    const now = new Date()
    await writeSides(manager, match, (_side, score) => ({ recordedScore: score, validatedScore: score }), scores)
    await manager.update(MatchEntity, { id: match.id }, {
      recordedAt: now,
      validatedAt: now,
      validatedByUserId: command.userId
    })
    logger.info(LOG_EVENT.MATCH_CORRECTED, {
      requestId: command.requestId,
      matchId: match.id,
      editionId: match.editionId,
      userId: command.userId,
      previousScores,
      newScores
    })
    return outcomeOf(match, false)
  })

export const loadAdminMatch = async (dataSource: DataSource, matchId: string): Promise<IAdminMatch> => {
  const match = await dataSource.getRepository(MatchEntity).findOne({ where: { id: matchId }, relations: ADMIN_MATCH_RELATIONS })
  if (!match) {
    throw matchNotFound()
  }
  return toAdminMatch(match)
}

/** L'état recalculé après une validation ou une correction (classement de poule, tour, vivier). Rien n'est stocké : tout est dérivé. */
export const loadValidationResult = async (dataSource: DataSource, matchId: string): Promise<IMatchValidationResult> => {
  const match = await dataSource.getRepository(MatchEntity).findOne({ where: { id: matchId }, relations: ADMIN_MATCH_RELATIONS })
  if (!match) {
    throw matchNotFound()
  }
  const roundMatches = await dataSource.getRepository(MatchEntity).find({
    where: { roundId: match.roundId },
    relations: MATCH_PUBLIC_RELATIONS,
    order: { sequence: 'ASC' }
  })
  const round = await dataSource.getRepository(RoundEntity).findOneByOrFail({ id: match.roundId })
  let pool: IPool | null = null
  if (match.poolId) {
    const poolEntity = await dataSource.getRepository(PoolEntity).findOneByOrFail({ id: match.poolId })
    const participations = await loadParticipations(dataSource, match.editionId)
    pool = buildPools([poolEntity], participations, roundMatches)[0] ?? null
  }
  const advancing = round.kind === ROUND_KIND.POOLS
    ? []
    : roundMatches.map(toPublicMatch).flatMap((published) => published.winnerParticipationId ?? [])
  return {
    match: toAdminMatch(match),
    pool,
    round: buildRounds([round], roundMatches)[0]!,
    advancingParticipationIds: advancing
  }
}

/** C6 : les matchs d'une édition avec le score saisi, le commentaire, la version et l'auteur. */
export const loadAdminMatches = async (
  dataSource: DataSource,
  editionId: string,
  query: IAdminMatchListQuery
): Promise<IAdminMatch[]> => {
  const { roundKind, poolRank, statuses } = query
  const matches = await dataSource.getRepository(MatchEntity).find({
    where: {
      editionId,
      ...(roundKind ? { round: { kind: roundKind } } : {}),
      ...(poolRank === undefined ? {} : { pool: { rank: poolRank } }),
      ...(statuses ? { status: In(statuses) } : {})
    },
    relations: ADMIN_MATCH_RELATIONS,
    order: { sequence: 'ASC' }
  })
  return matches.map(toAdminMatch)
}
