import {
  LEGACY_SNAPSHOT_MAX_BYTES,
  LEGACY_SNAPSHOT_MAX_ROWS_PER_SHEET,
  LEGACY_SNAPSHOT_MAX_SHEETS,
} from '../../../consts/legacy-import.const'
import { LEGACY_IMPORT_ERROR_CODE } from '../../../enums/legacy-import.enum'
import type { ILegacyWorkbookSnapshot } from '../../database/interfaces/legacy-workbook.interface'
import { LegacyImportError } from './legacy-import-error.util'

const refuse = (message: string): never => {
  throw new LegacyImportError(LEGACY_IMPORT_ERROR_CODE.SOURCE_INVALID, message)
}

/** À appeler avec `stat.size`, avant de lire le fichier. */
export function assertSnapshotSize(sizeInBytes: number): void {
  if (sizeInBytes > LEGACY_SNAPSHOT_MAX_BYTES) {
    refuse(`Snapshot trop gros : ${sizeInBytes} octets, plafond LEGACY_SNAPSHOT_MAX_BYTES = ${LEGACY_SNAPSHOT_MAX_BYTES}`)
  }
}

/** À appeler après `JSON.parse`, avant toute écriture en base. */
export function assertSnapshotShape(snapshot: ILegacyWorkbookSnapshot): void {
  if (snapshot.formatVersion !== 1 || !/^[a-f0-9]{64}$/.test(snapshot.sourceSha256) || !Array.isArray(snapshot.sheets)) {
    refuse('Le snapshot du classeur historique est invalide.')
  }
  if (snapshot.sheets.length > LEGACY_SNAPSHOT_MAX_SHEETS) {
    refuse(`Trop de feuilles : ${snapshot.sheets.length}, plafond LEGACY_SNAPSHOT_MAX_SHEETS = ${LEGACY_SNAPSHOT_MAX_SHEETS}`)
  }
  for (const sheet of snapshot.sheets) {
    if (!Array.isArray(sheet.rows)) {
      refuse(`Feuille sans lignes : ${String(sheet.name)}`)
    }
    if (sheet.rows.length > LEGACY_SNAPSHOT_MAX_ROWS_PER_SHEET) {
      refuse(
        `Trop de lignes dans la feuille « ${sheet.name} » : ${sheet.rows.length}, plafond LEGACY_SNAPSHOT_MAX_ROWS_PER_SHEET = ${LEGACY_SNAPSHOT_MAX_ROWS_PER_SHEET}`,
      )
    }
  }
}
