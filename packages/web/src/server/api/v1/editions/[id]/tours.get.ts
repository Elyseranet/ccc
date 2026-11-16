import type { IRound } from '../../../../../interfaces/round.interface'
import { buildRounds } from '../../../../../utils/edition-assemble.util'
import { loadEditionMatches, loadRoundEntities } from '../../../../../services/edition.service'
import { readEditionResource } from '../../../../../utils/edition-route.util'

export default defineEventHandler((event) =>
  readEditionResource(event, async (dataSource, edition): Promise<IRound[]> => {
    const [rounds, matches] = await Promise.all([
      loadRoundEntities(dataSource, edition.id),
      loadEditionMatches(dataSource, edition.id)
    ])
    return buildRounds(rounds, matches)
  }))
