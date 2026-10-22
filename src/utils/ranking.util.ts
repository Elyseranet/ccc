import { ACP_WINDOW, CENTS_PER_POINT } from '../consts/domain-rules.const.js'
import { DOMAIN_ERROR_CODE } from '../enums/domain.enum.js'
import type {
  IPlayerAverage,
  IPlayerScore,
  IPlayerTitles,
  IRankingEdition,
  IScoredParticipation,
  IStagedParticipation,
} from '../interfaces/ranking.interface.js'
import { EDITION_STATUS } from '../enums/edition.enum.js'
import { FINAL_STAGE } from '../enums/participation.enum.js'
import { DomainRuleError } from './domain-rule-error.util.js'

export function toCents(points: number): number {
  return Math.round(points * CENTS_PER_POINT)
}

/** Éditions clôturées uniquement (A8), dans l'ordre chronologique. */
export function closedEditionsInOrder(editions: readonly IRankingEdition[]): IRankingEdition[] {
  return editions
    .filter((edition) => edition.status === EDITION_STATUS.CLOSED)
    .sort((a, b) => a.chronologicalRank - b.chronologicalRank)
}

/**
 * Somme par joueur (en centièmes) puis classement. Tous les joueurs de `playerIds` sortent,
 * même sans point dans le périmètre (total 0). Tri : total décroissant, puis `playerId`
 * pour un ordre déterministe ; les ex aequo partagent le rang (comme `RANK` du classeur).
 */
export function rankTotals(
  playerIds: readonly string[],
  participations: readonly IScoredParticipation[],
  editionIds: ReadonlySet<string>,
): IPlayerScore[] {
  const cents = new Map<string, number>(playerIds.map((playerId) => [playerId, 0]))
  for (const participation of participations) {
    if (editionIds.has(participation.editionId)) {
      cents.set(
        participation.playerId,
        (cents.get(participation.playerId) ?? 0) + toCents(participation.points),
      )
    }
  }
  const sorted = [...cents.entries()].sort(([idA, a], [idB, b]) => b - a || idA.localeCompare(idB))
  let previousTotal = NaN
  let previousRank = 0
  return sorted.map(([playerId, total], index) => {
    const rank = total === previousTotal ? previousRank : index + 1
    previousTotal = total
    previousRank = rank
    return { playerId, total: total / CENTS_PER_POINT, rank }
  })
}

function uniquePlayerIds(participations: readonly IScoredParticipation[]): string[] {
  return [...new Set(participations.map((participation) => participation.playerId))]
}

/** RG4 : All Time = somme de toutes les éditions fournies. */
export function computeAllTime(participations: readonly IScoredParticipation[]): IPlayerScore[] {
  const editionIds = new Set(participations.map((participation) => participation.editionId))
  return rankTotals(uniquePlayerIds(participations), participations, editionIds)
}

/**
 * RG4, A8 : ACP = somme des `window` dernières éditions CLOSED, ordonnées par
 * `chronologicalRank` (éditions, pas années : 2012a et 2012b comptent pour deux).
 */
export function computeAcp(
  participations: readonly IScoredParticipation[],
  editions: readonly IRankingEdition[],
  window: number = ACP_WINDOW,
): IPlayerScore[] {
  if (!Number.isInteger(window) || window <= 0) {
    throw new DomainRuleError(DOMAIN_ERROR_CODE.INVALID_PARAMETER, `Fenêtre ACP invalide : ${window}`)
  }
  const windowIds = new Set(
    closedEditionsInOrder(editions)
      .slice(-window)
      .map((edition) => edition.id),
  )
  return rankTotals(uniquePlayerIds(participations), participations, windowIds)
}

/**
 * RG5 : moyenne = All Time / nombre de participations qui ont des points, 0 compris.
 * La moyenne n'est pas arrondie (le classeur ne l'arrondit pas non plus).
 */
export function computeAverage(participations: readonly IScoredParticipation[]): IPlayerAverage[] {
  const byPlayer = new Map<string, { cents: number; count: number }>()
  for (const participation of participations) {
    const current = byPlayer.get(participation.playerId) ?? { cents: 0, count: 0 }
    current.cents += toCents(participation.points)
    current.count += 1
    byPlayer.set(participation.playerId, current)
  }
  return [...byPlayer.entries()].map(([playerId, { cents, count }]) => ({
    playerId,
    participations: count,
    total: cents / CENTS_PER_POINT,
    average: cents / CENTS_PER_POINT / count,
  }))
}

/** RG6 : nombre de titres (CHAMPION) par joueur. L'affichage en astérisques reste côté front. */
export function countTitles(participations: readonly IStagedParticipation[]): IPlayerTitles[] {
  const titles = new Map<string, number>()
  for (const participation of participations) {
    titles.set(
      participation.playerId,
      (titles.get(participation.playerId) ?? 0) +
        (participation.finalStage === FINAL_STAGE.CHAMPION ? 1 : 0),
    )
  }
  return [...titles.entries()].map(([playerId, count]) => ({ playerId, titles: count }))
}
