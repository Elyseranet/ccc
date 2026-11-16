import type { DataSource } from 'typeorm'
import { EDITION_STATUS } from '../../../src/enums/edition.enum'
import { MATCH_PURPOSE, MATCH_STATUS } from '../../../src/enums/match.enum'
import type {
  IRankingEdition,
  IScoredParticipation,
} from '../../../src/interfaces/ranking.interface'
import type { IMatchRecord } from '../../../src/interfaces/stats.interface'

type TCell = string | number | null

interface IWorkbookRow {
  rowNumber: number
  values: TCell[]
}

interface IWorkbook {
  sheets: { name: string; rows: IWorkbookRow[] }[]
}

let cache: IWorkbook | null = null

/**
 * Charge les onglets bruts du classeur depuis `legacy_workbook_rows`, tels que le dump SQL des archives les a
 * insérés (ARCH-10). À appeler en `beforeAll`, après `seedArchives` ; les accesseurs ci-dessous restent synchrones.
 */
export async function loadArchivesWorkbook(dataSource: DataSource): Promise<void> {
  const rows: Array<{ sheet_name: string; row_number: number; cell_values: TCell[] }> = await dataSource.query(
    'SELECT sheet_name, row_number, cell_values FROM legacy_workbook_rows ORDER BY sheet_name, row_number',
  )
  const sheets = new Map<string, IWorkbookRow[]>()
  for (const row of rows) {
    if (!sheets.has(row.sheet_name)) sheets.set(row.sheet_name, [])
    sheets.get(row.sheet_name)!.push({ rowNumber: row.row_number, values: row.cell_values })
  }
  cache = { sheets: [...sheets].map(([name, sheetRows]) => ({ name, rows: sheetRows })) }
}

function workbook(): IWorkbook {
  if (!cache) {
    throw new Error('loadArchivesWorkbook() doit être appelé en beforeAll')
  }
  return cache
}

export function sheetRows(name: string): IWorkbookRow[] {
  const sheet = workbook().sheets.find((candidate) => candidate.name === name)
  if (!sheet) {
    throw new Error(`Onglet introuvable : ${name}`)
  }
  return sheet.rows
}

/** Onglet `Data` : colonnes K..Z (index 10..25) = 16 éditions, ligne 2 = effectif N. */
const DATA_FIRST_EDITION_COLUMN = 10
const DATA_EDITION_COUNT = 16
const DATA_HEADER_ROW = 11
const DATA_FIRST_PLAYER_ROW = 12

export interface IWorkbookPlayer {
  name: string
  acp: number
  allTime: number
  /** Points par édition (index = rang chronologique) ; null = pas de points (`/` ou vide). */
  points: (number | null)[]
}

export function dataSheet(): {
  editionLabels: string[]
  participantCounts: number[]
  players: IWorkbookPlayer[]
} {
  const rows = new Map(sheetRows('Data').map((row) => [row.rowNumber, row.values]))
  const slice = (values: TCell[]): TCell[] =>
    values.slice(DATA_FIRST_EDITION_COLUMN, DATA_FIRST_EDITION_COLUMN + DATA_EDITION_COUNT)
  const editionLabels = slice(rows.get(DATA_HEADER_ROW)!).map(String)
  const participantCounts = slice(rows.get(2)!).map(Number)
  const players: IWorkbookPlayer[] = []
  for (const [rowNumber, values] of rows) {
    if (rowNumber >= DATA_FIRST_PLAYER_ROW && typeof values[2] === 'string') {
      players.push({
        name: values[2],
        acp: Number(values[3]),
        allTime: Number(values[9]),
        points: slice(values).map((cell) => (typeof cell === 'number' ? cell : null)),
      })
    }
  }
  return { editionLabels, participantCounts, players }
}

/** Les 16 éditions du classeur, toutes traitées comme clôturées (instantané, 2026 inclus). */
export function workbookEditions(status: EDITION_STATUS = EDITION_STATUS.CLOSED): IRankingEdition[] {
  return dataSheet().editionLabels.map((label, index) => ({
    id: label,
    chronologicalRank: index + 1,
    status,
  }))
}

export function workbookParticipations(): IScoredParticipation[] {
  const { editionLabels, players } = dataSheet()
  return players.flatMap((player) =>
    player.points.flatMap((points, index) =>
      points === null ? [] : [{ playerId: player.name, editionId: editionLabels[index]!, points }],
    ),
  )
}

/**
 * Onglet `scores` : lignes dont les deux adversaires sont nommés mais sans score (175 matchs
 * réels, A16). Dans l'app ce sont des matchs RESULT_UNKNOWN. Le premier adversaire est le
 * vainqueur (RG24) ; les formules V/D et F2F du classeur les comptent, pas B-03 (ticket).
 */
/**
 * COUNTIF du classeur est insensible à la casse : « Vincent K/Vern » (une ligne de `scores`)
 * est compté avec « Vincent K/vern ». On ramène donc les noms à la graphie de l'onglet `Data`.
 */
function canonicalName(name: string): string {
  const known = dataSheet().players.find((player) => player.name.toLowerCase() === name.toLowerCase())
  return known ? known.name : name
}

export function workbookUnknownResultPairs(): [winner: string, loser: string][] {
  return sheetRows('scores').flatMap(({ values }) => {
    const [id, , first, firstScore, second, secondScore] = values
    const named = (cell: TCell): cell is string => typeof cell === 'string' && cell !== '/'
    if (!/^\d{4}[ab]?-\d+$/.test(String(id))) return []
    if (typeof firstScore === 'number' || typeof secondScore === 'number') return []
    return named(first) && named(second)
      ? [[canonicalName(first), canonicalName(second)] as [string, string]]
      : []
  })
}

/**
 * Onglet `scores` : les matchs dont les deux scores sont renseignés (554). L'onglet ne
 * distingue pas le départage : tous les matchs sont REGULAR. Le premier adversaire est le
 * vainqueur (RG24), mais les fonctions de domaine ne s'en servent pas.
 */
export function workbookMatches(): IMatchRecord[] {
  return sheetRows('scores').flatMap(({ values }) => {
    const [, , first, firstScore, second, secondScore] = values
    if (typeof firstScore !== 'number' || typeof secondScore !== 'number') {
      return []
    }
    return [
      {
        status: MATCH_STATUS.VALIDATED,
        purpose: MATCH_PURPOSE.REGULAR,
        sides: [
          { playerId: canonicalName(String(first)), score: firstScore },
          { playerId: canonicalName(String(second)), score: secondScore },
        ],
      },
    ]
  })
}
