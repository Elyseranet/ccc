import type { IEditionOption } from './edition-view.interface.js'
import type { RANKING_KIND } from '../enums/ranking-kind.enum.js'
import type { TEditionPerson } from '../types/edition-person.type.js'

/** Un joueur avec ses titres (étoiles RG6) : la valeur que lit `PlayerLink`. */
export interface IPalmaresPlayer {
  competitor: TEditionPerson
  titles: number
}

/** Une ligne de la chronologie des titres : une édition (2012 en compte deux). */
export interface IPalmaresTitle {
  option: IEditionOption
  /** Édition sans champion : en cours (« Voir l'édition »), jamais un champion inventé. */
  isCurrent: boolean
  champion: IPalmaresPlayer | null
  runnerUp: IPalmaresPlayer | null
  /** Score de la finale : seulement quand les deux scores sont validés. */
  score: { champion: number, runnerUp: number } | null
  participantCount: number | null
}

/** Le plus titré (hero) : titres de l'archive, participations de son classement All Time. */
export interface IPalmaresMostTitled {
  competitor: TEditionPerson
  nickname: string | null
  titles: number
  participations: number
}

/** Une ligne de classement : les deux types de points côte à côte, le rang est celui du classement affiché (ex aequo partagés). */
export interface IPalmaresRankingRow {
  id: string
  rank: number
  competitor: TEditionPerson
  titles: number
  points: number
  otherPoints: number
  participations: number
  average: number
}

export interface IPalmaresEvolutionCategory {
  code: string
  option: IEditionOption
}

export interface IPalmaresEvolutionSeries {
  competitor: TEditionPerson
  /** Un point par catégorie, dans l'ordre ; `null` quand le joueur n'a pas de valeur pour cette édition. */
  values: Array<number | null>
}

export interface IPalmaresEvolution {
  categories: IPalmaresEvolutionCategory[]
  series: IPalmaresEvolutionSeries[]
}

/** Périmètre des classements : « au terme de l'édition {lastYear} », fenêtre ACP de `windowFirstYear` à `windowLastYear`. */
export interface IPalmaresScope {
  lastYear: number
  windowFirstYear: number
  windowLastYear: number
}

export interface IPalmaresTitlesProps {
  titles: IPalmaresTitle[]
}

export interface IPalmaresRankingsProps {
  scope: IPalmaresScope | null
  acp: IPalmaresRankingRow[]
  allTime: IPalmaresRankingRow[]
  evolution: IPalmaresEvolution
}

export interface IPalmaresEvolutionProps {
  evolution: IPalmaresEvolution
}

export interface IPalmaresMostTitledProps {
  mostTitled: IPalmaresMostTitled | null
}

export interface IPalmaresRankingTableProps {
  kind: RANKING_KIND
  rows: IPalmaresRankingRow[]
  caption: string
  dataCy: string
}
