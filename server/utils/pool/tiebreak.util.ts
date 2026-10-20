import { TIEBREAK_FORMAT } from '../../enums/domain.enum'
import type { IMatchRecord } from '../../interfaces/stats.interface'
import { MATCH_PURPOSE, MATCH_STATUS } from '../../../shared/enums/match.enum'
import { splitByKey } from '../domain/group.util'

/**
 * Format du départage selon le nombre de joueurs à égalité : 2 -> 1v1 à 5, 3 -> match à
 * 3 côtés, premier à 3 (A10, A11). 4 ou plus : Je ne sais pas, aucune règle écrite
 * (RG19 et RG20 disent « trois ou plus », A11 ne décrit qu'un match à trois côtés).
 */
export function tiebreakFormatFor(playerCount: number): TIEBREAK_FORMAT {
  if (playerCount === 2) {
    return TIEBREAK_FORMAT.ONE_VS_ONE
  }
  return playerCount === 3 ? TIEBREAK_FORMAT.THREE_SIDES : TIEBREAK_FORMAT.UNDEFINED
}

/**
 * Applique les matchs TIEBREAK validés à un groupe de joueurs à égalité. Renvoie les groupes
 * dans l'ordre d'arrivée ; un groupe de plus d'un joueur reste à égalité (aucun match de départage
 * validé qui concerne exactement ces joueurs, ou scores égaux). Un départage à trois côtés dont
 * les deux derniers ont le même score laisse ces deux-là à égalité : on ne les tranche pas.
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
  const sides = [...match.sides].sort((a, b) => b.score - a.score)
  const groups = splitByKey(sides, (side) => side.score).map((block) =>
    block.map((side) => side.playerId),
  )
  if (groups.length === 1) {
    return [[...playerIds]]
  }
  return groups.flatMap((group) => (group.length > 1 ? resolveTiedGroup(group, matches) : [group]))
}
