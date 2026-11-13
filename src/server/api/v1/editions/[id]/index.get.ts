import type { IEditionDetail } from '../../../../../interfaces/edition.interface'
import { loadEditionDetail } from '../../../../../services/edition.service'
import { readEditionResource } from '../../../../../utils/edition-route.util'

/** Vue complète d'une édition. `comment` d'édition (R-4) et `comment` de match (A13) n'en font jamais partie. */
export default defineEventHandler((event) =>
  readEditionResource(event, (dataSource, edition): Promise<IEditionDetail> => loadEditionDetail(dataSource, edition)))
