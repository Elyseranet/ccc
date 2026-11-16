export interface ILegacyWorkbookRow {
  rowNumber: number
  values: Array<string | number | boolean | null>
  formulas?: Record<string, { expression: string; attributes: Record<string, string> }>
  styleIds?: Record<string, number>
}

export interface ILegacyWorkbookSheetMetadata {
  name: string
  index: number
  state: string
  rowCount: number
  formulaCount: number
}
