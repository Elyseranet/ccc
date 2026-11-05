/** Où en est la saisie : repos, enregistrement ou validation en cours (un seul appel à la fois). */
export enum SCORE_ENTRY_PHASE {
  IDLE = 'idle',
  SAVING = 'saving',
  VALIDATING = 'validating'
}

/** Ce qui vient de réussir (message de confirmation). */
export enum SCORE_ENTRY_SUCCESS {
  SAVED = 'saved',
  VALIDATED = 'validated'
}

/** Erreur d'un champ de score, avant tout envoi (RG22). */
export enum SCORE_FIELD_ERROR {
  MISSING = 'missing',
  NOT_INTEGER = 'not-integer',
  ABOVE_TARGET = 'above-target'
}

/** Erreur du formulaire entier : le vainqueur doit atteindre exactement la cible (RG22). */
export enum SCORE_FORM_ERROR {
  NO_WINNER = 'no-winner',
  SEVERAL_WINNERS = 'several-winners',
  INCONSISTENT = 'inconsistent'
}

/** Échec d'une écriture de score, traduit en message (par code d'erreur d'abord, par statut ensuite). */
export enum SCORE_FAILURE {
  VERSION_CONFLICT = 'version-conflict',
  ALREADY_VALIDATED = 'already-validated',
  NEXT_ROUND_ENGAGED = 'next-round-engaged',
  INCONSISTENT = 'inconsistent',
  CONFLICT = 'conflict',
  FORBIDDEN = 'forbidden',
  UNAUTHORIZED = 'unauthorized',
  PAYLOAD_TOO_LARGE = 'payload-too-large',
  OFFLINE = 'offline',
  FRONT_DEFECT = 'front-defect',
  UNKNOWN = 'unknown'
}
