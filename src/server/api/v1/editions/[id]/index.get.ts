import type { IEditionDetail } from '../../../../../interfaces/edition.interface'
import {
  buildBracket,
  buildPools,
  buildRounds,
  toEditionParticipant,
  toPublicMatches
} from '../../../../../utils/edition-assemble.util'
import {
  loadEditionMatches,
  loadEditionSummaries,
  loadParticipations,
  loadPoolEntities,
  loadRoundEntities,
  loadValidatedDraws
} from '../../../../../services/edition.service'
import { readEditionResource } from '../../../../../utils/edition-route.util'

/** Vue complète d'une édition. `comment` d'édition (R-4) et `comment` de match (A13) n'en font jamais partie. */
export default defineEventHandler((event) =>
  readEditionResource(event, async (dataSource, edition): Promise<IEditionDetail> => {
    const [[summary], participations, poolEntities, roundEntities, matches, draws] = await Promise.all([
      loadEditionSummaries(dataSource, [edition]),
      loadParticipations(dataSource, edition.id),
      loadPoolEntities(dataSource, edition.id),
      loadRoundEntities(dataSource, edition.id),
      loadEditionMatches(dataSource, edition.id),
      loadValidatedDraws(dataSource, edition.id)
    ])
    const publicMatches = toPublicMatches(matches)
    return {
      ...summary!,
      description: edition.description,
      participants: participations.map(toEditionParticipant),
      pools: buildPools(poolEntities, participations, matches),
      rounds: buildRounds(roundEntities, matches),
      matches: publicMatches,
      draws,
      bracket: buildBracket(roundEntities, publicMatches)
    }
  }))
