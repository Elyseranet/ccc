import { INVITATION_TTL_DAYS } from '../consts/invitation.const.js'
import { HTML_ESCAPES, INVITATION_EMAIL_SUBJECT } from '../consts/mail.const.js'
import type { IInvitationEmail, IInvitationEmailInput } from '../interfaces/mail.interface.js'

export const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character] ?? character)

export const buildInvitationEmail = ({ firstName, link }: IInvitationEmailInput): IInvitationEmail => {
  const greeting = firstName ? `Bonjour ${firstName},` : 'Bonjour,'
  const text = [
    greeting,
    '',
    'Un compte vient de vous être créé sur le site du CCC. Définissez votre mot de passe et complétez votre profil depuis ce lien :',
    '',
    link,
    '',
    `Ce lien est valable ${INVITATION_TTL_DAYS} jours et ne peut servir qu'une fois.`,
    'Si vous n\'attendiez pas ce message, ignorez-le.'
  ].join('\n')
  const html = [
    `<p>${escapeHtml(greeting)}</p>`,
    '<p>Un compte vient de vous être créé sur le site du CCC. Définissez votre mot de passe et complétez votre profil depuis ce lien :</p>',
    `<p><a href="${escapeHtml(link)}">${escapeHtml(link)}</a></p>`,
    `<p>Ce lien est valable ${INVITATION_TTL_DAYS} jours et ne peut servir qu'une fois.<br>Si vous n'attendiez pas ce message, ignorez-le.</p>`
  ].join('\n')
  return { subject: INVITATION_EMAIL_SUBJECT, text, html }
}
