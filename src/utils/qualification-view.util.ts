import { QUALIFICATION_BEST_NEXT_MAX, QUALIFICATION_TOP_PER_POOL_MAX } from '../consts/qualification.const.js'
import { OPEN_TIEBREAK_STATUSES, QUALIFICATION_INTEGER_PATTERN, QUALIFICATION_PERCENT_BASE } from '../consts/qualification-view.const.js'
import { MATCH_STATUS } from '../enums/match.enum.js'
import { POOL_DRAW_STEP_STATE } from '../enums/pool-draw.enum.js'
import { TIEBREAK_SCOPE } from '../enums/qualification.enum.js'
import { QUALIFICATION_BLOCKER, QUALIFICATION_PARAMETER_ERROR, QUALIFICATION_RANK_STATUS, QUALIFICATION_STEP } from '../enums/qualification.enum.js'
import type { IAdminMatch } from '../interfaces/admin-match.interface.js'
import type {
  IQualificationBounds,
  IQualificationInputCheck,
  IQualificationInputs,
  IQualificationPrerequisites,
  IQualificationRankTable,
  IQualificationStepView,
  IQualificationTieView,
  IQualifiedRow
} from '../interfaces/qualification-view.interface.js'
import type { IQualificationParameters, IQualificationStatus } from '../interfaces/qualification.interface.js'

/*********************************************************
 * Qualification : ce que la page affiche (F-24)
 *
 * @description
 * Fonctions pures. Le serveur reste la source de vérité (égalités, départage suivant, qualifiés) : rien n'est recalculé ici, on
 * range ce que `GET /admin/editions/{id}/qualification` rend. Seuls le contrôle des champs saisis, le décompte des matchs et la
 * raison d'une action inactive se calculent côté navigateur.
 ********************************************************/

const readField = (raw: string, min: number, max: number): { value: number | null, error: QUALIFICATION_PARAMETER_ERROR | null } => {
  const text = raw.trim()
  if (!QUALIFICATION_INTEGER_PATTERN.test(text)) {
    return { value: null, error: QUALIFICATION_PARAMETER_ERROR.NOT_INTEGER }
  }
  const value = Number(text)
  if (value < min) {
    return { value: null, error: QUALIFICATION_PARAMETER_ERROR.TOO_LOW }
  }
  return value > max ? { value: null, error: QUALIFICATION_PARAMETER_ERROR.TOO_HIGH } : { value, error: null }
}

export const boundsOf = (status: IQualificationStatus): IQualificationBounds => ({
  largestPool: Math.max(0, ...status.pools.map(pool => pool.standing.length)),
  poolCount: status.pools.length
})

/** « Premiers de chaque poule » : 1 à la plus grande poule ; « Meilleurs (n+1)es » : 0 au nombre de poules. Aucun contrôle de puissance de 2 (c9790abd (6)). */
export const checkInputs = (inputs: IQualificationInputs, bounds: IQualificationBounds): IQualificationInputCheck => {
  const top = readField(inputs.topPerPool, 1, Math.min(bounds.largestPool, QUALIFICATION_TOP_PER_POOL_MAX))
  const best = readField(inputs.bestNextCount, 0, Math.min(bounds.poolCount, QUALIFICATION_BEST_NEXT_MAX))
  return {
    parameters: top.value !== null && best.value !== null
      ? { topPerPool: top.value, bestNextCount: best.value, withPlayoff: inputs.withPlayoff }
      : null,
    topPerPoolError: top.error,
    bestNextCountError: best.error
  }
}

/** Champs de départ : la configuration enregistrée si la liste est arrêtée ou déjà configurée, sinon 2 premiers et aucun meilleur (n+1)e. */
export const initialInputs = (status: IQualificationStatus): IQualificationInputs => ({
  topPerPool: String(status.parameters?.topPerPool ?? 2),
  bestNextCount: String(status.parameters?.bestNextCount ?? 0),
  withPlayoff: status.parameters?.withPlayoff ?? false
})

