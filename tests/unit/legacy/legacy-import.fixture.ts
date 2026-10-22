import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { sheetRows } from '../domain/workbook.fixture'
import type { ILegacyWorkbookRow } from '../../../src/server/database/interfaces/legacy-workbook.interface'
import type { ILegacyDomainPlan } from '../../../src/interfaces/legacy-import.interface'
import type { TLegacyIdentityMapEntry } from '../../../src/types/legacy-import.type'
import { parseLegacyWorkbook } from '../../../src/server/utils/legacy/legacy-workbook-parser.util'

const IDENTITY_MAP_PATH = fileURLToPath(
  new URL('../../../server/database/seeds/data/legacy-identity-map.json', import.meta.url),
)

export const identityMap = (): TLegacyIdentityMapEntry[] =>
  JSON.parse(readFileSync(IDENTITY_MAP_PATH, 'utf8')) as TLegacyIdentityMapEntry[]

export const dataRows = (): ILegacyWorkbookRow[] => sheetRows('Data') as ILegacyWorkbookRow[]
export const scoresRows = (): ILegacyWorkbookRow[] => sheetRows('scores') as ILegacyWorkbookRow[]

export const buildPlan = (map: TLegacyIdentityMapEntry[] = identityMap()): ILegacyDomainPlan =>
  parseLegacyWorkbook({ dataRows: dataRows(), scoresRows: scoresRows(), identityMap: map })
