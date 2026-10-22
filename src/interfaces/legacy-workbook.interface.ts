export interface ILegacyWorkbookRow {
  rowNumber: number
  values: Array<string | number | boolean | null>
  formulas?: Record<string, { expression: string; attributes: Record<string, string> }>
  styleIds?: Record<string, number>
}

export interface ILegacyWorkbookSheet {
  name: string
  index: number
  state: string
  rows: ILegacyWorkbookRow[]
}

export interface ILegacyWorkbookSnapshot {
  formatVersion: number
  sourceFilename: string
  sourceSha256: string
  sheets: ILegacyWorkbookSheet[]
}

export interface ILegacyWorkbookSheetMetadata {
  name: string
  index: number
  state: string
  rowCount: number
  formulaCount: number
}
