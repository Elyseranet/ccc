/** Colonnes triables de la liste des compétiteurs, y compris les statistiques. */
export enum COMPETITOR_SORT {
  DISPLAY_NAME = 'displayName',
  EDITIONS_PLAYED = 'editionsPlayed',
  MATCHES_PLAYED = 'matchesPlayed',
  WINS = 'wins',
  LOSSES = 'losses',
  TITLES = 'titles',
  FIRST_EDITION = 'firstEdition',
  ACP_POINTS = 'acpPoints',
  ALL_TIME_POINTS = 'allTimePoints',
  WIN_RATE = 'winRate',
  CAPS_FOR = 'capsFor',
  CAPS_AGAINST = 'capsAgainst',
  CAPS_DIFF = 'capsDiff',
  AVERAGE_POINTS = 'averagePoints'
}

export enum SORT_ORDER {
  ASC = 'asc',
  DESC = 'desc'
}
