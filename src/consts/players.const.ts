import { ALIGN } from 'origam/enums'
import { FINAL_STAGE } from '../enums/participation.enum.js'
import { ROUND_KIND } from '../enums/round.enum.js'
import { ROUND_LABELS } from '../consts/round-labels.const.js'
import { COMPETITOR_SORT, SORT_ORDER } from '../enums/competitor-sort.enum.js'
import type { IPlayerJourneyColumn, IPlayersColumn, IPlayersFinalStageLabel } from '../interfaces/players.interface.js'

export const PLAYERS_PAGE_SIZE = 20

export const PLAYERS_SEARCH_MIN_LENGTH = 2

export const PLAYERS_SEARCH_MAX_LENGTH = 50

export const PLAYERS_SEARCH_DEBOUNCE_MS = 350

export const PLAYERS_ALL_EDITIONS = ''

export const PLAYERS_QUERY_KEYS = {
  Q: 'q',
  EDITION: 'edition',
  SORT: 'tri',
  ORDER: 'ordre',
  PAGE: 'page'
} as const

export const PLAYERS_DEFAULT_SORT = COMPETITOR_SORT.DISPLAY_NAME

export const PLAYERS_SORT_DEFAULT_ORDER: Record<COMPETITOR_SORT, SORT_ORDER> = {
  [COMPETITOR_SORT.DISPLAY_NAME]: SORT_ORDER.ASC,
  [COMPETITOR_SORT.EDITIONS_PLAYED]: SORT_ORDER.DESC,
  [COMPETITOR_SORT.MATCHES_PLAYED]: SORT_ORDER.DESC,
  [COMPETITOR_SORT.WINS]: SORT_ORDER.DESC,
  [COMPETITOR_SORT.LOSSES]: SORT_ORDER.DESC,
  [COMPETITOR_SORT.TITLES]: SORT_ORDER.DESC,
  [COMPETITOR_SORT.FIRST_EDITION]: SORT_ORDER.ASC
}

export const PLAYERS_COLUMNS: IPlayersColumn[] = [
  { key: COMPETITOR_SORT.DISPLAY_NAME, title: { key: 'players.column.player', fallback: 'Joueur' }, align: ALIGN.START, width: '37.81%' },
  { key: COMPETITOR_SORT.EDITIONS_PLAYED, title: { key: 'players.column.editions', fallback: 'Éditions' }, align: ALIGN.END, width: '12.78%' },
  { key: COMPETITOR_SORT.MATCHES_PLAYED, title: { key: 'players.column.matches', fallback: 'Matchs' }, align: ALIGN.END, width: '12%' },
  { key: COMPETITOR_SORT.WINS, title: { key: 'players.column.wins', fallback: 'Victoires' }, align: ALIGN.END, width: '13.79%' },
  { key: COMPETITOR_SORT.TITLES, title: { key: 'players.column.titles', fallback: 'Titres' }, align: ALIGN.END, width: '10.49%' },
  { key: COMPETITOR_SORT.FIRST_EDITION, title: { key: 'players.column.first', fallback: 'Première' }, align: ALIGN.START, width: '13.13%' }
]

export const PLAYERS_EDITION_SUFFIX_LABELS: Record<string, { key: string, fallback: string }> = {
  a: { key: 'players.edition_first', fallback: '1re' },
  b: { key: 'players.edition_second', fallback: '2e' }
}

export const PLAYER_FINAL_STAGE_LABELS: Record<FINAL_STAGE, IPlayersFinalStageLabel> = {
  [FINAL_STAGE.POOL_ELIMINATED]: { label: { key: 'player.stage.pool_eliminated', fallback: 'Éliminé·e en poule' }, chart: { key: 'player.chart.pool', fallback: 'Poule' }, level: 0 },
  [FINAL_STAGE.PLAYOFF]: { label: { key: ROUND_LABELS[ROUND_KIND.PLAYOFF].key, fallback: ROUND_LABELS[ROUND_KIND.PLAYOFF].label }, chart: { key: ROUND_LABELS[ROUND_KIND.PLAYOFF].key, fallback: ROUND_LABELS[ROUND_KIND.PLAYOFF].label }, level: 0.5 },
  [FINAL_STAGE.ROUND_OF_16]: { label: { key: 'player.stage.round_of_16', fallback: 'Huitième de finale' }, chart: { key: 'player.chart.round_of_16', fallback: 'Huitième' }, level: 1 },
  [FINAL_STAGE.QUARTER]: { label: { key: 'player.stage.quarter', fallback: 'Quart de finale' }, chart: { key: 'player.chart.quarter', fallback: 'Quart' }, level: 2 },
  [FINAL_STAGE.SEMI]: { label: { key: 'player.stage.semi', fallback: 'Demi-finale' }, chart: { key: 'player.chart.semi', fallback: 'Demi-finale' }, level: 3 },
  [FINAL_STAGE.FINALIST]: { label: { key: 'player.stage.finalist', fallback: 'Finaliste' }, chart: { key: 'player.chart.finalist', fallback: 'Finale' }, level: 4 },
  [FINAL_STAGE.CHAMPION]: { label: { key: 'player.stage.champion', fallback: 'Champion·ne' }, chart: { key: 'player.chart.champion', fallback: 'Titre' }, level: 5 }
}

export const PLAYER_ONGOING_LEVEL = 0

export const PLAYER_OPPONENTS_LIMIT = 4

export const PLAYERS_PAGINATION_VISIBLE = 8

export const PLAYERS_HEAD_TO_HEAD_QUERY_KEYS = {
  A: 'a',
  B: 'b'
} as const

export const PLAYER_JOURNEY_LEVEL_STEP = 17

export const PERCENT = 100

export const PLAYER_JOURNEY_COLUMNS: IPlayerJourneyColumn[] = [
  { field: 'editionLabel', title: { key: 'player.journey.column.edition', fallback: 'Édition' }, align: ALIGN.START },
  { field: 'poolLabel', title: { key: 'player.journey.column.pool', fallback: 'Poule' }, align: ALIGN.START },
  { field: 'result', title: { key: 'player.journey.column.result', fallback: 'Résultat' }, align: ALIGN.START },
  { field: 'bilan', title: { key: 'player.journey.column.bilan', fallback: 'Bilan' }, align: ALIGN.END },
  { field: 'points', title: { key: 'player.journey.column.points', fallback: 'Points' }, align: ALIGN.END }
]

export const PLAYERS_CTA_HOVER = { elevation: 'xl' }

export const PLAYERS_BREADCRUMB_DIVIDER = '›'

export const PLAYERS_KEEP_SERVER_ORDER = (): number => 0

export const PLAYERS_COLUMN_VALUES: Record<COMPETITOR_SORT, string> = {
  [COMPETITOR_SORT.DISPLAY_NAME]: 'displayName',
  [COMPETITOR_SORT.EDITIONS_PLAYED]: 'editionsPlayed',
  [COMPETITOR_SORT.MATCHES_PLAYED]: 'matchesPlayed',
  [COMPETITOR_SORT.WINS]: 'wins',
  [COMPETITOR_SORT.LOSSES]: 'losses',
  [COMPETITOR_SORT.TITLES]: 'titles',
  [COMPETITOR_SORT.FIRST_EDITION]: 'firstEditionCode'
}

export const PLAYER_POINTS_DECIMALS = 2

export const PLAYERS_DIACRITICS = /[\u0300-\u036f]/g

export const PLAYERS_WORD_SEPARATOR = /[\s-]+/
