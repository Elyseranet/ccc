import type { IEditionSummary } from '../../../../shared/interfaces/api/edition.interface'
import { loadAllEditionSummaries } from '../../../utils/edition/edition-read.util'

/** Les 16 éditions, de la plus récente à la plus ancienne, sans pagination (Spec API). */
export default defineEventHandler(async (): Promise<IEditionSummary[]> =>
  loadAllEditionSummaries(await useDataSource()))
