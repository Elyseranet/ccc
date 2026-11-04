/** Les cinq étapes du tirage des poules (F-11), dans l'ordre. */
export enum POOL_DRAW_STEP {
  PARAMETERS = 'parameters',
  SEEDS = 'seeds',
  ENTRY = 'entry',
  RECAP = 'recap',
  VALIDATION = 'validation'
}

export enum POOL_DRAW_STEP_STATE {
  DONE = 'done',
  ACTIVE = 'active',
  PENDING = 'pending'
}

export enum POOL_DRAW_FEEDBACK_STATUS {
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error'
}

/** État de l'enregistrement du brouillon : la dernière affectation est-elle sur le serveur ? */
export enum POOL_DRAW_SAVE_STATE {
  IDLE = 'idle',
  SAVING = 'saving',
  SAVED = 'saved',
  FAILED = 'failed'
}
