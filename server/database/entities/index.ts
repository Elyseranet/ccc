import { LegacyWorkbookImportEntity } from './legacy-workbook-import.entity.js'
import { LegacyWorkbookRowEntity } from './legacy-workbook-row.entity.js'

/**
 * Registre explicite des entités, partagé par la CLI TypeORM et le runtime Nitro
 * (le bundle Nitro ne résout pas les globs). Toute nouvelle entité s'ajoute ici.
 */
export const ENTITIES = [
  LegacyWorkbookImportEntity,
  LegacyWorkbookRowEntity
]
