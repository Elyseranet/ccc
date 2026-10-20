/** Libellés de tour de l'onglet `scores` (colonne B), hors `PouleN`. */
export enum LEGACY_ROUND_LABEL {
  /** A9 : tour avant les huitièmes, affiché « Barrages ». */
  PLAYOFF = '1/16',
  ROUND_OF_16 = 'Huitième',
  QUARTER = 'Quart',
  SEMI = 'Demi',
  FINAL = 'Finale',
}

export enum LEGACY_IMPORT_ERROR_CODE {
  /** Une graphie de `scores` n'est ni dans `Data` ni dans le fichier de correspondance. */
  UNRESOLVED_ALIAS = 'UNRESOLVED_ALIAS',
  IDENTITY_MAP_INVALID = 'IDENTITY_MAP_INVALID',
  SOURCE_INVALID = 'SOURCE_INVALID',
  /** Une donnée déjà en base contredit ce que l'import veut écrire. */
  TARGET_CONFLICT = 'TARGET_CONFLICT',
  /** Les classements recalculés ne sont pas ceux du classeur. */
  VERIFICATION_FAILED = 'VERIFICATION_FAILED',
}

export enum LEGACY_ANOMALY_CODE {
  /** A6 : effectif déclaré supérieur à l'effectif listé (2012a, 2012b). */
  UNIDENTIFIED_PARTICIPANTS = 'UNIDENTIFIED_PARTICIPANTS',
  /** A7 : cellule `Data` qui ne correspond à aucune valeur du barème RG1 x N / 50. */
  POINTS_OFF_SCALE = 'POINTS_OFF_SCALE',
  /** Un nom joue des matchs d'une édition sans cellule `Data` : issue inconnue. */
  PLAYED_WITHOUT_POINTS = 'PLAYED_WITHOUT_POINTS',
}

export enum LEGACY_FINAL_STAGE_SOURCE {
  /** `points x 50 / N` retombe sur une valeur du barème. */
  SCALE = 'SCALE',
  /** Valeur hors barème : le stade vient du dernier tour joué dans `scores`. */
  MATCHES = 'MATCHES',
}

export enum LEGACY_VERIFICATION_METRIC {
  ALL_TIME = 'ALL_TIME',
  ACP = 'ACP',
  ALL_TIME_RANK = 'ALL_TIME_RANK',
  ACP_RANK = 'ACP_RANK',
  PARTICIPATIONS = 'PARTICIPATIONS',
  TITLES = 'TITLES',
  WIN_LOSS = 'WIN_LOSS',
}
