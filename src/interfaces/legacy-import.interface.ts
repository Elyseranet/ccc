import type { IRankingEdition, IScoredParticipation, IStagedParticipation } from './ranking.interface.js'
import type { IMatchRecord } from './stats.interface.js'
import type { LEGACY_VERIFICATION_METRIC } from '../enums/legacy-import.enum.js'

export interface ILegacyEditionPlan {
  code: string
  year: number
  chronologicalRank: number
  participantCount: number
  /** Colonne H de l'en-tête `{code}-0` ; réservé à l'administrateur (R-4). */
  comment: string | null
}

/** Une ligne du classement de l'onglet `Data`, telle que le classeur l'affiche. */
export interface ILegacyWorkbookPlayer {
  name: string
  rowNumber: number
  acp: number
  allTime: number
  acpRank: number
  allTimeRank: number
  participations: number
  titles: number
  wins: number
  losses: number
}

export interface ILegacyVerificationMismatch {
  metric: LEGACY_VERIFICATION_METRIC
  player: string
  workbook: number
  computed: number
  /** Écart attendu et expliqué : il reste dans le rapport mais ne bloque pas l'import. */
  expected: boolean
  note: string | null
}

export interface ILegacyVerificationMetric {
  metric: LEGACY_VERIFICATION_METRIC
  compared: number
  mismatches: ILegacyVerificationMismatch[]
}

export interface ILegacyVerification {
  metrics: ILegacyVerificationMetric[]
  /** Écarts qui interdisent de valider l'import. */
  blockingMismatches: number
  /** Joueurs créés par A5, absents du classeur, donc hors comparaison. */
  playersOutsideWorkbook: string[]
}

export interface ILegacyVerificationInput {
  /** Lignes du classement `Data`. */
  players: readonly ILegacyWorkbookPlayer[]
  /** Compétiteurs `Data` fusionnés par A5 : leur V/D du classeur (COUNTIF) ne voit pas la graphie fusionnée. */
  mergedPlayerNames: readonly string[]
  /** `playerId` (id du compétiteur en base) vers nom `Data` exact. */
  nameByPlayerId: ReadonlyMap<string, string>
  editions: readonly IRankingEdition[]
  scored: readonly IScoredParticipation[]
  staged: readonly IStagedParticipation[]
  /** Côtés dans l'ordre des positions : le premier est Adv1. */
  matches: readonly IMatchRecord[]
  playersOutsideWorkbook: readonly string[]
}

/** Onglet `Data` lu depuis `legacy_workbook_rows` : éditions et classement du classeur. */
export interface ILegacyDataSheet {
  editions: ILegacyEditionPlan[]
  players: ILegacyWorkbookPlayer[]
}
