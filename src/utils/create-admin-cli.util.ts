import 'reflect-metadata'
import { createInterface } from 'node:readline/promises'
import { USER_ROLE, USER_STATUS } from '../enums/user.enum.js'
import { normalizeEmail } from './email.util.js'
import { adminEmailSchema } from '../server/schemas/auth.schema.js'
import { LOG_EVENT } from '../consts/log-event.const.js'
import { logger } from './logger.util.js'
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
 * Crée le premier administrateur en statut INVITED, sans mot de passe : aucun secret par défaut, ni
 * en dur ni en variable d'environnement. Il définit son mot de passe via le lien d'invitation (B-09).
 */
const createAdmin = async (): Promise<void> => {
  const parsed = adminEmailSchema.safeParse(await readEmail())
  if (!parsed.success) {
    throw new Error('Email invalide.')
  }
  await dataSource.initialize()
  const users = dataSource.getRepository(UserEntity)
  if (await users.exists({ where: { email: parsed.data } })) {
    throw new Error('Un compte existe déjà pour cet email.')
  }
  const admin = await users.save({
    email: parsed.data,
    role: USER_ROLE.ADMIN,
    status: USER_STATUS.INVITED,
    passwordHash: null,
    competitorId: null
  })
  logger.info(LOG_EVENT.ADMIN_CREATED, { userId: admin.id })
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