/** « N qualifiés (n × poules + m) ». */
export const previewCount = (parameters: Pick<IQualificationParameters, 'topPerPool' | 'bestNextCount'>, poolCount: number): number =>
  parameters.topPerPool * poolCount + parameters.bestNextCount

const isOpenTiebreak = (match: IAdminMatch): boolean => OPEN_TIEBREAK_STATUSES.includes(match.status)

/** Matchs de poule réguliers à valider : le serveur compte aussi les départages ouverts, qui ne bloquent pas la création d'un départage. */
export const pendingRegularCount = (status: IQualificationStatus): number =>
  Math.max(0, status.pendingMatchCount - status.tiebreakMatches.filter(isOpenTiebreak).length)

/** Validés = 2 matchs par ligne « joué » (chaque match donne un joué aux deux côtés), plus les résultats inconnus, qui ne bloquent pas. */
export const prerequisitesOf = (status: IQualificationStatus): IQualificationPrerequisites => {
  const rows = status.pools.flatMap(pool => pool.standing)
  const validated = Math.round(rows.reduce((sum, row) => sum + row.played + row.unknownResults, 0) / 2)
  const pending = pendingRegularCount(status)
  const total = validated + pending
  return { validated, total, pending, percent: total === 0 ? 0 : Math.round(validated / total * QUALIFICATION_PERCENT_BASE) }
}

const signed = (value: number): string => value > 0 ? `+${value}` : String(value)

/** Classement provisoire : égalité si le joueur est dans un groupe à départager ; sinon qualifié selon la liste calculée, ou, tant qu'elle est vide, selon son rang dans la poule. */
export const rankTablesOf = (status: IQualificationStatus, topPerPool: number | null): IQualificationRankTable[] => {
  const inTie = new Set(status.ties.flatMap(tie => tie.members.map(member => member.participationId)))
  const qualified = new Set((status.qualified ?? []).map(entry => entry.participationId))
  const hasList = qualified.size > 0
  return status.pools.map(pool => ({
    key: pool.id,
    poolRank: pool.rank,
    rows: pool.standing.map((row) => {
      let rowStatus = QUALIFICATION_RANK_STATUS.ELIMINATED
      if (inTie.has(row.participationId)) {
        rowStatus = QUALIFICATION_RANK_STATUS.TIE
      } else if (hasList ? qualified.has(row.participationId) : topPerPool !== null && row.rank <= topPerPool) {
        rowStatus = QUALIFICATION_RANK_STATUS.QUALIFIED
      }
      return {
        key: row.participationId,
        rank: row.rank,
        competitor: { id: row.competitor.id, displayName: row.competitor.displayName },
        wins: row.wins,
        difference: signed(row.capsAverage),
        status: rowStatus
      }
    })
  }))
}

const sameSet = (a: readonly string[], b: readonly string[]): boolean => a.length === b.length && a.every(id => b.includes(id))

/** Pourquoi les actions sont inactives, `null` si elles ne le sont pas (édition clôturée en premier). */
export const blockerOf = (pending: number, ties: number, closed: boolean): QUALIFICATION_BLOCKER | null => {
  if (closed) {
    return QUALIFICATION_BLOCKER.CLOSED
  }
  if (pending > 0 && ties > 0) {
    return QUALIFICATION_BLOCKER.PENDING_AND_TIES
  }
  if (pending > 0) {
    return QUALIFICATION_BLOCKER.PENDING_MATCHES
  }
  return ties > 0 ? QUALIFICATION_BLOCKER.TIES_LEFT : null
}

