import { INVITATION_TTL_DAYS } from '../consts/invitation.const.js'
import { INVITATION_EMAIL_HTML_TEMPLATE, INVITATION_EMAIL_TEXT_TEMPLATE } from '../consts/invitation-email-template.const.js'
import { HTML_ESCAPES, INVITATION_EMAIL_SUBJECT } from '../consts/mail.const.js'
import type { IInvitationEmail, IInvitationEmailInput } from '../interfaces/mail.interface.js'
import { resolveSiteOrigin } from './invitation-link.util.js'

export const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character] ?? character)

/** Remplace les marqueurs `{{nom}}` en une seule passe : une valeur injectée n'est jamais réinterprétée. */
const fillTemplate = (template: string, values: Record<string, string>): string =>
  template.replace(/\{\{(\w+)\}\}/g, (_marker, name: string) => values[name] ?? '')

export const buildInvitationEmail = ({ firstName, link, siteUrl }: IInvitationEmailInput): IInvitationEmail => {
  const origin = resolveSiteOrigin(siteUrl)
  const greeting = firstName ? `Bonjour ${firstName},` : 'Bonjour,'
  const values = { link, ttl: String(INVITATION_TTL_DAYS), siteUrl: origin, siteHost: new URL(origin).host }
  const escaped = Object.fromEntries(Object.entries(values).map(([name, value]) => [name, escapeHtml(value)]))
  return {
    subject: INVITATION_EMAIL_SUBJECT,
    text: fillTemplate(INVITATION_EMAIL_TEXT_TEMPLATE, { ...values, greeting }),
    html: fillTemplate(INVITATION_EMAIL_HTML_TEMPLATE, { ...escaped, greeting: escapeHtml(greeting) })
  }
}
