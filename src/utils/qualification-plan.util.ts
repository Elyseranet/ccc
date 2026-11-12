import { KNOCKOUT_ROUND_ORDER, ROUND_KIND_BY_POOL_SIZE } from '../consts/qualification.const.js'
import { API_ERROR_CODE } from '../enums/api-error-code.enum.js'
import { EDITION_STATUS } from '../enums/edition.enum.js'
import { QUALIFICATION_ROUTE, TIEBREAK_SCOPE } from '../enums/qualification.enum.js'
import { ROUND_KIND } from '../enums/round.enum.js'
import type { ITiebreakRequirement } from '../interfaces/pool.interface.js'
import type {
  IQualificationComputation,
  IQualificationPoolInput,
  IQualificationTie,
  IQualifiedEntry,
  IRoundDrawCheckInput,
  IRoundDrawPlan,
  IRoundDrawPlanInput
} from '../interfaces/qualification-plan.interface.js'
import type { IQualificationParameters } from '../interfaces/qualification.interface.js'
import type { IMatchRecord } from '../interfaces/stats.interface.js'
import { selectQualifiers } from './qualification.util.js'
import { computePoolStanding } from './standing.util.js'

const toTie = (requirement: ITiebreakRequirement, pools: readonly IQualificationPoolInput[], slots: number): IQualificationTie => {
  const owner = pools.find((pool) => requirement.playerIds.every((id) => pool.memberIds.includes(id)))
  return {
    scope: owner ? TIEBREAK_SCOPE.POOL : TIEBREAK_SCOPE.BOUNDARY,
    poolId: owner?.poolId ?? null,
    startRank: requirement.startRank,
    format: requirement.format,
    slots: owner ? 0 : slots,
    playerIds: requirement.playerIds
  }
}

/**
 * RG18 à RG20, A10, A11, R-6, R-7 : classements des poules, égalités à départager et qualifiés. `records` contient les
 * matchs de poule (REGULAR et TIEBREAK, clé = participation) ; un départage entre poules y figure aussi. Fonction pure,
 * sans accès à la base : l'état de la qualification et la création d'un départage s'y appuient tous deux.
 */
export const computeQualification = (
  pools: readonly IQualificationPoolInput[],
  records: readonly IMatchRecord[],
  parameters: Pick<IQualificationParameters, 'topPerPool' | 'bestNextCount'> | null
): IQualificationComputation => {
  const standings = pools.map((pool) => computePoolStanding(pool.memberIds, records))
  const poolTies = standings.flatMap((standing, index) =>
    standing.requiresTiebreak.map((requirement) => toTie(requirement, [pools[index]!], 0)))
  if (!parameters) {
    return { standings, blockingTies: [], poolTies, qualified: null }
  }

  const selection = selectQualifiers(standings, parameters.topPerPool, parameters.bestNextCount, records)
  const blockingTies = selection.requiresTiebreak.map((requirement) => toTie(requirement, pools, selection.tiebreakSlots))
  if (blockingTies.length > 0) {
    return { standings, blockingTies, poolTies, qualified: [] }
  }

  const placeOf = new Map<string, { poolId: string, poolRank: number }>()
  standings.forEach((standing, index) => {
    for (const entry of standing.entries) {
      placeOf.set(entry.playerId, { poolId: pools[index]!.poolId, poolRank: entry.rank })
    }
  })
  const entry = (playerId: string, route: QUALIFICATION_ROUTE): IQualifiedEntry =>
    ({ playerId, route, ...placeOf.get(playerId)! })
  return {
    standings,
    blockingTies: [],
    poolTies,
    qualified: [
      ...selection.topQualifiers.map((id) => entry(id, QUALIFICATION_ROUTE.TOP_OF_POOL)),
      ...selection.bestNextQualifiers.map((id) => entry(id, QUALIFICATION_ROUTE.BEST_NEXT))
    ]
  }
}

/** Deux groupes de joueurs identiques, quel que soit l'ordre. */
export const sameMembers = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && a.every((id) => b.includes(id))

/**
 * RG13, RG14 : le prochain tirage de tour. Une seule fonction pour l'aperçu (GET) et la création (POST), donc aucune règle
 * dupliquée. Bloqué par QUALIFICATION_NOT_DONE tant que la liste n'est pas figée, par ROUND_NOT_COMPLETED tant que le dernier
 * tour de phase finale n'est pas entièrement validé. Le type du tour : PLAYOFF (barrages, A9) pour le premier tour d'une
 * qualification `withPlayoff`, sinon déduit de la taille du vivier (2, 4, 8, 16) ; null si rien n'est tirable.
 * Décision utilisateur c9790abd : aucun refus « puissance de 2 » à la qualification, les contrôles se font au tirage. Une taille
 * hors 2, 4, 8, 16 sans barrages donne `roundKind: null` : point d'entrée unique, la décision sur ces tailles (12, 20…) est en attente.
 */
