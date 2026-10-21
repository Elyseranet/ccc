import { ACP_WINDOW } from '../../consts/domain-rules.const.js'
import type {
  IEditionEvolution,
  IRankingEdition,
  IScoredParticipation,
} from '../../interfaces/ranking.interface.js'
import { closedEditionsInOrder, rankTotals } from './ranking.util.js'

/**
 * RG8 : ACP et All Time de chaque joueur après chaque édition clôturée, dans l'ordre
 * chronologique. À l'édition i, l'ACP somme les `window` dernières éditions jusqu'à i
 * incluse (moins si l'historique est plus court) ; l'All Time somme tout jusqu'à i.
 * Un joueur apparaît dès sa première participation.
 */
export function computeEvolution(
  participations: readonly IScoredParticipation[],
  editions: readonly IRankingEdition[],
  window: number = ACP_WINDOW,
): IEditionEvolution[] {
  const closed = closedEditionsInOrder(editions)
  return closed.map((edition, index) => {
    const upToHere = closed.slice(0, index + 1).map((e) => e.id)
    const upToHereSet = new Set(upToHere)
    const windowSet = new Set(upToHere.slice(-window))
    const playerIds = [
      ...new Set(
        participations
          .filter((participation) => upToHereSet.has(participation.editionId))
          .map((participation) => participation.playerId),
      ),
    ]
    const acp = new Map(
      rankTotals(playerIds, participations, windowSet).map((score) => [score.playerId, score]),
    )
    const allTime = rankTotals(playerIds, participations, upToHereSet)
    return {
      editionId: edition.id,
      chronologicalRank: edition.chronologicalRank,
      entries: allTime.map((score) => ({
        playerId: score.playerId,
        acp: acp.get(score.playerId)!.total,
        allTime: score.total,
        acpRank: acp.get(score.playerId)!.rank,
        allTimeRank: score.rank,
      })),
    }
  })
}
