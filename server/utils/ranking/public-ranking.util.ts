import type { IRankingRow, IRankingEvolutionSeries } from '../../../shared/interfaces/api/ranking.interface'
import type { ICompetitorPublic } from '../../../shared/interfaces/api/competitor.interface'
import { RANKING_TYPE } from '../../../shared/enums/ranking.enum'
import type {
  IPlayerScore,
  IRankingEditionInfo,
  IRankingSourceParticipation,
  IScoredParticipation,
} from '../../interfaces/ranking.interface'
import { computeEvolution } from './evolution.util'
import { closedEditionsInOrder, computeAcp, computeAllTime, computeAverage, countTitles } from './ranking.util'

/**
 * Ne garde que ce qui compte pour un classement (A8) : les participations des éditions
 * clôturées dont les points sont connus. Une participation à `points = null` n'entre pas
 * dans les sommes.
 */
function toScored(
  participations: readonly IRankingSourceParticipation[],
  editions: readonly IRankingEditionInfo[],
): IScoredParticipation[] {
  const closedIds = new Set(closedEditionsInOrder(editions).map((edition) => edition.id))
  return participations.flatMap((participation) =>
    participation.points !== null && closedIds.has(participation.editionId)
      ? [{ playerId: participation.playerId, editionId: participation.editionId, points: participation.points }]
      : [],
  )
}

const byCompetitorName = (a: ICompetitorPublic, b: ICompetitorPublic): number =>
  a.displayName.localeCompare(b.displayName) || a.id.localeCompare(b.id)

/** RG4 + RG5 + RG6. Ex aequo : rang partagé, ordre d'affichage par `displayName`. */
export function buildRankingRows(
  type: RANKING_TYPE,
  competitors: ReadonlyMap<string, ICompetitorPublic>,
  editions: readonly IRankingEditionInfo[],
  participations: readonly IRankingSourceParticipation[],
): IRankingRow[] {
  const scored = toScored(participations, editions)
  const scores: IPlayerScore[] =
    type === RANKING_TYPE.ACP ? computeAcp(scored, editions) : computeAllTime(scored)
  const averages = new Map(computeAverage(scored).map((entry) => [entry.playerId, entry]))
  const closedIds = new Set(closedEditionsInOrder(editions).map((edition) => edition.id))
  const titles = new Map(
    countTitles(
      participations.flatMap((participation) =>
        participation.finalStage !== null && closedIds.has(participation.editionId)
          ? [{ playerId: participation.playerId, editionId: participation.editionId, finalStage: participation.finalStage }]
          : [],
      ),
    ).map((entry) => [entry.playerId, entry.titles]),
  )

  return scores
    .flatMap((score) => {
      const competitor = competitors.get(score.playerId)
      const average = averages.get(score.playerId)
      return competitor && average
        ? [{
            rank: score.rank,
            competitor,
            points: score.total,
            participations: average.participations,
            average: average.average,
            titles: titles.get(score.playerId) ?? 0,
          }]
        : []
    })
    .sort((a, b) => a.rank - b.rank || byCompetitorName(a.competitor, b.competitor))
}

/** RG8 : une série par joueur (ou la seule série de `onlyCompetitorId`), un point par édition clôturée depuis sa première participation. */
export function buildEvolutionSeries(
  type: RANKING_TYPE,
  competitors: ReadonlyMap<string, ICompetitorPublic>,
  editions: readonly IRankingEditionInfo[],
  participations: readonly IRankingSourceParticipation[],
  onlyCompetitorId?: string,
): IRankingEvolutionSeries[] {
  const infoById = new Map(editions.map((edition) => [edition.id, edition]))
  const series = new Map<string, IRankingEvolutionSeries>()

  for (const step of computeEvolution(toScored(participations, editions), editions)) {
    const edition = infoById.get(step.editionId)!
    for (const entry of step.entries) {
      if (onlyCompetitorId !== undefined && entry.playerId !== onlyCompetitorId) {
        continue
      }
      const competitor = competitors.get(entry.playerId)
      if (!competitor) {
        continue
      }
      const current = series.get(entry.playerId) ?? { competitor, points: [] }
      current.points.push({
        editionId: edition.id,
        editionCode: edition.code,
        year: edition.year,
        points: type === RANKING_TYPE.ACP ? entry.acp : entry.allTime,
        rank: type === RANKING_TYPE.ACP ? entry.acpRank : entry.allTimeRank,
      })
      series.set(entry.playerId, current)
    }
  }
  return [...series.values()].sort((a, b) => byCompetitorName(a.competitor, b.competitor))
}
