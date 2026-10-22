import 'reflect-metadata'
import { LOG_EVENT } from '../../../consts/log-event.const'
import { logger } from '../../utils/logger.util'
import dataSource from '../data-source'
import { unlockUser } from './unlock-user.util'

/** Usage : `npm run user:unlock -- <email>`. Le compteur est en base, la CLI l'atteint sans passer par le serveur. */
const run = async (): Promise<void> => {
  const email = process.argv[2]
  if (!email) {
    throw new Error('Usage : npm run user:unlock -- <email>')
  }
  await dataSource.initialize()
  if (!(await unlockUser(dataSource, email))) {
    throw new Error('Aucun compte pour cet email.')
  }
  logger.info(LOG_EVENT.AUTH_USER_UNLOCKED)
}

run()
  .catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : 'Échec du déblocage.'}\n`)
    process.exitCode = 1
  })
  .finally(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  })
