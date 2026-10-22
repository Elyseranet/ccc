import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export const TEST_SITE_URL = 'https://ccc.example.test'

export interface ICapturedMail {
  to: string
  subject: string
  text: string
  html: string
}

export interface IMailCapture {
  file: string
  /** Variables d'environnement qui branchent le serveur de test sur l'adaptateur de capture. */
  env: Record<string, string>
  read: () => Promise<ICapturedMail[]>
  dispose: () => Promise<void>
}

/** Le serveur de test tourne dans un autre processus : les envois sont relus depuis le fichier de l'adaptateur de capture. */
export const createMailCapture = async (): Promise<IMailCapture> => {
  const directory = await mkdtemp(join(tmpdir(), 'ccc-api-mail-'))
  const file = join(directory, 'mails.jsonl')
  return {
    file,
    env: { NUXT_MAIL_TRANSPORT: 'capture', NUXT_MAIL_CAPTURE_FILE: file, NUXT_PUBLIC_SITE_URL: TEST_SITE_URL },
    read: async () => {
      try {
        return (await readFile(file, 'utf8')).split('\n').filter(Boolean).map((line) => JSON.parse(line) as ICapturedMail)
      } catch {
        return []
      }
    },
    dispose: () => rm(directory, { recursive: true, force: true })
  }
}

const LINK_PATTERN = /https?:\/\/[^\s"]+\/invitation\/([A-Za-z0-9_-]{43})/

/** Jeton en clair porté par le lien de l'email. */
export const tokenFromMail = (mail: ICapturedMail): string => {
  const match = LINK_PATTERN.exec(mail.text)
  if (!match?.[1]) {
    throw new Error('No invitation link in the captured mail')
  }
  return match[1]
}
