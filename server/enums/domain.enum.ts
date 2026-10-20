export enum SCORE_ERROR_CODE {
  SCORE_INCONSISTENT = 'SCORE_INCONSISTENT',
}

export enum DOMAIN_ERROR_CODE {
  INVALID_PARAMETER = 'INVALID_PARAMETER',
  STAGE_NOT_PLAYED = 'STAGE_NOT_PLAYED',
  INVALID_MATCH = 'INVALID_MATCH',
}

export enum TIEBREAK_FORMAT {
  /** 2 joueurs : départage 1v1 à 5 (A10, A11). */
  ONE_VS_ONE = 'ONE_VS_ONE',
  /** 3 joueurs ou plus : un seul match à N côtés, premier à 3 points (A11, R-1). */
  MULTI_SIDES = 'MULTI_SIDES',
}
