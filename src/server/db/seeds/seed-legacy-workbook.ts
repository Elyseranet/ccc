import 'reflect-metadata'
import { readFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import dataSource from '../data-source'
import { LegacyWorkbookImportEntity } from '../entities/legacy-workbook-import.entity'
import { LegacyWorkbookRowEntity } from '../entities/legacy-workbook-row.entity'
import { LOG_EVENT } from '../../../consts/log-event.const'
import { logger } from '../../utils/logger.util'
import { assertSnapshotShape, assertSnapshotSize } from '../../utils/legacy/legacy-snapshot-guard.util'
import type { ILegacyWorkbookSnapshot, ILegacyWorkbookSheetMetadata } from '../../../interfaces/legacy-workbook.interface'

const BATCH_SIZE = 250

const readSnapshot = async (): Promise<ILegacyWorkbookSnapshot> => {
  const snapshotPath = resolve(process.cwd(), 'server/database/seeds/data/ccc-workbook.json')
  assertSnapshotSize((await stat(snapshotPath)).size)
  const serializedSnapshot = await readFile(snapshotPath, 'utf8')
  const snapshot = JSON.parse(serializedSnapshot) as ILegacyWorkbookSnapshot

  assertSnapshotShape(snapshot)

  return snapshot
}

const importWorkbook = async (): Promise<void> => {
  const snapshot = await readSnapshot()
  const sheetMetadata: ILegacyWorkbookSheetMetadata[] = snapshot.sheets.map((sheet) => ({
    name: sheet.name,
    index: sheet.index,
    state: sheet.state,
    rowCount: sheet.rows.length,
    formulaCount: sheet.rows.reduce((total, row) => total + Object.keys(row.formulas ?? {}).length, 0)
  }))
  const workbookRows = snapshot.sheets.flatMap((sheet) => sheet.rows.map((row) => ({
    sourceSha256: snapshot.sourceSha256,
    sheetName: sheet.name,
    rowNumber: row.rowNumber,
    cellValues: row.values,
    formulas: row.formulas ?? {},
    styleIds: row.styleIds ?? {}
  })))

  await dataSource.initialize()
  let persistedRowCount = 0

  try {
    await dataSource.runMigrations()

    const queryRunner = dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      await queryRunner.manager.upsert(LegacyWorkbookImportEntity, {
        sourceSha256: snapshot.sourceSha256,
        sourceFilename: snapshot.sourceFilename,
        sheets: sheetMetadata
      }, ['sourceSha256'])

      for (let start = 0; start < workbookRows.length; start += BATCH_SIZE) {
        await queryRunner.manager.upsert(
          LegacyWorkbookRowEntity,
          workbookRows.slice(start, start + BATCH_SIZE),
          ['sourceSha256', 'sheetName', 'rowNumber']
        )
      }

      persistedRowCount = await queryRunner.manager.count(LegacyWorkbookRowEntity, {
        where: { sourceSha256: snapshot.sourceSha256 }
      })
      if (persistedRowCount !== workbookRows.length) {
        throw new Error(`Import incomplet : ${persistedRowCount} lignes présentes sur ${workbookRows.length}.`)
      }

      await queryRunner.commitTransaction()
    } catch (error) {
      await queryRunner.rollbackTransaction()
      throw error
    } finally {
      await queryRunner.release()
    }
  } finally {
    await dataSource.destroy()
  }

  logger.info(LOG_EVENT.LEGACY_WORKBOOK_IMPORT_COMPLETED, {
    sheetCount: sheetMetadata.length,
    persistedRowCount,
    formulaCount: sheetMetadata.reduce((total, sheet) => total + sheet.formulaCount, 0)
  })
}

void importWorkbook().catch((error: unknown) => {
  logger.error(LOG_EVENT.LEGACY_WORKBOOK_IMPORT_FAILED, {
    message: error instanceof Error ? error.message : 'Unknown error'
  })
  process.exitCode = 1
})
