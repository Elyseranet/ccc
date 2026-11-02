/** Les causes d'échec d'une action du compte (connexion, invitation, profil, avatar), une phrase traduite chacune. */
export enum ACCOUNT_ERROR {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  INVALID_CURRENT_PASSWORD = 'INVALID_CURRENT_PASSWORD',
  RATE_LIMITED = 'RATE_LIMITED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  LINK_GONE = 'LINK_GONE',
  LINK_UNKNOWN = 'LINK_UNKNOWN',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  FORBIDDEN = 'FORBIDDEN',
  BODY_REJECTED = 'BODY_REJECTED',
  AVATAR_TOO_LARGE = 'AVATAR_TOO_LARGE',
  AVATAR_UNSUPPORTED_TYPE = 'AVATAR_UNSUPPORTED_TYPE',
  AVATAR_UNREADABLE = 'AVATAR_UNREADABLE',
  BUSY = 'BUSY',
  OFFLINE = 'OFFLINE',
  UNKNOWN = 'UNKNOWN'
}

/** L'état de la page d'invitation : le lien est vérifié avant d'afficher le formulaire. */
export enum INVITATION_STATE {
  READY = 'READY',
  GONE = 'GONE',
  UNKNOWN = 'UNKNOWN',
  FAILED = 'FAILED'
}

/** Ton d'une carte d'état du compte : l'icône est rouge pour un échec, verte pour une réussite. */
export enum ACCOUNT_STATE_TONE {
  DANGER = 'DANGER',
  SUCCESS = 'SUCCESS'
}

/** Les informations facultatives d'un profil dont l'absence le rend « incomplet » (décision utilisateur) : pseudo, téléphone, photo. */
export enum PROFILE_FIELD {
  NICKNAME = 'NICKNAME',
  PHONE = 'PHONE',
  AVATAR = 'AVATAR'
}
