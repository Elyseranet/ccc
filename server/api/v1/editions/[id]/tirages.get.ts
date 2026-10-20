import type { IDraw } from '../../../../../shared/interfaces/api/draw.interface'
import { loadValidatedDraws } from '../../../../services/edition.service'
import { readEditionResource } from '../../../../utils/edition/edition-route.util'

/** Uniquement les tirages VALIDATED : un brouillon n'est jamais public. */
export default defineEventHandler((event) =>
  readEditionResource(event, (dataSource, edition): Promise<IDraw[]> => loadValidatedDraws(dataSource, edition.id)))
