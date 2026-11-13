/** Voie de qualification d'un joueur à l'issue des poules (RG18). */
export enum QUALIFICATION_ROUTE {
  /** Un des `n` premiers de sa poule. */
  TOP_OF_POOL = 'TOP_OF_POOL',
  /** Un des `m` meilleurs (n+1)èmes, comparés entre poules (A10). */
  BEST_NEXT = 'BEST_NEXT'
}

/** Où se joue l'égalité à départager (RG19, RG20). */
export enum TIEBREAK_SCOPE {
  /** Au sein d'une poule (RG19) : la mini-poule est déjà appliquée (R-6). */
  POOL = 'POOL',
  /** Entre poules, pour une place de meilleur (n+1)ème (RG20). */
  BOUNDARY = 'BOUNDARY'
}

/** Les quatre blocs de la page de qualification (F-24), dans l'ordre où ils se règlent. */
export enum QUALIFICATION_STEP {
  PREREQUISITES = 'prerequisites',
  TIES = 'ties',
  PARAMETERS = 'parameters',
  FINALIZE = 'finalize'
}

/** Statut provisoire d'un joueur dans le classement d'une poule, tant que la liste n'est pas arrêtée. */
export enum QUALIFICATION_RANK_STATUS {
  QUALIFIED = 'qualified',
  TIE = 'tie',
  ELIMINATED = 'eliminated'
}

/** Échec d'une écriture de la page (créer un départage, arrêter la liste), à traduire. */
export enum QUALIFICATION_FAILURE {
  NOT_READY = 'not-ready',
  TIEBREAK_NOT_REQUIRED = 'tiebreak-not-required',
  ALREADY_DONE = 'already-done',
  INVALID = 'invalid',
  CLOSED = 'closed',
  FORBIDDEN = 'forbidden',
  UNAUTHORIZED = 'unauthorized',
  OFFLINE = 'offline',
  UNKNOWN = 'unknown'
}

/** Erreur d'un champ de paramètre (premiers par poule, meilleurs (n+1)es). */
export enum QUALIFICATION_PARAMETER_ERROR {
  NOT_INTEGER = 'not-integer',
  TOO_LOW = 'too-low',
  TOO_HIGH = 'too-high'
}

/** Pourquoi une action de la page est inactive (la raison est écrite sous le bouton). */
export enum QUALIFICATION_BLOCKER {
  PENDING_MATCHES = 'pending-matches',
  TIES_LEFT = 'ties-left',
  PENDING_AND_TIES = 'pending-and-ties',
  TIEBREAK_OPEN = 'tiebreak-open',
  INVALID_PARAMETERS = 'invalid-parameters',
  CLOSED = 'closed'
}

/** Les trois pages de la « Phase finale » (une seule entrée de tiroir, trois pages liées par un stepper : c9790abd (1)). */
export enum PHASE_STEP {
  QUALIFICATION = 'qualification',
  ROUND_DRAW = 'round-draw',
  CLOSING = 'closing'
}

/** Colonnes du classement d'une poule dans la page de qualification. */
export enum QUALIFICATION_RANK_COLUMN {
  RANK = 'rank',
  PLAYER = 'player',
  WINS = 'wins',
  DIFFERENCE = 'difference',
  STATUS = 'status'
}

/** Colonnes de l'aperçu des qualifiés. */
export enum QUALIFIED_COLUMN {
  POOL = 'poolRank',
  RANK = 'rank',
  PLAYER = 'player',
  ROUTE = 'route'
}