/** Une carte par égalité, dans l'ordre du serveur. Le départage « suivant » vient d'un départage déjà joué qui contenait ce groupe (R-7). */
export const tieViewsOf = (status: IQualificationStatus, closed: boolean): IQualificationTieView[] => {
  const pending = pendingRegularCount(status)
  const poolRankById = new Map(status.pools.map(pool => [pool.id, pool.rank]))
  const rankOf = new Map(status.pools.flatMap(pool => pool.standing.map(row => [row.participationId, row.rank] as const)))
  return status.ties.map((tie, index) => {
    const participationIds = tie.members.map(member => member.participationId)
    const matchesOf = status.tiebreakMatches.map(match => ({ match, ids: match.sides.map(side => side.participationId) }))
    const hasOpenTiebreak = matchesOf.some(entry => isOpenTiebreak(entry.match) && sameSet(entry.ids, participationIds))
    const isFollowUp = matchesOf.some(entry => entry.match.status === MATCH_STATUS.VALIDATED
      && entry.ids.length > participationIds.length
      && participationIds.every(id => entry.ids.includes(id)))
    let blocker: QUALIFICATION_BLOCKER | null = null
    if (closed) {
      blocker = QUALIFICATION_BLOCKER.CLOSED
    } else if (pending > 0) {
      blocker = QUALIFICATION_BLOCKER.PENDING_MATCHES
    } else if (hasOpenTiebreak) {
      blocker = QUALIFICATION_BLOCKER.TIEBREAK_OPEN
    }
    return {
      key: `${tie.scope}-${tie.poolId ?? 'x'}-${tie.startRank}-${index}`,
      scope: tie.scope,
      poolRank: tie.poolId === null ? null : poolRankById.get(tie.poolId) ?? null,
      placeRank: tie.scope === TIEBREAK_SCOPE.POOL ? tie.startRank : rankOf.get(tie.members[0]?.participationId ?? '') ?? tie.startRank,
      format: tie.format,
      slots: tie.slots,
      members: tie.members.map(member => ({ id: member.competitor.id, displayName: member.competitor.displayName })),
      participationIds,
      hasOpenTiebreak,
      isFollowUp,
      blocker
    }
  })
}

/** Aperçu des qualifiés : vide tant qu'une égalité bloque (le serveur rend alors `[]`). */
export const qualifiedRowsOf = (status: IQualificationStatus): IQualifiedRow[] => {
  const poolRankById = new Map(status.pools.map(pool => [pool.id, pool.rank]))
  const playedTiebreak = new Set(status.tiebreakMatches
    .filter(match => match.status === MATCH_STATUS.VALIDATED)
    .flatMap(match => match.sides.map(side => side.participationId)))
  return (status.qualified ?? []).map(entry => ({
    key: entry.participationId,
    poolRank: poolRankById.get(entry.poolId) ?? 0,
    rank: entry.poolRank,
    competitor: { id: entry.competitor.id, displayName: entry.competitor.displayName },
    route: entry.route,
    afterTiebreak: playedTiebreak.has(entry.participationId)
  }))
}

/** Les quatre étapes : la première qui n'est pas faite est active ; liste arrêtée = tout est fait. */
export const stepsOf = (status: IQualificationStatus, check: IQualificationInputCheck): IQualificationStepView[] => {
  const prerequisitesDone = pendingRegularCount(status) === 0 && status.pools.length > 0
  const tiesDone = prerequisitesDone && status.ties.length === 0
  const parametersDone = tiesDone && check.parameters !== null
  const done = [status.listFinalized || prerequisitesDone, status.listFinalized || tiesDone, status.listFinalized || parametersDone, status.listFinalized]
  const steps = [QUALIFICATION_STEP.PREREQUISITES, QUALIFICATION_STEP.TIES, QUALIFICATION_STEP.PARAMETERS, QUALIFICATION_STEP.FINALIZE]
  const activeIndex = done.indexOf(false)
  return steps.map((step, index) => ({
    step,
    state: done[index] ? POOL_DRAW_STEP_STATE.DONE : index === activeIndex ? POOL_DRAW_STEP_STATE.ACTIVE : POOL_DRAW_STEP_STATE.PENDING
  }))
}
