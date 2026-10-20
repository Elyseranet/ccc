import { SIDES_DUEL } from '../../consts/domain-rules.const.js'
import { DOMAIN_ERROR_CODE } from '../../enums/domain.enum.js'
import type {
  IHeadToHead,
  IMatchOutcome,
  IMatchRecord,
  IScoredSide,
  IPlayerBalance,
  IWinLoss,
} from '../../interfaces/stats.interface.js'
import { MATCH_PURPOSE, MATCH_STATUS } from '../../../shared/enums/match.enum.js'
import { DomainRuleError } from '../domain/domain-rule-error.util.js'

/** Un match entre dans les statistiques s'il est VALIDATED et REGULAR (le départage est exclu). */
export function isCountedMatch(match: IMatchRecord): boolean {
  return match.status === MATCH_STATUS.VALIDATED && match.purpose === MATCH_PURPOSE.REGULAR
}

/**
 * Le vainqueur se déduit des scores, jamais de la position des côtés (RG24 ne vaut que
 * comme constat sur le classeur). Lève si le match n'a pas exactement deux côtés distincts
 * ou si les scores ne désignent pas un vainqueur unique.
 */
export function resolveMatchOutcome(match: IMatchRecord): IMatchOutcome {
  if (match.sides.length !== SIDES_DUEL) {
    throw new DomainRuleError(
      DOMAIN_ERROR_CODE.INVALID_MATCH,
      `Un match comptabilisé a ${SIDES_DUEL} côtés, reçu ${match.sides.length}`,
    )
  }
  const [a, b] = match.sides as [IScoredSide, IScoredSide]
  if (a.playerId === b.playerId) {
    throw new DomainRuleError(DOMAIN_ERROR_CODE.INVALID_MATCH, 'Un joueur ne joue pas contre lui-même')
  }
  if (a.score === b.score) {
    throw new DomainRuleError(DOMAIN_ERROR_CODE.INVALID_MATCH, 'Match validé sans vainqueur (scores égaux)')
  }
  return a.score > b.score ? { winner: a, loser: b } : { winner: b, loser: a }
}

export function countedOutcomes(matches: readonly IMatchRecord[]): IMatchOutcome[] {
  return matches.filter(isCountedMatch).map(resolveMatchOutcome)
}

/** R-5 : matchs REGULAR au résultat inconnu, par joueur (un match compte pour ses deux côtés). */
export function countUnknownResults(matches: readonly IMatchRecord[]): Map<string, number> {
  const unknown = new Map<string, number>()
  for (const match of matches) {
    if (match.status === MATCH_STATUS.RESULT_UNKNOWN && match.purpose === MATCH_PURPOSE.REGULAR) {
      for (const side of match.sides) {
        unknown.set(side.playerId, (unknown.get(side.playerId) ?? 0) + 1)
      }
    }
  }
  return unknown
}

/**
 * RG7, R-5 : victoires et défaites par joueur, sur les matchs avec score uniquement. Un match
 * RESULT_UNKNOWN n'est ni une victoire ni une défaite : il est compté dans `unknownResults`.
 */
export function computeWinLoss(matches: readonly IMatchRecord[]): IWinLoss[] {
  const table = new Map<string, IWinLoss>()
  const entry = (playerId: string): IWinLoss => {
    const existing = table.get(playerId) ?? { playerId, wins: 0, losses: 0, unknownResults: 0 }
    table.set(playerId, existing)
    return existing
  }
  for (const { winner, loser } of countedOutcomes(matches)) {
    entry(winner.playerId).wins += 1
    entry(loser.playerId).losses += 1
  }
  for (const [playerId, count] of countUnknownResults(matches)) {
    entry(playerId).unknownResults = count
  }
  return [...table.values()]
}

/** RG37 : bilan global (joués, ratio, V, D, points marqués et encaissés, différentiel C/A). */
export function computePlayerBalance(matches: readonly IMatchRecord[]): IPlayerBalance[] {
  const table = new Map<string, IPlayerBalance>()
  const entry = (playerId: string): IPlayerBalance => {
    const existing = table.get(playerId) ?? {
      playerId,
      played: 0,
      wins: 0,
      losses: 0,
      unknownResults: 0,
      winRatio: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      differential: 0,
    }
    table.set(playerId, existing)
    return existing
  }
  for (const { winner, loser } of countedOutcomes(matches)) {
    const w = entry(winner.playerId)
    const l = entry(loser.playerId)
    w.wins += 1
    l.losses += 1
    w.pointsFor += winner.score
    w.pointsAgainst += loser.score
    l.pointsFor += loser.score
    l.pointsAgainst += winner.score
  }
  for (const [playerId, count] of countUnknownResults(matches)) {
    entry(playerId).unknownResults = count
  }
  return [...table.values()].map((balance) => {
    const played = balance.wins + balance.losses
    return {
      ...balance,
      played,
      winRatio: played === 0 ? null : balance.wins / played,
      differential: balance.pointsFor - balance.pointsAgainst,
    }
  })
}

/** RG36 : confrontations entre deux joueurs. A et B sont rendus dans l'ordre demandé. */
export function computeHeadToHead(
  matches: readonly IMatchRecord[],
  playerAId: string,
  playerBId: string,
): IHeadToHead {
  const result: IHeadToHead = {
    playerAId,
    playerBId,
    encounters: 0,
    winsA: 0,
    winsB: 0,
    pointsA: 0,
    pointsB: 0,
  }
  for (const { winner, loser } of countedOutcomes(matches)) {
    const ids = [winner.playerId, loser.playerId]
    if (!ids.includes(playerAId) || !ids.includes(playerBId)) {
      continue
    }
    const sideA = winner.playerId === playerAId ? winner : loser
    const sideB = winner.playerId === playerAId ? loser : winner
    result.encounters += 1
    result.winsA += sideA === winner ? 1 : 0
    result.winsB += sideB === winner ? 1 : 0
    result.pointsA += sideA.score
    result.pointsB += sideB.score
  }
  return result
}
