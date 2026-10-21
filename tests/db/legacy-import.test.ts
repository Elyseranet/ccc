import 'reflect-metadata'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { DataSource } from 'typeorm'
import { EDITION_ORIGIN, EDITION_STATUS } from '../../shared/enums/edition.enum'
import { LEGACY_IMPORT_ERROR_CODE, LEGACY_VERIFICATION_METRIC } from '../../server/enums/legacy-import.enum'
import type { ILegacyWorkbookSnapshot } from '../../server/database/interfaces/legacy-workbook.interface'
import type { TLegacyIdentityMapEntry } from '../../server/types/legacy-import.type'
import { LegacyImportError } from '../../server/utils/legacy/legacy-import-error.util'
import { EditionEntity } from '../../server/database/entities/edition.entity'
import { LegacyWorkbookImportEntity } from '../../server/database/entities/legacy-workbook-import.entity'
import { LegacyWorkbookRowEntity } from '../../server/database/entities/legacy-workbook-row.entity'
import { importLegacyDomain } from '../../server/database/seeds/legacy-domain-importer'
import { cleanup, resetSchema } from './helpers/test-database'

const SNAPSHOT_PATH = fileURLToPath(new URL('../../server/database/seeds/data/ccc-workbook.json', import.meta.url))
const IDENTITY_MAP_PATH = fileURLToPath(new URL('../../server/database/seeds/data/legacy-identity-map.json', import.meta.url))
const DOMAIN_TABLES = [
  'draw_assignments', 'draws', 'match_sides', 'matches', 'participations', 'rounds', 'pools',
  'competitor_aliases', 'competitors', 'editions'
]
const CHUNK = 250
const ACP_WINDOW_EDITIONS = 5

let dataSource: DataSource
const snapshot = JSON.parse(readFileSync(SNAPSHOT_PATH, 'utf8')) as ILegacyWorkbookSnapshot
const identityMap = (): TLegacyIdentityMapEntry[] =>
  JSON.parse(readFileSync(IDENTITY_MAP_PATH, 'utf8')) as TLegacyIdentityMapEntry[]

/** Charge l'archive comme le fait `db:seed:legacy`, avec une retouche optionnelle des lignes. */
const loadArchive = async (tamper?: (sheet: string, rowNumber: number, values: Array<string | number | boolean | null>) => void) => {
  await dataSource.getRepository(LegacyWorkbookImportEntity).save({
    sourceSha256: snapshot.sourceSha256,
    sourceFilename: snapshot.sourceFilename,
    sheets: []
  })
  const rows = snapshot.sheets.flatMap((sheet) => sheet.rows.map((row) => {
    const values = [...row.values]
    tamper?.(sheet.name, row.rowNumber, values)
    return {
      sourceSha256: snapshot.sourceSha256,
      sheetName: sheet.name,
      rowNumber: row.rowNumber,
      cellValues: values,
      formulas: {},
      styleIds: {}
    }
  }))
  for (let start = 0; start < rows.length; start += CHUNK) {
    await dataSource.getRepository(LegacyWorkbookRowEntity).insert(rows.slice(start, start + CHUNK))
  }
}

const count = async (table: string): Promise<number> =>
  Number((await dataSource.query(`SELECT count(*) AS n FROM ${table}`))[0].n)

const ids = async (table: string): Promise<string[]> =>
  (await dataSource.query(`SELECT id FROM ${table} ORDER BY id`)).map((row: { id: string }) => row.id)

beforeAll(async () => {
  dataSource = await resetSchema()
})

beforeEach(async () => {
  await dataSource.query(`TRUNCATE TABLE ${[...DOMAIN_TABLES, 'legacy_workbook_rows', 'legacy_workbook_imports'].join(', ')} CASCADE`)
})

afterAll(async () => {
  await cleanup()
})

