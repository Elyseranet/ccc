import type { INVITATION_EMAIL_KIND } from '../enums/invitation-email.enum.js'

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
  /** Absent pour la variante `ADMIN_PROMOTED`, qui ne porte aucun lien. */
  link?: string
  /** `PARTICIPANT` par défaut. */
  kind?: INVITATION_EMAIL_KIND
  /** `runtimeConfig.public.legal.email` : contact de la variante `ADMIN_PROMOTED` ; vide, la phrase n'en cite aucune. */
  contactEmail?: string
  /** `runtimeConfig.public.siteUrl` : origine du logo et du pied de page du mail. */
  siteUrl: string
}

/** Textes d'une variante du mail (`INVITATION_EMAIL_CONTENT`). `{{ttl}}` est accepté dans `preview`. */
export interface IInvitationEmailContent {
  subject: string
  eyebrow: string
  preview: string
  introHtml: string
  introText: string
  body: string
  closing: string
  /** Remplace `closing` quand aucune adresse de contact n'est configurée ; `closing` porte alors `{{contactEmail}}`. */
  closingWithoutContact?: string
  /** Bouton, validité et lien brut : faux pour un mail d'information. */
  withActivation: boolean
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
  /** Absent pour la variante `ADMIN_PROMOTED` (aucun lien émis). */
  token?: string
  /** `PARTICIPANT` par défaut. */
  kind?: INVITATION_EMAIL_KIND
}
