export enum USER_ROLE {
  ADMIN = 'ADMIN',
  PARTICIPANT = 'PARTICIPANT'
}

export enum USER_STATUS {
  INVITED = 'INVITED',
  ACTIVE = 'ACTIVE'
}

/** État du compte d'un compétiteur sur sa fiche admin (B-29) : `NONE` pour un compétiteur sans compte (archive). */
export enum COMPETITOR_ACCOUNT_STATUS {
  NONE = 'NONE',
  INVITED = 'INVITED',
  ACTIVE = 'ACTIVE'
}

/** État du compte d'un compétiteur vu par l'administrateur (écran de l'édition). */
export enum ACCOUNT_STATE {
  INVITED = 'INVITED',
  INVITATION_EXPIRED = 'INVITATION_EXPIRED',
  ACTIVE = 'ACTIVE'
}
