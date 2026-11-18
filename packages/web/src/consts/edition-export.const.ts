import { DRAW_KIND, DRAW_STATUS } from '../enums/draw.enum.js'
import { EDITION_EXPORT_SHEET } from '../enums/edition-export.enum.js'
import { EDITION_ORIGIN } from '../enums/edition.enum.js'

/** Type MIME d'un classeur .xlsx (B-30). */
export const EDITION_EXPORT_CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

/** Nom du fichier téléchargé : `ccc-<code>.xlsx` (un code d'édition est `\d{4}[ab]?`, sûr dans un nom de fichier). */
export const buildEditionExportFilename = (code: string): string => `ccc-${code}.xlsx`

/** Noms d'onglets (31 caractères au plus, sans `\ / ? * [ ]` : contraintes d'Excel). */
export const EDITION_EXPORT_SHEET_NAMES: Record<EDITION_EXPORT_SHEET, string> = {
  [EDITION_EXPORT_SHEET.EDITION]: 'Édition',
  [EDITION_EXPORT_SHEET.PARTICIPANTS]: 'Participants',
  [EDITION_EXPORT_SHEET.POOLS]: 'Poules',
  [EDITION_EXPORT_SHEET.MATCHES]: 'Matchs',
  [EDITION_EXPORT_SHEET.DRAWS]: 'Tirages',
  [EDITION_EXPORT_SHEET.FINAL_PHASE]: 'Phases finales'
}

export const EDITION_EXPORT_DATE_FORMAT = 'dd/mm/yyyy'
export const EDITION_EXPORT_DATE_TIME_FORMAT = 'dd/mm/yyyy hh:mm'

export const EDITION_EXPORT_YES = 'Oui'
export const EDITION_EXPORT_NO = 'Non'

export const EDITION_EXPORT_ORIGIN_LABELS: Record<EDITION_ORIGIN, string> = {
  [EDITION_ORIGIN.APP]: 'Application',
  [EDITION_ORIGIN.LEGACY_IMPORT]: 'Archive'
}

export const EDITION_EXPORT_DRAW_KIND_LABELS: Record<DRAW_KIND, string> = {
  [DRAW_KIND.POOLS]: 'Poules',
  [DRAW_KIND.ROUND]: 'Tour'
}

export const EDITION_EXPORT_DRAW_STATUS_LABELS: Record<DRAW_STATUS, string> = {
  [DRAW_STATUS.DRAFT]: 'Brouillon',
  [DRAW_STATUS.VALIDATED]: 'Validé'
}

export const EDITION_EXPORT_EDITION_HEADERS = ['Champ', 'Valeur'] as const
export const EDITION_EXPORT_PARTICIPANT_HEADERS = ['Nom', 'Prénom', 'Pseudo', 'Poule', 'Tête de série', 'Tour atteint', 'Points'] as const
export const EDITION_EXPORT_POOL_HEADERS = ['Poule', 'Rang', 'Joueur', 'Joués', 'Victoires', 'Défaites', 'Points pour', 'Points contre', 'Cap\'s average'] as const
export const EDITION_EXPORT_MATCH_HEADERS = ['Tour', 'Poule', 'N°', 'Joueur A', 'Score A', 'Joueur B', 'Score B', 'Vainqueur', 'Statut', 'Départage', 'Autres joueurs'] as const
export const EDITION_EXPORT_DRAW_HEADERS = ['Tirage', 'Tour', 'Statut', 'Ordre', 'Poule', 'Affiche', 'Côté', 'Joueur', 'Tête de série'] as const
export const EDITION_EXPORT_FINAL_PHASE_HEADERS = ['Tour', 'N°', 'Joueur A', 'Score A', 'Joueur B', 'Score B', 'Vainqueur'] as const

/** Libellés des champs de l'onglet Édition. */
export const EDITION_EXPORT_FIELDS = {
  YEAR: 'Année',
  CODE: 'Code',
  NAME: 'Nom',
  HELD_ON: 'Date',
  LOCATION: 'Lieu',
  DESCRIPTION: 'Description',
  STATUS: 'Statut',
  ORIGIN: 'Origine',
  PARTICIPANT_COUNT: 'Effectif N',
  REGISTERED: 'Inscrits',
  TOP_PER_POOL: 'Qualifiés par poule',
  BEST_NEXT_COUNT: 'Meilleurs suivants',
  WITH_PLAYOFF: 'Barrages',
  CLOSED_AT: 'Date de clôture',
  CHAMPION: 'Vainqueur',
  RUNNER_UP: 'Finaliste'
} as const

export const EDITION_EXPORT_CHAMPION_ROW = 'Vainqueur de l\'édition'
export const EDITION_EXPORT_SIDE_SEPARATOR = ' ; '

/** Largeurs de colonne, en caractères. */
export const EDITION_EXPORT_COLUMN_WIDTH = { NARROW: 10, DEFAULT: 16, WIDE: 26, DESCRIPTION: 60 } as const
