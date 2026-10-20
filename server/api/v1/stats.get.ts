import type { IArchiveStats } from '../../../shared/interfaces/api/stats.interface'
import { loadArchiveStats } from '../../services/edition.service'

export default defineEventHandler(async (): Promise<IArchiveStats> =>
  loadArchiveStats(await useDataSource()))
