import 'reflect-metadata'
import { createInterface } from 'node:readline/promises'
import { normalizeEmail } from './email.util.js'
import { adminEmailSchema } from '../server/schemas/auth.schema.js'
import { DEFAULT_MAIL_FROM, DEFAULT_MAIL_HOST, DEFAULT_MAIL_TRANSPORT } from '../consts/runtime-config.const.js'
import { createAdminWithInvitation } from './create-admin.util.js'
import { assertStrictRuntimeConfig } from './runtime-config-guard.util.js'
import dataSource from '../server/db/typeorm/data-source.js'
import { UserEntity } from '../server/db/typeorm/entities/user.entity.js'

const readEmail = async (): Promise<string> => {
  const reader = createInterface({ input: process.stdin, output: process.stderr })
  try {
    return normalizeEmail(await reader.question('Email du premier administrateur : '))
  } finally {
    reader.close()
  }
}

/**
 * Crée le premier administrateur en statut INVITED, sans mot de passe : aucun secret par défaut, ni en dur ni en
 * variable d'environnement. Affiche UNE fois, sur la sortie standard, son lien de première connexion (valable
 * 7 jours, usage unique). Le jeton en clair n'est jamais journalisé. L'URL de base vient de `NUXT_PUBLIC_SITE_URL`.
 */
const createAdmin = async (): Promise<void> => {
  const siteUrl = process.env.NUXT_PUBLIC_SITE_URL
  if (!siteUrl) {
    throw new Error('NUXT_PUBLIC_SITE_URL est requis pour construire le lien d\'invitation.')
  }
  // PROD-1 : hors de Nitro, la même fonction pure garde la configuration (défauts de nuxt.config si une variable est absente).
  assertStrictRuntimeConfig({
    strictRuntimeConfig: process.env.NUXT_STRICT_RUNTIME_CONFIG,
    public: { siteUrl },
    mail: {
      transport: process.env.NUXT_MAIL_TRANSPORT ?? DEFAULT_MAIL_TRANSPORT,
      host: process.env.NUXT_MAIL_HOST ?? DEFAULT_MAIL_HOST,
      from: process.env.NUXT_MAIL_FROM ?? DEFAULT_MAIL_FROM
    }
  })
  const parsed = adminEmailSchema.safeParse(await readEmail())
  if (!parsed.success) {
    throw new Error('Email invalide.')
  }
  await dataSource.initialize()
  if (await dataSource.getRepository(UserEntity).exists({ where: { email: parsed.data } })) {
    throw new Error('Un compte existe déjà pour cet email.')
  }
  const link = await createAdminWithInvitation(dataSource, parsed.data, siteUrl)
  process.stdout.write(`Lien de première connexion (valable 7 jours, usage unique) :\n${link}\n`)
}

createAdmin()
  .catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : 'Échec de la création.'}\n`)
    process.exitCode = 1
  })
  .finally(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  })
