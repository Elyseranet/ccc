import type { ILegacyWorkbookRow } from './legacy-workbook.interface'
import type { IRankingEdition, IScoredParticipation, IStagedParticipation } from './ranking.interface'
import type { IMatchRecord } from './stats.interface'
import type { TLegacyIdentityMapEntry } from '../types/legacy-import.type'
import type { COMPETITOR_ALIAS_SOURCE } from '../enums/competitor.enum'
import type { FINAL_STAGE, PARTICIPATION_STATUS } from '../enums/participation.enum'
import type { MATCH_STATUS } from '../enums/match.enum'
import type { ROUND_KIND } from '../enums/round.enum'
import type {
  LEGACY_ANOMALY_CODE,
  LEGACY_FINAL_STAGE_SOURCE,
  LEGACY_VERIFICATION_METRIC,
} from '../enums/legacy-import.enum'

/** A5 : la graphie de `scores` devient un alias d'un compétiteur de `Data`. */
export interface ILegacyIdentityMergeEntry {
  alias: string
  /** Nom canonique de `Data`, graphie exacte (espaces de bord compris). */
  competitor: string
}

/** A5 : la graphie de `scores` devient un nouveau compétiteur, sans points. */
export interface ILegacyIdentityCreateEntry {
  alias: string
  create: true
}

export interface ILegacyAliasPlan {
  alias: string
  source: COMPETITOR_ALIAS_SOURCE
}

export interface ILegacyEditionPlan {
  code: string
  year: number
  chronologicalRank: number
  participantCount: number
  /** Colonne H de l'en-tête `{code}-0` ; réservé à l'administrateur (R-4). */
  comment: string | null
}

export interface ILegacyCompetitorPlan {
  /** Graphie principale : nom `Data` exact, ou graphie `scores` d'un compétiteur créé. */
  key: string
  displayName: string
  aliases: ILegacyAliasPlan[]
}

export interface ILegacyPoolPlan {
  editionCode: string
  rank: number
}

export interface ILegacyRoundPlan {
  editionCode: string
  kind: ROUND_KIND
  sequence: number
}

export interface ILegacyParticipationPlan {
  editionCode: string
  competitorKey: string
  /** Valeur de la cellule `Data`, telle quelle ; null = issue inconnue. */
  points: number | null
  finalStage: FINAL_STAGE | null
  finalStageSource: LEGACY_FINAL_STAGE_SOURCE | null
  status: PARTICIPATION_STATUS
  poolRank: number | null
}

export interface ILegacyMatchSidePlan {
  position: number
  competitorKey: string
  score: number | null
}

export interface ILegacyMatchPlan {
  legacyCode: string
  editionCode: string
  sequence: number
  roundKind: ROUND_KIND
  poolRank: number | null
  targetScore: number
  status: MATCH_STATUS
  /** Visible par l'administrateur uniquement (A13). */
  comment: string | null
  sides: ILegacyMatchSidePlan[]
}

export interface ILegacyAnomaly {
  code: LEGACY_ANOMALY_CODE
  editionCode: string
  competitor: string | null
  detail: string
  values: Record<string, string | number | null>
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

export interface ILegacySourceCounts {
  dataPlayers: number
  editionHeaders: number
  matchRowsRead: number
  matchRowsNamed: number
  matchRowsTemplate: number
}

export interface ILegacyDomainPlan {
  editions: ILegacyEditionPlan[]
  competitors: ILegacyCompetitorPlan[]
  pools: ILegacyPoolPlan[]
  rounds: ILegacyRoundPlan[]
  participations: ILegacyParticipationPlan[]
  matches: ILegacyMatchPlan[]
  anomalies: ILegacyAnomaly[]
  players: ILegacyWorkbookPlayer[]
  /** Compétiteurs `Data` fusionnés par A5 avec une graphie que le COUNTIF du classeur (insensible à la casse) ne rapproche pas. */
  mergedPlayerNames: string[]
  sourceCounts: ILegacySourceCounts
}

export interface ILegacyTableCounts {
  read: number
  created: number
  updated: number
  unchanged: number
  ignored: number
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

export interface ILegacyImportReport {
  generatedAt: string
  sourceSha256: string
  counts: Record<string, ILegacyTableCounts>
  matchStatusCounts: Record<string, number>
  editions: Array<{
    code: string
    participantCount: number
    participantsListed: number
    participantsPlayedWithoutPoints: number
  }>
  anomalies: ILegacyAnomaly[]
  aliasMerges: ILegacyIdentityMergeEntry[]
  aliasCreations: string[]
  verification: ILegacyVerification | null
}

export interface ILegacyParserInput {
  dataRows: readonly ILegacyWorkbookRow[]
  scoresRows: readonly ILegacyWorkbookRow[]
  identityMap: readonly TLegacyIdentityMapEntry[]
}

export interface IRawMatch {
  legacyCode: string
  editionCode: string
  sequence: number
  label: string
  adv1: string
  adv2: string
  score1: number | null
  score2: number | null
  comment: string | null
}

export interface IParsedLabel {
  kind: ROUND_KIND
  poolRank: number | null
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

export interface IDesiredRow {
  key: string
  values: Record<string, unknown>
}

export interface ISyncResult {
  ids: Map<string, string>
  counts: ILegacyTableCounts
}

export interface ILegacyImportResult {
  report: ILegacyImportReport
  /** false quand la vérification a refusé l'import : la transaction est annulée, le rapport reste écrit. */
  committed: boolean
}
