import type { DRAW_STATUS } from '../enums/draw.enum.js'
import type { EDITION_CHIP_FAMILY, EDITION_STEP_STATE } from '../enums/edition-tab.enum.js'
import type { MATCH_STATUS } from '../enums/match.enum.js'
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
  /** Titres du finaliste à la date de l'édition (B-19) ; 0 sans finaliste. */
  finalistTitles: number
  /** Demi-finalistes dans l'ordre du serveur, jamais retriés ; vide tant qu'aucune demi-finale n'est jouée. */
  semifinalists: IEditionPodiumPlace[]
}

export interface IEditionPodiumPlace {
  person: TEditionPerson
  titles: number
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

/** F-35 : composition d'une poule déduite des classements, joueurs par ordre alphabétique (l'ordre du tirage n'est pas connu). */
export interface IEditionReconstitutedPool {
  id: string
  rank: number
  players: TEditionPerson[]
}

/** F-35 : affiches d'un tour déduites des matchs du bracket, dans l'ordre de l'onglet Bracket. */
export interface IEditionReconstitutedRound {
  kind: ROUND_KIND
  pairings: IEditionDrawPairing[]
}

/** F-35 : tirages d'une édition clôturée sans tirage enregistré (DRAWS-ARCH), reconstitués à partir des poules et des matchs. */
export interface IEditionReconstitutedDraws {
  pools: IEditionReconstitutedPool[]
  rounds: IEditionReconstitutedRound[]
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
  /** F-35 : tirages reconstitués d'une édition clôturée sans tirage enregistré ; `null` sinon. */
  reconstituted?: IEditionReconstitutedDraws | null
}

export interface IEditionPoolRow {
  participationId: string
  competitor: TEditionPerson
  rank: number
  played: number
  wins: number
  losses: number
  pointsFor: number
  pointsAgainst: number
  capsAverage: number
  qualified: boolean
}

export interface IEditionPoolTable {
  id: string
  rank: number
  rows: IEditionPoolRow[]
}

export interface IEditionBracketSide {
  participationId: string
  competitor: TEditionPerson
  score: number | null
  isWinner: boolean
}

export interface IEditionBracketMatch {
  id: string
  sides: IEditionBracketSide[]
  /** B-21 : match d'archive sans score dont le vainqueur est connu (affiché « score non archivé »). */
  winnerWithoutScore: boolean
}

export interface IEditionBracketRound {
  kind: ROUND_KIND
  matches: IEditionBracketMatch[]
}

export interface IEditionMatchRow {
  id: string
  sequence: number
  number: string
  roundKind: ROUND_KIND
  poolRank: number | null
  isTiebreak: boolean
  first: TEditionPerson | null
  /** Les autres côtés dans l'ordre du match : un seul pour un duel, deux ou plus pour un départage à 3 côtés ou plus (F-21). */
  others: TEditionPerson[]
  firstScore: number | null
  /** Un score par entrée de `others`, `null` tant que le match n'a pas de vainqueur public. */
  otherScores: Array<number | null>
  hasWinner: boolean
  /** B-21 : match d'archive sans score dont le vainqueur est connu (affiché « score non archivé »). */
  winnerWithoutScore: boolean
  status: MATCH_STATUS
}

export interface IEditionMatchFilterCounts {
  all: number
  pools: number
  knockout: number
}

export interface IEditionGroupsProps {
  tables: IEditionPoolTable[]
}

export interface IEditionBracketProps {
  rounds: IEditionBracketRound[]
}

export interface IEditionMatchesProps {
  rows: IEditionMatchRow[]
  counts: IEditionMatchFilterCounts
  code: string
}
