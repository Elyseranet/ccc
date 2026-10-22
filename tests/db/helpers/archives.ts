import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { DataSource } from 'typeorm'
import { LEGACY_SHEET_DATA } from '../../../src/consts/legacy-import.const'
import { COMPETITOR_ALIAS_SOURCE } from '../../../src/enums/competitor.enum'
import { EDITION_ORIGIN, type EDITION_STATUS } from '../../../src/enums/edition.enum'
import { MATCH_STATUS, type MATCH_PURPOSE } from '../../../src/enums/match.enum'
import type { FINAL_STAGE } from '../../../src/enums/participation.enum'
import type { IArchivesSeedCounts } from '../../../src/interfaces/archives-seed.interface'
import type { ILegacyVerificationInput } from '../../../src/interfaces/legacy-import.interface'
import type { ILegacyWorkbookRow } from '../../../src/interfaces/legacy-workbook.interface'
import { parseLegacyDataSheet } from '../../../src/utils/legacy-workbook-parser.util'
import { applyArchivesSeed } from '../../../src/utils/seed-archives.util'

const ARCHIVES_SQL = fileURLToPath(new URL('../../../src/assets/seeds/archives.sql', import.meta.url))

/** Applique le dump SQL figé des archives (ARCH-5) exactement comme `db:seed:archives`. */
export const seedArchives = (dataSource: DataSource): Promise<IArchivesSeedCounts> =>
  applyArchivesSeed(dataSource, readFileSync(ARCHIVES_SQL, 'utf8'))

/**
 * Relit la base après application du dump et prépare l'entrée de `verifyAgainstWorkbook` (ARCH-10) : le classement
 * `Data` du classeur (lignes brutes de `legacy_workbook_rows`) d'un côté, les éditions, participations et matchs
 * persistés de l'autre. Même lecture que l'ancien importeur (`verifyPersisted`), sans le fichier de correspondance :
 * les fusions A5 se déduisent des alias en base.
 */
export const loadVerificationInput = async (dataSource: DataSource): Promise<ILegacyVerificationInput> => {
  const dataRows: ILegacyWorkbookRow[] = (await dataSource.query(
    'SELECT row_number, cell_values FROM legacy_workbook_rows WHERE sheet_name = $1 ORDER BY row_number',
    [LEGACY_SHEET_DATA]
  )).map((row: { row_number: number, cell_values: ILegacyWorkbookRow['values'] }) => ({ rowNumber: row.row_number, values: row.cell_values }))
  const { players } = parseLegacyDataSheet(dataRows)

  const editions: Array<{ id: string, chronological_rank: number, status: EDITION_STATUS }> = await dataSource.query(
    'SELECT id, chronological_rank, status FROM editions WHERE origin = $1', [EDITION_ORIGIN.LEGACY_IMPORT]
  )
  const participations: Array<{ id: string, competitor_id: string, edition_id: string, points: string | null, final_stage: FINAL_STAGE | null }> =
    await dataSource.query('SELECT id, competitor_id, edition_id, points, final_stage FROM participations')
  const sides: Array<{ match_id: string, status: MATCH_STATUS, purpose: MATCH_PURPOSE, participation_id: string, validated_score: number | null }> =
    await dataSource.query(
      `SELECT s.match_id, m.status, m.purpose, s.participation_id, s.validated_score
         FROM match_sides s JOIN matches m ON m.id = s.match_id ORDER BY s.match_id, s.position`
    )
  const aliases: Array<{ competitor_id: string, alias: string, source: COMPETITOR_ALIAS_SOURCE }> =
    await dataSource.query('SELECT competitor_id, alias, source FROM competitor_aliases')
  const competitors: Array<{ id: string, display_name: string }> = await dataSource.query('SELECT id, display_name FROM competitors')

  const competitorByParticipation = new Map(participations.map((row) => [row.id, row.competitor_id]))
  const matches = new Map<string, ILegacyVerificationInput['matches'][number]>()
  for (const side of sides) {
    const match = matches.get(side.match_id) ?? { status: side.status, purpose: side.purpose, sides: [] }
    match.sides.push({
      playerId: competitorByParticipation.get(side.participation_id)!,
      score: side.status === MATCH_STATUS.VALIDATED ? (side.validated_score ?? 0) : 0
    })
    matches.set(side.match_id, match)
  }
  const dataNameById = new Map(aliases.filter((row) => row.source === COMPETITOR_ALIAS_SOURCE.LEGACY_DATA).map((row) => [row.competitor_id, row.alias]))
  const mergedPlayerNames = [...new Set(aliases
    .filter((row) => row.source !== COMPETITOR_ALIAS_SOURCE.LEGACY_DATA && dataNameById.has(row.competitor_id))
    .filter((row) => row.alias.toLowerCase() !== dataNameById.get(row.competitor_id)!.toLowerCase())
    .map((row) => dataNameById.get(row.competitor_id)!))]

  return {
    players,
    mergedPlayerNames,
    nameByPlayerId: dataNameById,
    editions: editions.map((row) => ({ id: row.id, chronologicalRank: row.chronological_rank, status: row.status })),
    scored: participations.flatMap((row) => row.points === null ? [] : [{ playerId: row.competitor_id, editionId: row.edition_id, points: Number(row.points) }]),
    staged: participations.flatMap((row) => row.final_stage === null ? [] : [{ playerId: row.competitor_id, editionId: row.edition_id, finalStage: row.final_stage }]),
    matches: [...matches.values()],
    playersOutsideWorkbook: competitors.filter((row) => !dataNameById.has(row.id)).map((row) => row.display_name)
  }
}
