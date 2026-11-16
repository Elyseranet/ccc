import { CAP_TONE } from '../enums/cap-tone.enum.js'
import { MATCH_SORT } from '../enums/match-sort.enum.js'
import { MATCH_STATUS } from '../enums/match.enum.js'

export const HOME_LATEST_SCORES_COUNT = 4

export const HOME_RANKING_TOP_COUNT = 3

export const HOME_MATCHES_QUERY = {
  pageSize: HOME_LATEST_SCORES_COUNT,
  statut: [MATCH_STATUS.VALIDATED],
  tri: MATCH_SORT.VALIDATED_AT_DESC
}

export const HOME_CTA_HOVER = { elevation: 'xl' }

export const HOME_ARROW_GLYPH = '→'

export const HOME_SCORE_SEPARATOR_GLYPH = '–'

export const HOME_PERCENT_MAX = 100

export const HOME_PINT_BUBBLES = [
  { cx: 80, cy: 270, r: 4 },
  { cx: 110, cy: 280, r: 3 },
  { cx: 140, cy: 265, r: 5 },
  { cx: 95, cy: 250, r: 3 },
  { cx: 125, cy: 275, r: 4 },
  { cx: 150, cy: 282, r: 3 }
]

export const HOME_PINT_CAPS = [
  { modifier: 'one', tone: CAP_TONE.NEON, label: true },
  { modifier: 'two', tone: CAP_TONE.AMBER, label: false },
  { modifier: 'three', tone: CAP_TONE.ICE, label: false }
]

export const HOME_ACP_WINDOW_EDITIONS = 5

export const HOME_POINTS_DECIMALS = 2

export const HOME_EMPTY_ARCHIVE = { editions: 0, competitors: 0, matches: 0, scoredMatches: 0, firstYear: null }

/** Épaisseur (px) de la barre d'avancement des poules : `--origam-space---2` de la maquette. */
export const HOME_PROGRESS_THICKNESS = 8

/** Fond de la piste de la barre d'avancement : surface « creusée » de la maquette. */
export const HOME_PROGRESS_TRACK_COLOR = 'var(--origam-color__surface---sunken)'

/** Taille du nom de la marque dans la capsule de la pinte de l'accueil (unités du viewBox de la capsule). */
export const HOME_PINT_CAP_TEXT_SIZE = 22
