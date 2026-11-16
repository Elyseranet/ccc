import type { EDITION_STATUS } from '../enums/edition.enum.js'
import type { ICompetitorPublic } from './competitor.interface.js'
import type { IEditionDetail, IEditionSummary } from './edition.interface.js'
import type { IMatch } from './match.interface.js'
import type { IRankingRow } from './ranking.interface.js'
import type { IArchiveStats } from './stats.interface.js'

export interface IHomePlayer {
  id: string
  displayName: string
}

export interface IHomeLatestScore {
  id: string
  winner: IHomePlayer
  loser: IHomePlayer
  winnerScore: number
  loserScore: number
  poolRank: number | null
}

export interface IHomeProgress {
  validated: number
  total: number
  percent: number
  poolCount: number
  participantCount: number | null
}

export interface IHomeCurrentEdition {
  id: string
  code: string
  year: number
  status: EDITION_STATUS
  progress: IHomeProgress | null
  latestScores: IHomeLatestScore[]
}

export interface IHomeChampion {
  year: number
  competitor: ICompetitorPublic
  titles: number
}

export interface IHomeRankingEntry {
  rank: number
  competitor: IHomePlayer
  points: number
  titles: number
}

export interface IHomeArchive {
  editions: number
  competitors: number
  matches: number
  scoredMatches: number
  firstYear: number | null
}

export interface IHomeLink {
  code: string
  year: number
}

export interface IHomeOverview {
  hasEditions: boolean
  current: IHomeCurrentEdition | null
  target: IHomeLink | null
  champion: IHomeChampion | null
  ranking: IHomeRankingEntry[]
  archive: IHomeArchive
}

export interface IHomeOverviewSources {
  editions: IEditionSummary[]
  stats: IArchiveStats
  detail: IEditionDetail | null
  matches: IMatch[]
  ranking: IRankingRow[]
}

export interface IHomeHeroProps {
  archive: IHomeArchive
  target: IHomeLink | null
  /** Cible du lien vers le palmarès ; absente tant que la page n'est pas livrée (le lien est alors masqué). */
  hallOfFameTo?: string
}

export interface IHomeCurrentEditionProps {
  current: IHomeCurrentEdition | null
}

export interface IHomeBentoProps {
  overview: IHomeOverview
  /** Cible des liens vers le palmarès ; absente tant que la page n'est pas livrée (les liens sont alors masqués). */
  hallOfFameTo?: string
}
