import type { ALIGN } from 'origam/enums'
import type { ICompetitorDetail, ICompetitorListItem, ICompetitorParticipation, ICompetitorPublic } from './competitor.interface.js'
import type { IHeadToHeadSummary } from './head-to-head.interface.js'
import type { COMPETITOR_SORT, SORT_ORDER } from '../enums/competitor-sort.enum.js'
import type { PLAYER_JOURNEY_KIND } from '../enums/player-journey-kind.enum.js'
import type { ITranslatableText } from './common-components.interface.js'

export interface IPlayersSearchState {
  q: string
  edition: string
  sort: COMPETITOR_SORT
  order: SORT_ORDER
  page: number
}

/** Participation affichée dans le parcours : `poolNumber`, `wins`, `losses` et `unknownResults` viennent du contrat (B-17, G2). */
export interface IPlayerParticipation extends ICompetitorParticipation {}

export interface IPlayerDetail extends ICompetitorDetail {
  participations: IPlayerParticipation[]
}

export interface IPlayersSortChange {
  sort: COMPETITOR_SORT
  order: SORT_ORDER
}

export interface IPlayersEditionOption {
  title: string
  value: string
}

export interface IPlayersColumn {
  key: COMPETITOR_SORT
  title: ITranslatableText
  align: ALIGN.START | ALIGN.END
  width: string
}

export interface IPlayerJourneyColumn {
  field: string
  title: ITranslatableText
  align: ALIGN.START | ALIGN.END
}

export interface IPlayersFinalStageLabel {
  label: ITranslatableText
  chart: ITranslatableText
  level: number
}

export interface IPlayerAvatarProps {
  displayName: string
  avatarUrl?: string | null
}

export interface IPlayersSearchProps {
  q: string
  edition: string
  editionOptions: IPlayersEditionOption[]
}

export interface IPlayersSearchEmits {
  (event: 'update:q', value: string): void
  (event: 'update:edition', value: string): void
  (event: 'submit'): void
}

export interface IPlayersDirectoryProps {
  items: ICompetitorListItem[]
  total: number
  page: number
  pageSize: number
  sort: COMPETITOR_SORT
  order: SORT_ORDER
  editionFiltered: boolean
}

export interface IPlayersDirectoryEmits {
  (event: 'update:page', value: number): void
  (event: 'update:sort', value: IPlayersSortChange): void
}

export interface IPlayerHeaderProps {
  competitor: ICompetitorPublic
  titles: number
  firstEditionLabel: string | null
  participationCount: number
  compareTo: string
}

export interface IPlayerStatsProps {
  played: number
  wins: number
  losses: number
  unknownResults: number
}

export interface IPlayerJourneyRow {
  editionId: string
  editionCode: string
  editionLabel: string
  poolLabel: string
  bilan: string
  resultLabel: string
  chartLabel: string
  kind: PLAYER_JOURNEY_KIND
  points: string
  level: number
}

export interface IPlayerJourneyProps {
  rows: IPlayerJourneyRow[]
  tableRows: IPlayerJourneyRow[]
  bestLabel: string | null
}

/** Adversaire de la fiche joueur : `unknownResults` vient du contrat (B-17, G9). */
export interface IPlayerOpponent extends IHeadToHeadSummary {}

export interface IPlayerOpponentsProps {
  playerId: string
  opponents: IPlayerOpponent[]
  total?: number
}