export const planRoundDraw = (input: IRoundDrawPlanInput): IRoundDrawPlan => {
  const finalized = input.qualification !== null
    && ![EDITION_STATUS.CREATED, EDITION_STATUS.REGISTRATION, EDITION_STATUS.POOLS_DRAWN, EDITION_STATUS.POOLS_PLAYING].includes(input.editionStatus)
  if (!finalized) {
    return { roundKind: null, allowedRoundKinds: [], blockedBy: API_ERROR_CODE.QUALIFICATION_NOT_DONE }
  }
  if (input.editionStatus === EDITION_STATUS.CLOSED || input.knockoutRounds.some((round) => round.kind === ROUND_KIND.FINAL)) {
    return { roundKind: null, allowedRoundKinds: [], blockedBy: null }
  }
  if (input.knockoutRounds.some((round) => !round.completed)) {
    return { roundKind: null, allowedRoundKinds: [], blockedBy: API_ERROR_CODE.ROUND_NOT_COMPLETED }
  }
  const noneDrawn = input.knockoutRounds.length === 0
  if (noneDrawn && input.qualification!.withPlayoff) {
    return { roundKind: ROUND_KIND.PLAYOFF, allowedRoundKinds: [ROUND_KIND.PLAYOFF], blockedBy: null }
  }
  const size = input.candidateCount
  const lastIndex = Math.max(-1, ...input.knockoutRounds.map((round) => KNOCKOUT_ROUND_ORDER.indexOf(round.kind)))
  const later = KNOCKOUT_ROUND_ORDER.filter((_kind, index) => index > lastIndex)

  // Taille 2, 4, 8 ou 16 : le tour est déduit, s'il vient après le dernier tour tiré (un tour ne précède jamais un tour tiré).
  const deduced = ROUND_KIND_BY_POOL_SIZE[size] ?? null
  if (deduced !== null) {
    const possible = later.includes(deduced)
    return { roundKind: possible ? deduced : null, allowedRoundKinds: possible ? [deduced] : [], blockedBy: null }
  }

  // Autre taille (decisions 673e5b4b) : l'administrateur choisit. Gardes : ROUND_OF_16 exige 16 joueurs, FINAL exactement 2
  // (intégrité : un seul champion), PLAYOFF tant qu'aucun tour de phase finale n'est tiré ; un vivier impair ne se tire que
  // pour les barrages, où seuls les barragistes sont tirés. Aucune autre contrainte : on n'invente pas de règle de barrage.
  const even = size % 2 === 0
  const allowed = size < 2
    ? []
    : later.filter((kind) => {
      if (kind === ROUND_KIND.PLAYOFF) {
        return noneDrawn
      }
      return even && kind !== ROUND_KIND.ROUND_OF_16 && kind !== ROUND_KIND.FINAL
    })
  return { roundKind: null, allowedRoundKinds: allowed, blockedBy: null }
}

/**
 * Cohérence des affiches tirées physiquement (A1). Renvoie la raison du premier défaut, ou null. Brouillon (`complete` false) :
 * une affiche peut être partielle. Validation (`complete` true) : au moins une affiche, toutes à deux côtés, affiches numérotées
 * de 1 à k, et tout le vivier tiré sauf pour les barrages, où seuls les barragistes sont tirés.
 */
export const checkRoundDrawAssignments = (input: IRoundDrawCheckInput): string | null => {
  const { assignments, candidateIds, roundKind, poolWinnerIds, complete } = input
  const candidates = new Set(candidateIds)
  if (!assignments.every((assignment) => candidates.has(assignment.participationId))) {
    return 'A drawn player is not in the pool of qualified players'
  }
  if (new Set(assignments.map((assignment) => assignment.participationId)).size !== assignments.length) {
    return 'A player is drawn more than once'
  }
  if (new Set(assignments.map((assignment) => assignment.drawnOrder)).size !== assignments.length) {
    return 'The draw order has duplicates'
  }
  const sides = assignments.map((assignment) => `${assignment.pairingIndex}:${assignment.sidePosition}`)
  if (new Set(sides).size !== sides.length) {
    return 'A pairing side is used twice'
  }
  if (roundKind === ROUND_KIND.PLAYOFF && assignments.some((assignment) => poolWinnerIds.includes(assignment.participationId))) {
    return 'A pool winner does not play the playoff round'
  }
  if (!complete) {
    return null
  }
  const pairings = new Set(assignments.map((assignment) => assignment.pairingIndex))
  const pairingCount = pairings.size
  const contiguous = [...pairings].every((index) => index >= 1 && index <= pairingCount)
  if (pairingCount === 0 || !contiguous || assignments.length !== pairingCount * 2) {
    return 'Every pairing must have two players, numbered from 1'
  }
  if (roundKind !== ROUND_KIND.PLAYOFF && assignments.length !== candidates.size) {
    return 'Every qualified player must be drawn'
  }
  // Gardes de taille : huitièmes à 16 joueurs (demande de l'utilisateur), finale à 2 (intégrité : un seul champion).
  if (roundKind === ROUND_KIND.ROUND_OF_16 && assignments.length !== 16) {
    return 'A round of 16 draws exactly 16 players'
  }
  if (roundKind === ROUND_KIND.FINAL && assignments.length !== 2) {
    return 'A final draws exactly 2 players'
  }
  return null
}
