/** Ce que la page « Tirage du tour » affiche, déduit de l'aperçu du serveur et du tirage en cours (F-25). */
export enum ROUND_DRAW_VIEW {
  /** La liste des qualifiés n'est pas arrêtée : rien à tirer, on renvoie vers la qualification. */
  QUALIFICATION_PENDING = 'qualification-pending',
  /** Le dernier tour tiré a des matchs à jouer : on renvoie vers les scores, filtrés sur ce tour. */
  PREVIOUS_INCOMPLETE = 'previous-incomplete',
  /** Tous les tours, finale comprise, sont tirés et joués. */
  FINISHED = 'finished',
  /** Rien n'est tirable avec ce vivier (impair, trop petit) : on le dit, sans refuser les tailles hors 2, 4, 8, 16 qui se choisissent. */
  UNDRAWABLE = 'undrawable',
  /** Le vivier n'est pas de 2, 4, 8 ou 16 : l'administrateur choisit le tour AVANT la première affiche (673e5b4b). */
  CHOICE = 'choice',
  /** Saisie du tirage, affiche par affiche (c9790abd (5)). */
  ENTRY = 'entry',
  /** Le tirage du tour est validé et ses matchs sont à jouer : lecture seule. */
  DRAWN = 'drawn'
}

/** Pourquoi la validation du tirage est inactive (la raison est écrite sous le bouton). */
export enum ROUND_DRAW_BLOCKER {
  NOTHING_PLACED = 'nothing-placed',
  PAIRINGS_LEFT = 'pairings-left',
  PLAYERS_LEFT = 'players-left',
  SAVING = 'saving',
  SAVE_FAILED = 'save-failed'
}

/** Colonnes du récapitulatif des affiches. */
export enum ROUND_DRAW_RECAP_COLUMN {
  NUMBER = 'number',
  FIRST = 'first',
  SECOND = 'second'
}

/** Colonnes de la composition du vivier. */
export enum ROUND_DRAW_POOL_COLUMN {
  ORIGIN = 'origin',
  COUNT = 'count'
}

/** Mention ajoutée au libellé d'un tour dans le stepper : rien (tour joué ou à venir), « à tirer », « en cours » (tiré, matchs à jouer). */
export enum ROUND_DRAW_MENTION {
  NONE = 'none',
  TO_DRAW = 'to-draw',
  IN_PROGRESS = 'in-progress'
}

/** État d'une affiche dans la saisie : tirée, en cours de saisie, ou à tirer (emplacement passif). */
export enum ROUND_DRAW_PAIRING_STATE {
  FULL = 'full',
  CURRENT = 'current',
  FREE = 'free'
}
