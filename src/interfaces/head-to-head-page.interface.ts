import type { ICompetitorDetail, ICompetitorPublic } from './competitor.interface.js'
import type { IHeadToHead, IHeadToHeadMatch } from './head-to-head.interface.js'
import type { HEAD_TO_HEAD_FIELD_ERROR } from '../enums/head-to-head.enum.js'

export interface IHeadToHeadOption {
  title: string
  value: string
}

export interface IHeadToHeadPickerProps {
  playerA: string | null
  playerB: string | null
  searchA: string
  searchB: string
  optionsA: IHeadToHeadOption[]
  optionsB: IHeadToHeadOption[]
  errorA: HEAD_TO_HEAD_FIELD_ERROR
  errorB: HEAD_TO_HEAD_FIELD_ERROR
}

export interface IHeadToHeadPickerEmits {
  (event: 'update:playerA', value: string | null): void
  (event: 'update:playerB', value: string | null): void
  (event: 'update:searchA', value: string): void
  (event: 'update:searchB', value: string): void
  (event: 'swap'): void
}

export interface IHeadToHeadSummaryProps {
  comparison: IHeadToHead
  detailA: ICompetitorDetail | null
  detailB: ICompetitorDetail | null
}

export interface IHeadToHeadHistoryProps {
  comparison: IHeadToHead
  detailA: ICompetitorDetail | null
  detailB: ICompetitorDetail | null
}

export interface IHeadToHeadRow {
  id: string
  edition: string
  round: string
  score: string
  winner: ICompetitorPublic
  winnerTitles: number
}

export interface IHeadToHeadLastMeeting {
  editionCode: string
  roundKind: IHeadToHeadMatch['roundKind']
}

export interface IHeadToHeadBilanItem {
  key: string
  value: string
}
