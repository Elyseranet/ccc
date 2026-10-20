import type {
  IPoolStanding,
  IPoolStandingEntry,
  IQualification,
  ITiebreakRequirement,
} from '../../interfaces/pool.interface'
import type { IMatchRecord } from '../../interfaces/stats.interface'
import { splitByEquality } from '../domain/group.util'
import { resolveTiedGroup, tiebreakFormatFor } from './tiebreak.util'

/**
 * Comparaison entre poules inégales (A10) : ratio de victoires, puis cap's average PAR MATCH.
 * Produits en croix sur des entiers : pas de division, pas de flottant. Négatif si `a` est
 * meilleur.
 */
function compareAcrossPools(a: IPoolStandingEntry, b: IPoolStandingEntry): number {
  return (
    b.wins * a.played - a.wins * b.played || b.capsAverage * a.played - a.capsAverage * b.played
  )
}

/**
 * RG18, RG20, A10 : les n premiers de chaque poule, puis les m meilleurs (n+1)èmes, comparés
 * par ratio de victoires puis cap's average par match.
 *
 * - Égalité DANS une poule qui touche la (n+1)ème place : le (n+1)ème n'est pas connu, la
 *   fonction renvoie ces égalités sans qualifier personne.
 * - Égalité à la frontière des m places : les joueurs sont renvoyés dans `requiresTiebreak`
 *   (2 -> départage à 5, 3 ou plus -> un match à N côtés, premier à 3, R-1), avec
 *   `tiebreakSlots` places à pourvoir. Les matchs TIEBREAK validés de `tiebreakMatches`
 *   (paramètre ajouté au ticket pour que l'égalité se referme une fois le départage joué)
 *   la tranchent.
 */
export function selectQualifiers(
  standings: readonly IPoolStanding[],
  topPerPool: number,
  bestNextCount: number,
  tiebreakMatches: readonly IMatchRecord[] = [],
): IQualification {
  const frontierRank = topPerPool + 1
  const poolTies = standings.flatMap((standing) =>
    standing.requiresTiebreak.filter(
      (tie) => tie.startRank <= frontierRank && frontierRank < tie.startRank + tie.playerIds.length,
    ),
  )
  if (poolTies.length > 0) {
    return { topQualifiers: [], bestNextQualifiers: [], requiresTiebreak: poolTies, tiebreakSlots: 0 }
  }

  const topQualifiers = standings.flatMap((standing) =>
    standing.entries.slice(0, topPerPool).map((entry) => entry.playerId),
  )
  const candidates = standings
    .flatMap((standing) => standing.entries.slice(topPerPool, frontierRank))
    .sort(compareAcrossPools)

  const bestNextQualifiers: string[] = []
  const requiresTiebreak: ITiebreakRequirement[] = []
  let tiebreakSlots = 0
  for (const block of splitByEquality(candidates, (a, b) => compareAcrossPools(a, b) === 0)) {
    const slots = bestNextCount - bestNextQualifiers.length
    if (slots <= 0) {
      break
    }
    for (const group of resolveTiedGroup(
      block.map((entry) => entry.playerId),
      tiebreakMatches,
    )) {
      const remaining = bestNextCount - bestNextQualifiers.length
      if (group.length <= remaining) {
        bestNextQualifiers.push(...group)
      } else if (remaining > 0) {
        requiresTiebreak.push({
          playerIds: group,
          startRank: bestNextQualifiers.length + 1,
          format: tiebreakFormatFor(group.length),
        })
        tiebreakSlots = remaining
        break
      }
    }
    if (requiresTiebreak.length > 0) {
      break
    }
  }
  return { topQualifiers, bestNextQualifiers, requiresTiebreak, tiebreakSlots }
}
