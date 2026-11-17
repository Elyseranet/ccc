/** Où en est la saisie : repos ou validation (enregistrement + validation) en cours. */
export enum SCORE_ENTRY_PHASE {
  IDLE = 'idle',
  VALIDATING = 'validating'
}

/** Ce qui vient de réussir : `SAVED` est l'étape intermédiaire de « Valider » (la ligne se met à jour, pas de message), `VALIDATED` la fin. */
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
