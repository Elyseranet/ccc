import { appendFile } from 'node:fs/promises'
import { createTransport } from 'nodemailer'
import type { Transporter } from 'nodemailer'
import { MAIL_TRANSPORT, SMTP_TIMEOUT_MS } from '../consts/mail.const.js'
import type { IMailConfig, IMailMessage, IMailPort } from '../interfaces/mail.interface.js'

/**
 * Adaptateur de production (A3) : SMTP via nodemailer. Mailpit en développement, fournisseur SMTP en production,
 * les deux par `runtimeConfig.mail`. `transporter` est injectable pour les tests.
 */
export const createSmtpMailAdapter = (
  config: IMailConfig,
  transporter: Transporter = createTransport({
    host: config.host,
    port: Number(config.port),
    secure: config.secure === true || config.secure === 'true',
    // Sans identifiant, pas d'authentification (Mailpit).
    ...(config.user ? { auth: { user: config.user, pass: config.password } } : {}),
    connectionTimeout: SMTP_TIMEOUT_MS.CONNECTION,
    greetingTimeout: SMTP_TIMEOUT_MS.GREETING,
    socketTimeout: SMTP_TIMEOUT_MS.SOCKET
  })
): IMailPort => ({
  send: async (message: IMailMessage): Promise<void> => {
    await transporter.sendMail({ from: config.from, to: message.to, subject: message.subject, text: message.text, html: message.html })
  }
})

/**
 * Adaptateur de test : n'envoie rien, ajoute chaque message en JSON (une ligne) à `captureFile`. Les tests d'API
 * lancent le serveur dans un autre processus, ils relisent donc ce fichier. Sélectionné uniquement par
 * `NUXT_MAIL_TRANSPORT=capture` ; jamais le défaut, et refusé par le garde-fou de production (PROD-1).
 */
export const createCaptureMailAdapter = (captureFile: string): IMailPort => ({
  send: async (message: IMailMessage): Promise<void> => {
    await appendFile(captureFile, `${JSON.stringify(message)}\n`, 'utf8')
  }
})

/** Choisit l'adaptateur d'après `runtimeConfig.mail` ; une configuration incohérente lève une erreur explicite. */
export const createMailPort = (config: IMailConfig): IMailPort => {
  if (config.transport === MAIL_TRANSPORT.CAPTURE) {
    if (!config.captureFile) {
      throw new Error('mail.captureFile is required when mail.transport is "capture"')
    }
    return createCaptureMailAdapter(config.captureFile)
  }
  if (config.transport !== MAIL_TRANSPORT.SMTP) {
    throw new Error(`Unknown mail.transport "${config.transport}"`)
  }
  if (!config.host || !config.from) {
    throw new Error('mail.host and mail.from are required when mail.transport is "smtp"')
  }
  return createSmtpMailAdapter(config)
}

let mailPort: IMailPort | undefined

/** Port d'envoi du processus, construit au premier appel depuis `runtimeConfig.mail`. */
export const useMailPort = (): IMailPort => {
  mailPort ??= createMailPort(useRuntimeConfig().mail as IMailConfig)
  return mailPort
}