describe('reprise legacy : classements identiques au classeur', () => {
  it('importe 16 éditions, 146 compétiteurs, 729 matchs (554 VALIDATED, 175 RESULT_UNKNOWN)', async () => {
    await loadArchive()
    const { report, committed } = await importLegacyDomain(dataSource, identityMap())

    expect(committed).toBe(true)
    expect(report.counts.editions).toMatchObject({ read: 16, created: 16 })
    expect(report.counts.competitors).toMatchObject({ read: 146, created: 146 })
    expect(report.counts.competitor_aliases).toMatchObject({ read: 158, created: 158 })
    expect(report.counts.matches).toMatchObject({ read: 729, created: 729, ignored: 685 })
    expect(report.matchStatusCounts).toEqual({ VALIDATED: 554, RESULT_UNKNOWN: 175 })
    expect(await count('participations WHERE status = \'REGISTERED\'')).toBe(0)
    expect(await count('matches')).toBe(729)
    expect(await count('match_sides')).toBe(1458)
    expect(await count('matches WHERE status = \'VALIDATED\'')).toBe(554)
    expect(await count('matches WHERE status = \'RESULT_UNKNOWN\'')).toBe(175)
    expect(await count('editions WHERE status = \'CLOSED\' AND origin = \'LEGACY_IMPORT\'')).toBe(16)
  })

  it('All Time, ACP, rangs, participations et titres recalculés par B-03 égalent le classeur pour les 145 joueurs', async () => {
    await loadArchive()
    const { report } = await importLegacyDomain(dataSource, identityMap())
    const metric = (kind: LEGACY_VERIFICATION_METRIC) => report.verification!.metrics.find((entry) => entry.metric === kind)!

    for (const kind of [
      LEGACY_VERIFICATION_METRIC.ALL_TIME,
      LEGACY_VERIFICATION_METRIC.ACP,
      LEGACY_VERIFICATION_METRIC.ACP_RANK,
      LEGACY_VERIFICATION_METRIC.PARTICIPATIONS,
      LEGACY_VERIFICATION_METRIC.TITLES
    ]) {
      expect(metric(kind)).toMatchObject({ compared: 145, mismatches: [] })
    }
    // Seul écart de rang : égalité exacte à 8,76 que le RANK flottant du classeur départage.
    expect(metric(LEGACY_VERIFICATION_METRIC.ALL_TIME_RANK).mismatches.map((entry) => entry.player)).toEqual(['Damien Brien'])
    // V/D : écarts attendus pour les seuls compétiteurs fusionnés, jamais d'écart inattendu.
    const winLoss = metric(LEGACY_VERIFICATION_METRIC.WIN_LOSS).mismatches
    expect(winLoss.length).toBeGreaterThan(0)
    expect(winLoss.every((entry) => entry.expected)).toBe(true)
    expect(report.verification!.blockingMismatches).toBe(0)
    expect(report.verification!.playersOutsideWorkbook).toEqual(['Marion Cobra'])
  })

  it('les sommes SQL (sans B-03) retombent sur les colonnes J et D du classeur', async () => {
    await loadArchive()
    await importLegacyDomain(dataSource, identityMap())
    const data = snapshot.sheets.find((sheet) => sheet.name === 'Data')!.rows.filter((row) => row.rowNumber >= 12)
    const sql: Array<{ alias: string; all_time: string; acp: string }> = await dataSource.query(
      `SELECT a.alias,
              COALESCE(SUM(p.points), 0)::text AS all_time,
              COALESCE(SUM(p.points) FILTER (WHERE e.chronological_rank > 16 - ${ACP_WINDOW_EDITIONS}), 0)::text AS acp
         FROM competitor_aliases a
         JOIN participations p ON p.competitor_id = a.competitor_id
         JOIN editions e ON e.id = p.edition_id
        WHERE a.source = 'LEGACY_DATA'
        GROUP BY a.alias`
    )
    const byAlias = new Map(sql.map((row) => [row.alias, row]))
    expect(data).toHaveLength(145)
    for (const row of data) {
      const found = byAlias.get(String(row.values[2]))!
      expect(Math.round(Number(found.all_time) * 100)).toBe(Math.round(Number(row.values[9]) * 100))
      expect(Math.round(Number(found.acp) * 100)).toBe(Math.round(Number(row.values[3]) * 100))
    }
  })

  it('2012a et 2012b : N = 16, 11 participations, écart de 5 au rapport (A6)', async () => {
    await loadArchive()
    const { report } = await importLegacyDomain(dataSource, identityMap())
    for (const code of ['2012a', '2012b']) {
      const rows = await dataSource.query(
        `SELECT e.participant_count, count(p.id)::int AS n FROM editions e JOIN participations p ON p.edition_id = e.id WHERE e.code = $1 GROUP BY e.participant_count`,
        [code]
      )
      expect(rows).toEqual([{ participant_count: 16, n: 11 }])
      expect(report.anomalies.find((entry) => entry.editionCode === code && entry.values.unidentified === 5)).toBeDefined()
    }
  })

  it('2017 : Simon Legoupil et Alan Denoyelle gardent 5,76 (A7)', async () => {
    await loadArchive()
    const { report } = await importLegacyDomain(dataSource, identityMap())
    const rows = await dataSource.query(
      `SELECT c.display_name, p.points::text AS points FROM participations p
         JOIN competitors c ON c.id = p.competitor_id JOIN editions e ON e.id = p.edition_id
        WHERE e.code = '2017' AND c.display_name IN ('Simon Legoupil', 'Alan Denoyelle') ORDER BY 1`
    )
    expect(rows).toEqual([
      { display_name: 'Alan Denoyelle', points: '5.76' },
      { display_name: 'Simon Legoupil', points: '5.76' }
    ])
    expect(report.anomalies.filter((entry) => entry.values.points === 5.76)).toHaveLength(2)
  })

  it('Vincent K/Vern et Vincent K/vern sont deux alias exacts du même compétiteur', async () => {
    await loadArchive()
    await importLegacyDomain(dataSource, identityMap())
    const rows = await dataSource.query(
      `SELECT a.alias, a.source, c.display_name FROM competitor_aliases a JOIN competitors c ON c.id = a.competitor_id
        WHERE a.alias IN ('Vincent K/Vern', 'Vincent K/vern') ORDER BY a.alias`
    )
    expect(rows).toEqual([
      { alias: 'Vincent K/Vern', source: 'LEGACY_SCORES', display_name: 'Vincent K/vern' },
      { alias: 'Vincent K/vern', source: 'LEGACY_DATA', display_name: 'Vincent K/vern' }
    ])
    const distinct = await dataSource.query(
      `SELECT count(DISTINCT competitor_id)::int AS n FROM competitor_aliases WHERE alias IN ('Vincent K/Vern', 'Vincent K/vern')`
    )
    expect(distinct[0].n).toBe(1)
  })

  it('reprend les commentaires de match et d édition tels quels, sans créer d email ni de téléphone', async () => {
    await loadArchive()
    await importLegacyDomain(dataSource, identityMap())
    expect(await count('matches WHERE comment IS NOT NULL')).toBe(49)
    expect(await count('editions WHERE comment IS NOT NULL')).toBe(5)
    expect(await count('competitors WHERE phone IS NOT NULL OR first_name IS NOT NULL OR last_name IS NOT NULL OR nickname IS NOT NULL')).toBe(0)
    expect(await count('editions WHERE name IS NOT NULL OR held_on IS NOT NULL OR location IS NOT NULL OR description IS NOT NULL')).toBe(0)
    const email = await dataSource.query(`SELECT 1 FROM information_schema.columns WHERE table_name = 'competitors' AND column_name = 'email'`)
    expect(email).toHaveLength(0)
  })
})

