import 'reflect-metadata'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { ARCHIVES_SEED_FAILED_MESSAGE, ARCHIVES_SEED_PATH } from '../consts/archives-seed.const.js'
import { LOG_EVENT } from '../consts/log-event.const.js'
import dataSource from '../server/db/typeorm/data-source.js'
import { logger } from './logger.util.js'
import { applyArchivesSeed } from './seed-archives.util.js'

/** Usage : `npm run db:seed:archives` (conteneur : `ccc-ops db:seed:archives`), sur une base migrée et vide. */
const run = async (): Promise<void> => {
  const sql = await readFile(resolve(process.cwd(), ARCHIVES_SEED_PATH), 'utf8')
  await dataSource.initialize()
  const counts = await applyArchivesSeed(dataSource, sql)
  logger.info(LOG_EVENT.ARCHIVES_SEED_APPLIED, { ...counts })
}

run()
  .catch((error: unknown) => {
    logger.error(LOG_EVENT.ARCHIVES_SEED_FAILED, { errorName: error instanceof Error ? error.name : undefined })
    process.stderr.write(`${error instanceof Error ? error.message : ARCHIVES_SEED_FAILED_MESSAGE}\n`)
    process.exitCode = 1
  })
  .finally(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  })
