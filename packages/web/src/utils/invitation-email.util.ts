import { INVITATION_TTL_DAYS } from '../consts/invitation.const.js'
import {
  INVITATION_EMAIL_CONTENT,
  INVITATION_EMAIL_HTML_ACTIVATION,
  INVITATION_EMAIL_HTML_TEMPLATE,
  INVITATION_EMAIL_TEXT_ACTIVATION,
  INVITATION_EMAIL_TEXT_TEMPLATE
} from '../consts/invitation-email-template.const.js'
import { HTML_ESCAPES } from '../consts/mail.const.js'
import { INVITATION_EMAIL_KIND } from '../enums/invitation-email.enum.js'
import type { IInvitationEmail, IInvitationEmailInput } from '../interfaces/mail.interface.js'
import { resolveSiteOrigin } from './invitation-link.util.js'

export const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character] ?? character)

/** Remplace les marqueurs `{{nom}}` en une seule passe : une valeur injectée n'est jamais réinterprétée. */
const fillTemplate = (template: string, values: Record<string, string>): string =>
  template.replace(/\{\{(\w+)\}\}/g, (_marker, name: string) => values[name] ?? '')

export const buildInvitationEmail = ({ firstName, link, kind = INVITATION_EMAIL_KIND.PARTICIPANT, contactEmail = '', siteUrl }: IInvitationEmailInput): IInvitationEmail => {
  const origin = resolveSiteOrigin(siteUrl)
  const content = INVITATION_EMAIL_CONTENT[kind]
  if (content.withActivation && !link) {
    throw new Error(`The ${kind} invitation email needs a link`)
  }
  const greeting = firstName ? `Bonjour ${firstName},` : 'Bonjour,'
  const contact = contactEmail.trim()
  const closing = !contact && content.closingWithoutContact ? content.closingWithoutContact : content.closing
  const values = { contactEmail: contact, link: link ?? '', ttl: String(INVITATION_TTL_DAYS), siteUrl: origin, siteHost: new URL(origin).host }
  const escaped = Object.fromEntries(Object.entries(values).map(([name, value]) => [name, escapeHtml(value)]))
  const preview = fillTemplate(content.preview, values)
  const closingText = fillTemplate(closing, values)
  const text = {
    ...values, greeting, preview, eyebrow: content.eyebrow, intro: content.introText, closing: closingText,
    // Avec lien, la phrase se termine par « : » (porté par l'activation) au lieu d'un point.
    body: content.withActivation ? content.body.replace(/\.$/, '') : content.body,
    activation: content.withActivation ? fillTemplate(INVITATION_EMAIL_TEXT_ACTIVATION, values) : ''
  }
  const html = {
    ...escaped, greeting: escapeHtml(greeting), preview: escapeHtml(preview), eyebrow: escapeHtml(content.eyebrow),
    intro: content.introHtml, body: escapeHtml(content.body), closing: escapeHtml(closingText),
    activation: content.withActivation ? fillTemplate(INVITATION_EMAIL_HTML_ACTIVATION, escaped) : ''
  }
  return {
    subject: content.subject,
    text: fillTemplate(INVITATION_EMAIL_TEXT_TEMPLATE, text),
    html: fillTemplate(INVITATION_EMAIL_HTML_TEMPLATE, html)
  }
}