describe('reprise legacy : rejouable et sûre', () => {
  it('deux exécutions successives laissent la base identique, mêmes comptes et mêmes id', async () => {
    await loadArchive()
    await importLegacyDomain(dataSource, identityMap())
    const tables = ['editions', 'competitors', 'competitor_aliases', 'pools', 'rounds', 'participations', 'matches', 'match_sides']
    const before = Object.fromEntries(await Promise.all(tables.map(async (table) => [table, await ids(table)])))
    const dump = await dataSource.query(`SELECT * FROM participations ORDER BY id`)

    const second = await importLegacyDomain(dataSource, identityMap())
    const after = Object.fromEntries(await Promise.all(tables.map(async (table) => [table, await ids(table)])))

    expect(after).toEqual(before)
    expect(await dataSource.query(`SELECT * FROM participations ORDER BY id`)).toEqual(dump)
    for (const counts of Object.values(second.report.counts)) {
      expect(counts.created).toBe(0)
      expect(counts.updated).toBe(0)
    }
  })

  it('échoue sans rien écrire si une graphie n a pas de correspondance exacte', async () => {
    await loadArchive()
    const missing = identityMap().filter((entry) => entry.alias !== 'Vincent K/Vern')
    const failure = await importLegacyDomain(dataSource, missing).catch((error: unknown) => error)

    expect(failure).toBeInstanceOf(LegacyImportError)
    expect((failure as LegacyImportError).code).toBe(LEGACY_IMPORT_ERROR_CODE.UNRESOLVED_ALIAS)
    for (const table of DOMAIN_TABLES) {
      expect(await count(table)).toBe(0)
    }
  })

  it('échoue sans rien écrire si le fichier de correspondance a une clé inattendue', async () => {
    await loadArchive()
    const tampered = [...identityMap(), { alias: 'Zed', create: true, extra: 1 }] as never
    const failure = await importLegacyDomain(dataSource, tampered).catch((error: unknown) => error)

    expect((failure as LegacyImportError).code).toBe(LEGACY_IMPORT_ERROR_CODE.IDENTITY_MAP_INVALID)
    for (const table of DOMAIN_TABLES) {
      expect(await count(table)).toBe(0)
    }
  })

  it('annule la transaction, rapport à l appui, si les classements diffèrent du classeur', async () => {
    // Une cellule Data modifiée sans que la colonne J suive : le classeur et la base divergent.
    await loadArchive((sheet, rowNumber, values) => {
      if (sheet === 'Data' && rowNumber === 12) {
        values[10 + 3] = 99
      }
    })
    const { report, committed } = await importLegacyDomain(dataSource, identityMap())

    expect(committed).toBe(false)
    expect(report.verification!.blockingMismatches).toBeGreaterThan(0)
    for (const table of DOMAIN_TABLES) {
      expect(await count(table)).toBe(0)
    }
  })

  it('refuse d écraser une édition de l application et laisse ses données intactes', async () => {
    await loadArchive()
    await dataSource.getRepository(EditionEntity).save({
      code: '2013', year: 2013, chronologicalRank: 99, origin: EDITION_ORIGIN.APP, status: EDITION_STATUS.CREATED
    })
    const failure = await importLegacyDomain(dataSource, identityMap()).catch((error: unknown) => error)

    expect((failure as LegacyImportError).code).toBe(LEGACY_IMPORT_ERROR_CODE.TARGET_CONFLICT)
    expect(await count('editions')).toBe(1)
    expect(await count('participations')).toBe(0)
  })

  it('ne touche pas une édition APP qui coexiste avec la reprise', async () => {
    await loadArchive()
    await dataSource.getRepository(EditionEntity).save({
      code: '2027', year: 2027, chronologicalRank: 99, origin: EDITION_ORIGIN.APP, status: EDITION_STATUS.CREATED
    })
    const { committed } = await importLegacyDomain(dataSource, identityMap())

    expect(committed).toBe(true)
    const app = await dataSource.query(`SELECT code, status, participant_count FROM editions WHERE origin = 'APP'`)
    expect(app).toEqual([{ code: '2027', status: 'CREATED', participant_count: null }])
  })
})
