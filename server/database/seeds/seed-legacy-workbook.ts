import 'reflect-metadata'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import dataSource from '../data-source.js'
import { LegacyWorkbookImportEntity } from '../entities/legacy-workbook-import.entity.js'
import { LegacyWorkbookRowEntity } from '../entities/legacy-workbook-row.entity.js'
import type { ILegacyWorkbookSnapshot, ILegacyWorkbookSheetMetadata } from '../interfaces/legacy-workbook.interface.js'

const BATCH_SIZE = 250

const readSnapshot = async (): Promise<ILegacyWorkbookSnapshot> => {
  const snapshotPath = resolve(process.cwd(), 'server/database/seeds/data/ccc-workbook.json')
  const serializedSnapshot = await readFile(snapshotPath, 'utf8')
  const snapshot = JSON.parse(serializedSnapshot) as ILegacyWorkbookSnapshot

  if (snapshot.formatVersion !== 1 || !/^[a-f0-9]{64}$/.test(snapshot.sourceSha256) || !Array.isArray(snapshot.sheets)) {
    throw new Error('Le snapshot du classeur historique est invalide.')
  }

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

  console.info(JSON.stringify({
    event: 'legacy_workbook_import_completed',
    sheetCount: sheetMetadata.length,
    persistedRowCount,
    formulaCount: sheetMetadata.reduce((total, sheet) => total + sheet.formulaCount, 0)
  }))
}

void importWorkbook().catch((error: unknown) => {
  console.error(JSON.stringify({
    event: 'legacy_workbook_import_failed',
    message: error instanceof Error ? error.message : 'Unknown error'
  }))
  process.exitCode = 1
})
