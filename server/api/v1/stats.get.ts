import type { IArchiveStats } from '../../../shared/interfaces/api/stats.interface'
import { loadArchiveStats } from '../../utils/edition/edition-read.util'

export default defineEventHandler(async (): Promise<IArchiveStats> =>
  loadArchiveStats(await useDataSource()))
