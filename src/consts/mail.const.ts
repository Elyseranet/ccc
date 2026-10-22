export const MAIL_TRANSPORT = {
  SMTP: 'smtp',
  CAPTURE: 'capture'
} as const

/** Délais explicites : un SMTP injoignable ne doit pas retenir la requête de l'administrateur. */
export const SMTP_TIMEOUT_MS = {
  CONNECTION: 5000,
  GREETING: 5000,
  SOCKET: 10000
} as const

export const INVITATION_EMAIL_SUBJECT = 'Votre invitation au CCC'

export const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }
