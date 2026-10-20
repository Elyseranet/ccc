import { FINAL_STAGE } from '../../shared/enums/participation.enum.js'
import { ROUND_KIND } from '../../shared/enums/round.enum.js'
import { LEGACY_ROUND_LABEL } from '../enums/legacy-import.enum.js'

export const LEGACY_SHEET_DATA = 'Data'
export const LEGACY_SHEET_SCORES = 'scores'

/** Onglet `Data` (index de colonne, base 0). */
export const LEGACY_DATA_COLUMN = {
  ACP_RANK: 0,
  TITLES: 1,
  NAME: 2,
  ACP: 3,
  PARTICIPATIONS: 4,
  WIN_LOSS: 5,
  ALL_TIME_RANK: 8,
  ALL_TIME: 9,
  FIRST_EDITION: 10,
} as const

export const LEGACY_DATA_ROW = {
  EDITION_CODES: 1,
  PARTICIPANT_COUNTS: 2,
  FIRST_PLAYER: 12,
} as const

/** Onglet `scores` (index de colonne, base 0). */
export const LEGACY_SCORES_COLUMN = {
  ID: 0,
  ROUND: 1,
  ADV1: 2,
  SCORE1: 3,
  ADV2: 4,
  SCORE2: 5,
  COMMENT: 7,
} as const

/** `{code}-{rang}` ; le rang 0 est la ligne d'en-tête d'édition. */
export const LEGACY_MATCH_ID_PATTERN = /^(\d{4}[ab]?)-(\d+)$/
export const LEGACY_POOL_LABEL_PATTERN = /^Poule(\d+)$/
export const LEGACY_EMPTY_MARK = '/'
export const LEGACY_WIN_LOSS_PATTERN = /^\((\d+)\/(\d+)\)$/

export const LEGACY_ROUND_KIND_BY_LABEL: Readonly<Record<LEGACY_ROUND_LABEL, ROUND_KIND>> = {
  [LEGACY_ROUND_LABEL.PLAYOFF]: ROUND_KIND.PLAYOFF,
  [LEGACY_ROUND_LABEL.ROUND_OF_16]: ROUND_KIND.ROUND_OF_16,
  [LEGACY_ROUND_LABEL.QUARTER]: ROUND_KIND.QUARTER,
  [LEGACY_ROUND_LABEL.SEMI]: ROUND_KIND.SEMI,
  [LEGACY_ROUND_LABEL.FINAL]: ROUND_KIND.FINAL,
}

/** Stade atteint par un joueur battu dans ce tour. La finale perdue donne FINALIST ; la gagnée, CHAMPION. */
export const LOST_STAGE_BY_ROUND_KIND: Readonly<Partial<Record<ROUND_KIND, FINAL_STAGE>>> = {
  [ROUND_KIND.PLAYOFF]: FINAL_STAGE.PLAYOFF,
  [ROUND_KIND.ROUND_OF_16]: FINAL_STAGE.ROUND_OF_16,
  [ROUND_KIND.QUARTER]: FINAL_STAGE.QUARTER,
  [ROUND_KIND.SEMI]: FINAL_STAGE.SEMI,
  [ROUND_KIND.FINAL]: FINAL_STAGE.FINALIST,
}

/** Ordre de jeu d'une édition : donne `rounds.sequence`. */
export const ROUND_KIND_ORDER: readonly ROUND_KIND[] = [
  ROUND_KIND.POOLS,
  ROUND_KIND.PLAYOFF,
  ROUND_KIND.ROUND_OF_16,
  ROUND_KIND.QUARTER,
  ROUND_KIND.SEMI,
  ROUND_KIND.FINAL,
]

/** Tolérance du classeur : colonnes D et J à 0,005 près, soit un centime. */
export const LEGACY_POINTS_TOLERANCE_CENTS = 1

export const LEGACY_IDENTITY_MAP_PATH = 'server/database/seeds/data/legacy-identity-map.json'
/** Dossier gitignoré (`.data`). */
export const LEGACY_REPORT_PATH = '.data/reports/legacy-import-report.json'

export const LEGACY_INSERT_BATCH_SIZE = 500

export const NOTE_MERGED_ALIAS =
  'Compétiteur fusionné par A5 : la colonne F du classeur (COUNTIF sur le nom) ne compte pas la graphie fusionnée'
export const NOTE_FLOAT_TIE =
  'Égalité exacte en centièmes, départagée par le bruit flottant de RANK dans le classeur (somme 8,760000000000002 contre 8,76)'
