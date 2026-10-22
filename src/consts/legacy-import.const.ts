export const LEGACY_SHEET_DATA = 'Data'

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
export const LEGACY_WIN_LOSS_PATTERN = /^\((\d+)\/(\d+)\)$/

/** Tolérance du classeur : colonnes D et J à 0,005 près, soit un centime. */
export const LEGACY_POINTS_TOLERANCE_CENTS = 1

export const NOTE_MERGED_ALIAS =
  'Compétiteur fusionné par A5 : la colonne F du classeur (COUNTIF sur le nom) ne compte pas la graphie fusionnée'
export const NOTE_FLOAT_TIE =
  'Égalité exacte en centièmes, départagée par le bruit flottant de RANK dans le classeur (somme 8,760000000000002 contre 8,76)'
