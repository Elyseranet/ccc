import { TIEBREAK_FORMAT } from '../../enums/domain.enum'
import type { IMatchRecord } from '../../interfaces/stats.interface'
import { MATCH_PURPOSE, MATCH_STATUS } from '../../../shared/enums/match.enum'

/**
 * Format du départage selon le nombre de joueurs à égalité : 2 -> 1v1 à 5 ; 3 ou plus -> un
 * seul match à N côtés, premier à 3 (A10, A11, R-1).
 */
export function tiebreakFormatFor(playerCount: number): TIEBREAK_FORMAT {
  return playerCount === 2 ? TIEBREAK_FORMAT.ONE_VS_ONE : TIEBREAK_FORMAT.MULTI_SIDES
}

/**
 * Applique les matchs TIEBREAK validés à un groupe de joueurs à égalité (A11, R-1, R-2).
 * Un match à N côtés a un seul gagnant (le meilleur score) ; TOUS les perdants restent ex aequo,
 * même si leurs scores diffèrent (3-2-1 : les deux derniers ne sont pas classés entre eux).
 * Un éventuel second départage entre perdants est un autre match TIEBREAK qui concerne exactement
 * ce sous-groupe. Renvoie les groupes dans l'ordre d'arrivée ; un groupe de plus d'un joueur reste
 * à égalité (aucun match validé qui le concerne exactement, ou scores tous égaux).
 */
export function resolveTiedGroup(
  playerIds: readonly string[],
  matches: readonly IMatchRecord[],
): string[][] {
  const wanted = new Set(playerIds)
  const match = matches.find(
    (candidate) =>
      candidate.status === MATCH_STATUS.VALIDATED &&
      candidate.purpose === MATCH_PURPOSE.TIEBREAK &&
      candidate.sides.length === wanted.size &&
      candidate.sides.every((side) => wanted.has(side.playerId)),
  )
  if (!match) {
    return [[...playerIds]]
  }
  const best = Math.max(...match.sides.map((side) => side.score))
  const winners = match.sides.filter((side) => side.score === best).map((side) => side.playerId)
  const losers = match.sides.filter((side) => side.score !== best).map((side) => side.playerId)
  if (losers.length === 0) {
    return [[...playerIds]]
  }
  return [winners, losers].flatMap((group) =>
    group.length > 1 ? resolveTiedGroup(group, matches) : [group],
  )
}
