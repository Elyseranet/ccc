/** État de la page de clôture (F-26). */
export enum CLOSING_STATE {
  /** La finale n'est pas validée : la clôture est impossible. */
  BLOCKED = 'blocked',
  READY = 'ready',
  /** L'édition est déjà clôturée : lecture seule, aucun bouton. */
  CLOSED = 'closed'
}

/** Échec de `POST /editions/{id}/cloture`, ramené aux cas qu'on sait dire à l'organisateur. */
export enum CLOSING_FAILURE {
  FINAL_NOT_VALIDATED = 'final-not-validated',
  UNAUTHORIZED = 'unauthorized',
  FORBIDDEN = 'forbidden',
  NOT_FOUND = 'not-found',
  OFFLINE = 'offline',
  UNKNOWN = 'unknown'
}

/** Colonnes du tableau d'aperçu des points. */
export enum CLOSING_PREVIEW_COLUMN {
  RESULT = 'result',
  BASE = 'base',
  POINTS = 'points'
}

/** Messages d'état de la page de clôture. */
export enum CLOSING_NOTICE {
  BLOCKED = 'blocked',
  CLOSED = 'closed',
  SUCCESS = 'success'
}
