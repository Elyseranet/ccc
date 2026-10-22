export enum USER_ROLE {
  ADMIN = 'ADMIN',
  PARTICIPANT = 'PARTICIPANT'
}

export enum USER_STATUS {
  INVITED = 'INVITED',
  ACTIVE = 'ACTIVE'
}

/** État du compte d'un compétiteur vu par l'administrateur (écran de l'édition). */
export enum ACCOUNT_STATE {
  INVITED = 'INVITED',
  INVITATION_EXPIRED = 'INVITATION_EXPIRED',
  ACTIVE = 'ACTIVE'
}
