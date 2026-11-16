export interface IMailMessage {
  to: string
  subject: string
  text: string
  html: string
}

/** Port d'envoi d'email (A3). Un adaptateur lève une erreur si l'envoi échoue : l'appelant décide quoi en faire. */
export interface IMailPort {
  send: (message: IMailMessage) => Promise<void>
}

/** `runtimeConfig.mail` : aucun secret en dur, tout vient de l'environnement (`NUXT_MAIL_*`). */
export interface IMailConfig {
  /** `smtp` (défaut) ou `capture` (tests : écrit les envois dans `captureFile`). */
  transport: string
  host: string
  port: number | string
  secure: boolean | string
  user: string
  password: string
  /** Expéditeur, ex. `CCC <no-reply@example.org>`. */
  from: string
  captureFile: string
}

export interface IInvitationEmailInput {
  firstName: string
  link: string
}

export interface IInvitationEmail {
  subject: string
  text: string
  html: string
}

export interface ISendInvitationInput {
  userId: string
  email: string
  firstName: string
  token: string
}
