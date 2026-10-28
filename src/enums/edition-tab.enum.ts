export enum EDITION_TAB {
  SUMMARY = 'synthese',
  PARTICIPANTS = 'participants',
  DRAWS = 'tirages',
  POOLS = 'poules',
  BRACKET = 'bracket',
  MATCHES = 'matchs'
}

export enum EDITION_STEP_STATE {
  DONE = 'done',
  ACTIVE = 'active',
  PENDING = 'pending'
}

export enum EDITION_CHIP_FAMILY {
  NEUTRAL = 'neutral',
  TINTED_SUCCESS = 'tinted-success',
  TINTED_INFO = 'tinted-info',
  FULL_SECONDARY = 'full-secondary'
}

export enum EDITION_MATCH_FILTER {
  ALL = 'all',
  POOLS = 'pools',
  KNOCKOUT = 'knockout'
}

export enum EDITION_POOL_COLUMN {
  RANK = 'rank',
  PLAYER = 'player',
  PLAYED = 'played',
  WINS = 'wins',
  LOSSES = 'losses',
  POINTS = 'points',
  DIFFERENCE = 'difference'
}

export enum EDITION_MATCH_COLUMN {
  NUMBER = 'number',
  ROUND = 'round',
  FIRST = 'first',
  SCORE = 'score',
  SECOND = 'second',
  STATUS = 'status'
}
