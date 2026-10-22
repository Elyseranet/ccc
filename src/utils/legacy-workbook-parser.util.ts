import { LEGACY_DATA_COLUMN, LEGACY_DATA_ROW, LEGACY_WIN_LOSS_PATTERN } from '../consts/legacy-import.const.js'
import { LEGACY_IMPORT_ERROR_CODE } from '../enums/legacy-import.enum.js'
import type { ILegacyWorkbookRow } from '../interfaces/legacy-workbook.interface.js'
import type { ILegacyDataSheet, ILegacyEditionPlan, ILegacyWorkbookPlayer } from '../interfaces/legacy-import.interface.js'
import type { TLegacyCell } from '../types/legacy-import.type.js'
import { LegacyImportError } from './legacy-import-error.util.js'

const fail = (code: LEGACY_IMPORT_ERROR_CODE, message: string, details: string[] = []): never => {
  throw new LegacyImportError(code, message, details)
}

const asText = (cell: TLegacyCell): string | null => (typeof cell === 'string' ? cell : null)
const asNumber = (cell: TLegacyCell): number | null => (typeof cell === 'number' ? cell : null)

function parseEditions(dataRows: ReadonlyMap<number, readonly TLegacyCell[]>): ILegacyEditionPlan[] {
  const codes = dataRows.get(LEGACY_DATA_ROW.EDITION_CODES)
  const counts = dataRows.get(LEGACY_DATA_ROW.PARTICIPANT_COUNTS)
  if (!codes || !counts) {
    fail(LEGACY_IMPORT_ERROR_CODE.SOURCE_INVALID, 'Lignes d\'en-tête de Data introuvables')
  }
  const editions: ILegacyEditionPlan[] = []
  for (let column = LEGACY_DATA_COLUMN.FIRST_EDITION; column < codes!.length; column += 1) {
    const rawCode = codes![column]
    if (rawCode === null || rawCode === undefined || rawCode === '') {
      break
    }
    const code = String(rawCode)
    const participantCount = asNumber(counts![column])
    if (!/^\d{4}[ab]?$/.test(code) || participantCount === null || !Number.isInteger(participantCount) || participantCount <= 0) {
      fail(LEGACY_IMPORT_ERROR_CODE.SOURCE_INVALID, `Édition illisible en colonne ${column + 1} de Data`, [
        `code=${code}`,
        `N=${String(counts![column])}`,
      ])
    }
    editions.push({
      code,
      year: Number.parseInt(code, 10),
      chronologicalRank: editions.length + 1,
      participantCount: participantCount!,
      comment: null,
    })
  }
  if (editions.length === 0) {
    fail(LEGACY_IMPORT_ERROR_CODE.SOURCE_INVALID, 'Aucune édition dans Data')
  }
  return editions
}

function parsePlayers(
  dataRows: ReadonlyMap<number, readonly TLegacyCell[]>,
  editions: readonly ILegacyEditionPlan[],
): { players: ILegacyWorkbookPlayer[]; points: Map<string, Array<number | null>> } {
  const players: ILegacyWorkbookPlayer[] = []
  const points = new Map<string, Array<number | null>>()
  const rowNumbers = [...dataRows.keys()].filter((row) => row >= LEGACY_DATA_ROW.FIRST_PLAYER).sort((a, b) => a - b)
  for (const rowNumber of rowNumbers) {
    const values = dataRows.get(rowNumber)!
    const name = asText(values[LEGACY_DATA_COLUMN.NAME])
    if (name === null || name.trim() === '') {
      continue
    }
    if (points.has(name)) {
      fail(LEGACY_IMPORT_ERROR_CODE.SOURCE_INVALID, `Nom en double dans Data : « ${name} »`)
    }
    const winLoss = LEGACY_WIN_LOSS_PATTERN.exec(String(values[LEGACY_DATA_COLUMN.WIN_LOSS] ?? ''))
    const editionPoints = editions.map((_, index) => asNumber(values[LEGACY_DATA_COLUMN.FIRST_EDITION + index]))
    points.set(name, editionPoints)
    players.push({
      name,
      rowNumber,
      acp: Number(values[LEGACY_DATA_COLUMN.ACP]),
      allTime: Number(values[LEGACY_DATA_COLUMN.ALL_TIME]),
      acpRank: Number(values[LEGACY_DATA_COLUMN.ACP_RANK]),
      allTimeRank: Number(values[LEGACY_DATA_COLUMN.ALL_TIME_RANK]),
      participations: Number(values[LEGACY_DATA_COLUMN.PARTICIPATIONS]),
      titles: String(values[LEGACY_DATA_COLUMN.TITLES] ?? '').length,
      wins: winLoss ? Number(winLoss[1]) : Number.NaN,
      losses: winLoss ? Number(winLoss[2]) : Number.NaN,
    })
  }
  return { players, points }
}

/**
 * Lit l'onglet `Data` du classeur (lignes brutes de `legacy_workbook_rows`) : éditions et classement de chaque
 * joueur tel que le classeur le calcule. Sert à prouver que les classements recalculés depuis la base égalent le
 * classeur (ARCH-10).
 */
export function parseLegacyDataSheet(rows: readonly ILegacyWorkbookRow[]): ILegacyDataSheet {
  const dataRows = new Map(rows.map((row) => [row.rowNumber, row.values as readonly TLegacyCell[]]))
  const editions = parseEditions(dataRows)
  const { players } = parsePlayers(dataRows, editions)
  return { editions, players }
}
