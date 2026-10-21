import type { IRound } from '../../../../../shared/interfaces/api/round.interface'
import { buildRounds } from '../../../../utils/edition/edition-assemble.util'
import { loadEditionMatches, loadRoundEntities } from '../../../../services/edition.service'
import { readEditionResource } from '../../../../utils/edition/edition-route.util'

export default defineEventHandler((event) =>
  readEditionResource(event, async (dataSource, edition): Promise<IRound[]> => {
    const [rounds, matches] = await Promise.all([
      loadRoundEntities(dataSource, edition.id),
      loadEditionMatches(dataSource, edition.id)
    ])
    return buildRounds(rounds, matches)
  }))
