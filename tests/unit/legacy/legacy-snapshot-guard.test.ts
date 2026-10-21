import { describe, expect, it } from 'vitest'
import {
  LEGACY_SNAPSHOT_MAX_BYTES,
  LEGACY_SNAPSHOT_MAX_ROWS_PER_SHEET,
  LEGACY_SNAPSHOT_MAX_SHEETS,
} from '../../../server/consts/legacy-import.const'
import { LEGACY_IMPORT_ERROR_CODE } from '../../../server/enums/legacy-import.enum'
import type { ILegacyWorkbookSnapshot } from '../../../server/database/interfaces/legacy-workbook.interface'
import { LegacyImportError } from '../../../server/utils/legacy/legacy-import-error.util'
import { assertSnapshotShape, assertSnapshotSize } from '../../../server/utils/legacy/legacy-snapshot-guard.util'

const sheet = (rowCount: number, name = 'S') => ({
  name,
  index: 0,
  state: 'visible',
  rows: Array.from({ length: rowCount }, (_, i) => ({ rowNumber: i + 1, values: [] })),
})
const snapshot = (sheets: ILegacyWorkbookSnapshot['sheets']): ILegacyWorkbookSnapshot => ({
  formatVersion: 1,
  sourceFilename: 'x.xlsx',
  sourceSha256: 'a'.repeat(64),
  sheets,
})

const refusal = (action: () => void): LegacyImportError => {
  try {
    action()
  } catch (error) {
    if (error instanceof LegacyImportError) return error
    throw error
  }
  throw new Error('Aucune erreur levée')
}

describe('garde du snapshot du classeur', () => {
  it('accepte le plafond exact et le snapshot réel (3 Mo, 15 feuilles, 1 431 lignes)', () => {
    expect(() => assertSnapshotSize(LEGACY_SNAPSHOT_MAX_BYTES)).not.toThrow()
    expect(() => assertSnapshotSize(3_036_032)).not.toThrow()
    expect(() => assertSnapshotShape(snapshot([sheet(1431)]))).not.toThrow()
  })

  it('refuse un fichier trop gros en nommant le plafond', () => {
    const error = refusal(() => assertSnapshotSize(LEGACY_SNAPSHOT_MAX_BYTES + 1))
    expect(error.code).toBe(LEGACY_IMPORT_ERROR_CODE.SOURCE_INVALID)
    expect(error.message).toContain('LEGACY_SNAPSHOT_MAX_BYTES')
  })

  it('refuse trop de feuilles en nommant le plafond', () => {
    const sheets = Array.from({ length: LEGACY_SNAPSHOT_MAX_SHEETS + 1 }, (_, i) => sheet(1, `S${i}`))
    expect(refusal(() => assertSnapshotShape(snapshot(sheets))).message).toContain('LEGACY_SNAPSHOT_MAX_SHEETS')
  })

  it('refuse trop de lignes dans une feuille en nommant le plafond', () => {
    const error = refusal(() => assertSnapshotShape(snapshot([sheet(LEGACY_SNAPSHOT_MAX_ROWS_PER_SHEET + 1, 'scores')])))
    expect(error.message).toContain('LEGACY_SNAPSHOT_MAX_ROWS_PER_SHEET')
    expect(error.message).toContain('scores')
  })

  it('refuse un snapshot de format invalide', () => {
    expect(refusal(() => assertSnapshotShape({ ...snapshot([]), formatVersion: 2 })).code).toBe(
      LEGACY_IMPORT_ERROR_CODE.SOURCE_INVALID,
    )
  })
})
