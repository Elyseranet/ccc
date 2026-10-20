import 'reflect-metadata'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { LEGACY_IDENTITY_MAP_PATH, LEGACY_REPORT_PATH } from '../../consts/legacy-import.const.js'
import { LOG_EVENT } from '../../consts/log-event.const.js'
import { LEGACY_IMPORT_ERROR_CODE } from '../../enums/legacy-import.enum.js'
import type { ILegacyImportReport } from '../../interfaces/legacy-import.interface.js'
import type { TLegacyIdentityMapEntry } from '../../types/legacy-import.type.js'
import { LegacyImportError } from '../../utils/legacy/legacy-import-error.util.js'
import { logger } from '../../utils/logger.util.js'
import dataSource from '../data-source.js'
import { importLegacyDomain } from './legacy-domain-importer.js'

const readIdentityMap = async (): Promise<TLegacyIdentityMapEntry[]> => {
  const parsed: unknown = JSON.parse(await readFile(resolve(process.cwd(), LEGACY_IDENTITY_MAP_PATH), 'utf8'))
  if (!Array.isArray(parsed)) {
    throw new LegacyImportError(LEGACY_IMPORT_ERROR_CODE.IDENTITY_MAP_INVALID, 'Le fichier de correspondance doit être un tableau')
  }
  return parsed as TLegacyIdentityMapEntry[]
}

const writeReport = async (report: ILegacyImportReport): Promise<string> => {
  const reportPath = resolve(process.cwd(), LEGACY_REPORT_PATH)
  await mkdir(dirname(reportPath), { recursive: true })
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  return reportPath
}

const run = async (): Promise<void> => {
  const identityMap = await readIdentityMap()
  await dataSource.initialize()
  try {
    if (await dataSource.showMigrations()) {
      throw new LegacyImportError(
        LEGACY_IMPORT_ERROR_CODE.TARGET_CONFLICT,
        'Migrations en attente : lancer npm run db:migration:run avant la reprise',
      )
    }
    const { report, committed } = await importLegacyDomain(dataSource, identityMap)
    const reportPath = await writeReport(report)
    const mismatches = report.verification?.metrics.flatMap((metric) => metric.mismatches) ?? []
    const summary = {
      committed,
      reportPath,
      counts: report.counts,
      matchStatusCounts: report.matchStatusCounts,
      anomalies: report.anomalies.length,
      mismatches: mismatches.length,
      blockingMismatches: report.verification?.blockingMismatches ?? null,
    }
    if (!committed) {
      logger.error(LOG_EVENT.LEGACY_DOMAIN_IMPORT_FAILED, { ...summary, message: 'Classements différents du classeur : import annulé' })
      process.exitCode = 1
      return
    }
    logger.info(LOG_EVENT.LEGACY_DOMAIN_IMPORT_COMPLETED, summary)
  } finally {
    await dataSource.destroy()
  }
}

void run().catch((error: unknown) => {
  logger.error(LOG_EVENT.LEGACY_DOMAIN_IMPORT_FAILED, {
    code: error instanceof LegacyImportError ? error.code : undefined,
    message: error instanceof Error ? error.message : 'Unknown error',
  })
  process.exitCode = 1
})
