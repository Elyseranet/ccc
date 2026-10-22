import 'reflect-metadata'
import { createInterface } from 'node:readline/promises'
import { z } from 'zod'
import { USER_ROLE, USER_STATUS } from '../../../enums/user.enum'
import { normalizeEmail } from '../../../utils/email.util'
import { EMAIL_MAX_LENGTH } from '../../../consts/auth.const'
import { LOG_EVENT } from '../../../consts/log-event.const'
import { logger } from '../../utils/logger.util'
import dataSource from '../data-source'
import { UserEntity } from '../entities/user.entity'

const emailSchema = z.string().max(EMAIL_MAX_LENGTH).email()

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
  const parsed = emailSchema.safeParse(await readEmail())
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
