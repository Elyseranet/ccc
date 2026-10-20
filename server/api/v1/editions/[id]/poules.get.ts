import type { IPool } from '../../../../../shared/interfaces/api/pool.interface'
import { buildPools } from '../../../../utils/edition/edition-assemble.util'
import { loadEditionMatches, loadParticipations, loadPoolEntities } from '../../../../services/edition.service'
import { readEditionResource } from '../../../../utils/edition/edition-route.util'

/** Poules et classements (RG19, A10), sur les seuls matchs validés. */
export default defineEventHandler((event) =>
  readEditionResource(event, async (dataSource, edition): Promise<IPool[]> => {
    const [pools, participations, matches] = await Promise.all([
      loadPoolEntities(dataSource, edition.id),
      loadParticipations(dataSource, edition.id),
      loadEditionMatches(dataSource, edition.id)
    ])
    return buildPools(pools, participations, matches)
  }))
