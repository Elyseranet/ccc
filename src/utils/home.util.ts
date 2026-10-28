import { EDITION_STATUS } from '../enums/edition.enum.js'
import { MATCH_STATUS } from '../enums/match.enum.js'
import { ROUND_KIND } from '../enums/round.enum.js'
import type { IEditionSummary } from '../interfaces/edition.interface.js'
import type { IMatch } from '../interfaces/match.interface.js'
import { HOME_LATEST_SCORES_COUNT, HOME_PERCENT_MAX, HOME_RANKING_TOP_COUNT } from '../consts/home.const.js'
import type { IHomeArchive, IHomeChampion, IHomeCurrentEdition, IHomeLatestScore, IHomeOverview, IHomeOverviewSources, IHomeProgress } from '../interfaces/home.interface.js'

/*********************************************************
 * Aperçu de l'accueil
 *
 * @description
 * Fonctions pures qui transforment les réponses de l'API en données d'affichage.
 * Un match n'est un « score » public que s'il est VALIDATED, a un vainqueur et que tous ses côtés portent un score (E-f) :
 * un score saisi mais non validé n'est jamais affiché, même si le serveur en laissait passer un.
 ********************************************************/
const byRecentFirst = (a: IEditionSummary, b: IEditionSummary): number => b.year - a.year || b.code.localeCompare(a.code)

export const selectCurrentEdition = (editions: IEditionSummary[]): IEditionSummary | null =>
  editions.filter(edition => edition.status !== EDITION_STATUS.CLOSED).sort(byRecentFirst)[0] ?? null

export const selectChampion = (editions: IEditionSummary[]): IHomeChampion | null => {
  const closed = editions.filter(edition => edition.status === EDITION_STATUS.CLOSED && edition.champion !== null).sort(byRecentFirst)[0]
  return closed?.champion ? { year: closed.year, competitor: closed.champion.competitor, titles: closed.champion.titlesToDate } : null
}

export const toLatestScore = (match: IMatch): IHomeLatestScore | null => {
  const winner = match.sides.find(side => side.participationId === match.winnerParticipationId)
  const losers = match.sides.filter(side => side.participationId !== match.winnerParticipationId)
  const isPublic = match.status === MATCH_STATUS.VALIDATED && winner !== undefined && losers.length > 0 && match.sides.every(side => side.score !== null)
  if (!isPublic || winner === undefined || winner.score === null) {
    return null
  }
  const loser = [...losers].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0]!
  return {
    id: match.id,
    winner: { id: winner.competitorId, displayName: winner.displayName },
    loser: { id: loser.competitorId, displayName: loser.displayName },
    winnerScore: winner.score,
    loserScore: loser.score ?? 0,
    poolRank: match.roundKind === ROUND_KIND.POOLS ? match.poolRank : null
  }
}

export const toProgress = (sources: IHomeOverviewSources, summary: IEditionSummary): IHomeProgress | null => {
  const round = sources.detail?.rounds.find(entry => entry.kind === ROUND_KIND.POOLS)
  if (!round || round.matchCount === 0) {
    return null
  }
  return {
    validated: round.validatedMatchCount,
    total: round.matchCount,
    percent: round.validatedMatchCount / round.matchCount * HOME_PERCENT_MAX,
    poolCount: sources.detail?.pools.length ?? 0,
    participantCount: summary.participantCount
  }
}

export const toArchive = (sources: IHomeOverviewSources): IHomeArchive => ({
  editions: sources.stats.editions,
  competitors: sources.stats.competitors,
  matches: sources.stats.matches,
  scoredMatches: sources.stats.scoredMatches,
  firstYear: sources.editions.length > 0 ? Math.min(...sources.editions.map(edition => edition.year)) : null
})

export const buildHomeOverview = (sources: IHomeOverviewSources): IHomeOverview => {
  const summary = selectCurrentEdition(sources.editions)
  const latest = [...sources.editions].sort(byRecentFirst)[0] ?? null
  const targetSource = summary ?? latest
  const current: IHomeCurrentEdition | null = summary
    ? {
        id: summary.id,
        code: summary.code,
        year: summary.year,
        status: summary.status,
        progress: toProgress(sources, summary),
        latestScores: sources.matches.map(toLatestScore).filter((score): score is IHomeLatestScore => score !== null).slice(0, HOME_LATEST_SCORES_COUNT)
      }
    : null
  return {
    hasEditions: sources.editions.length > 0,
    current,
    target: targetSource ? { code: targetSource.code, year: targetSource.year } : null,
    champion: selectChampion(sources.editions),
    ranking: sources.ranking.slice(0, HOME_RANKING_TOP_COUNT).map(row => ({
      rank: row.rank,
      competitor: { id: row.competitor.id, displayName: row.competitor.displayName },
      points: row.points,
      titles: row.titles
    })),
    archive: toArchive(sources)
  }
}
