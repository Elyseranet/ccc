import type {
  IPoolStanding,
  IPoolStandingEntry,
  ITiebreakRequirement,
} from '../../interfaces/pool.interface'
import type { IMatchRecord } from '../../interfaces/stats.interface'
import { splitByKey } from '../domain/group.util'
import { countedOutcomes } from '../stats/record.util'
import { resolveTiedGroup, tiebreakFormatFor } from './tiebreak.util'

/**
 * RG19, A10 : classement d'une poule.
 * Ordre : victoires, puis cap's average (points marqués - encaissés), puis confrontation
 * directe (victoires dans les matchs joués entre les seuls joueurs concernés). Ce qui reste à
 * égalité n'est jamais tranché : il est renvoyé dans `requiresTiebreak`, sauf si un match
 * TIEBREAK validé le départage (A11). Les joueurs encore à égalité partagent le même rang.
 *
 * Interprétation de RG19 : la confrontation directe est étendue à trois joueurs ou plus
 * en comptant les victoires dans la mini-poule des joueurs concernés ; pour deux joueurs elle
 * se réduit au résultat de leur match. RG19 ne le dit pas explicitement pour trois joueurs.
 * Les matchs dont un joueur n'est pas dans `playerIds` sont ignorés.
 */
export function computePoolStanding(
  playerIds: readonly string[],
  matches: readonly IMatchRecord[],
): IPoolStanding {
  const inPool = new Set(playerIds)
  const outcomes = countedOutcomes(matches).filter(
    ({ winner, loser }) => inPool.has(winner.playerId) && inPool.has(loser.playerId),
  )
  const stats = new Map<string, IPoolStandingEntry>(
    playerIds.map((playerId) => [
      playerId,
      { playerId, rank: 0, played: 0, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, capsAverage: 0 },
    ]),
  )
  for (const { winner, loser } of outcomes) {
    const w = stats.get(winner.playerId)!
    const l = stats.get(loser.playerId)!
    w.played += 1
    l.played += 1
    w.wins += 1
    l.losses += 1
    w.pointsFor += winner.score
    w.pointsAgainst += loser.score
    l.pointsFor += loser.score
    l.pointsAgainst += winner.score
  }
  for (const entry of stats.values()) {
    entry.capsAverage = entry.pointsFor - entry.pointsAgainst
  }

  const directWins = (group: readonly IPoolStandingEntry[]): Map<string, number> => {
    const ids = new Set(group.map((entry) => entry.playerId))
    const wins = new Map<string, number>(group.map((entry) => [entry.playerId, 0]))
    for (const { winner, loser } of outcomes) {
      if (ids.has(winner.playerId) && ids.has(loser.playerId)) {
        wins.set(winner.playerId, wins.get(winner.playerId)! + 1)
      }
    }
    return wins
  }

  const entries: IPoolStandingEntry[] = []
  const requiresTiebreak: ITiebreakRequirement[] = []
  const place = (tied: IPoolStandingEntry[]): void => {
    const startRank = entries.length + 1
    for (const entry of tied) {
      entry.rank = startRank
      entries.push(entry)
    }
    if (tied.length > 1) {
      requiresTiebreak.push({
        playerIds: tied.map((entry) => entry.playerId),
        startRank,
        format: tiebreakFormatFor(tied.length),
      })
    }
  }

  const byWins = [...stats.values()].sort((a, b) => b.wins - a.wins)
  for (const winsBlock of splitByKey(byWins, (entry) => entry.wins)) {
    const byCaps = [...winsBlock].sort((a, b) => b.capsAverage - a.capsAverage)
    for (const capsBlock of splitByKey(byCaps, (entry) => entry.capsAverage)) {
      const direct = directWins(capsBlock)
      const byDirect = [...capsBlock].sort((a, b) => direct.get(b.playerId)! - direct.get(a.playerId)!)
      for (const directBlock of splitByKey(byDirect, (entry) => direct.get(entry.playerId)!)) {
        const resolved = resolveTiedGroup(
          directBlock.map((entry) => entry.playerId),
          matches,
        )
        for (const group of resolved) {
          place(group.map((playerId) => stats.get(playerId)!))
        }
      }
    }
  }
  return { entries, requiresTiebreak }
}
