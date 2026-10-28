import type { DRAW_STATUS } from '../enums/draw.enum.js'
import type { EDITION_CHIP_FAMILY, EDITION_STEP_STATE } from '../enums/edition-tab.enum.js'
import type { ROUND_KIND } from '../enums/round.enum.js'
import type { TEditionPerson } from '../types/edition-person.type.js'
import type { ITranslatableText } from './common-components.interface.js'

/** Podium de la Synthèse : champion·ne (avec ses titres à date), finale jouée, finaliste et demi-finalistes. */
export interface IEditionPodium {
  champion: TEditionPerson
  titlesToDate: number
  finalWinnerScore: number | null
  finalLoserScore: number | null
  finalist: TEditionPerson | null
  semifinalists: TEditionPerson[]
}

export interface IEditionFact {
  id: string
  label: ITranslatableText
  value: string
  detail: ITranslatableText | null
  extra: ITranslatableText | null
}

export interface IEditionStep {
  id: string
  index: number
  label: ITranslatableText
  state: EDITION_STEP_STATE
}

export interface IEditionParticipantRow {
  participationId: string
  competitor: TEditionPerson
  avatarUrl: string | null
  initials: string
  poolRank: number | null
  result: ITranslatableText
  family: EDITION_CHIP_FAMILY
}

export interface IEditionSeedRow {
  participationId: string
  competitor: TEditionPerson
  poolRank: number
}

export interface IEditionDrawPairing {
  index: number
  sides: TEditionPerson[]
}

export interface IEditionDrawView {
  id: string
  roundKind: ROUND_KIND
  status: DRAW_STATUS
  pairings: IEditionDrawPairing[]
}

export interface IEditionHeroMeta {
  status: ITranslatableText
  family: EDITION_CHIP_FAMILY
  summary: ITranslatableText
}

export interface IEditionOption {
  code: string
  year: number
  ordinal: ITranslatableText | null
}

export interface IEditionChipProps {
  family: EDITION_CHIP_FAMILY
  text: string
}

export interface IEditionSelectorProps {
  options: IEditionOption[]
  current: string
}

export interface IEditionSummaryProps {
  podium: IEditionPodium | null
  facts: IEditionFact[]
  steps: IEditionStep[]
}

export interface IEditionParticipantsProps {
  participants: IEditionParticipantRow[]
}

export interface IEditionDrawsProps {
  seeds: IEditionSeedRow[]
  poolsStatus: DRAW_STATUS | null
  roundDraws: IEditionDrawView[]
}

export interface IEditionUpcomingProps {
  heading: ITranslatableText
  dataCy: string
}
