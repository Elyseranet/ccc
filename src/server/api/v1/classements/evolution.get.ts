import type { IRankingEvolutionPoint, IRankingEvolutionSeries } from '../../../../interfaces/ranking.interface'
import { RATE_LIMIT_ROUTE_KEY } from '../../../../consts/rate-limit.const'
import { rankingEvolutionQuerySchema } from '../../../../schemas/ranking.schema'
import { getEvolutionForAll, getEvolutionForCompetitor } from '../../../../services/ranking.service'
import { enforceRateLimit } from '../../../../utils/rate-limit.util'
import { getQueryWithSchema } from '../../../../utils/validation.util'

/** Avec `competiteur` : les points d'un joueur ; sans : les séries de tous les joueurs en un appel (C5). */
export default defineEventHandler(async (event): Promise<IRankingEvolutionPoint[] | IRankingEvolutionSeries[]> => {
  enforceRateLimit(event, RATE_LIMIT_ROUTE_KEY.PUBLIC_READ)
  const { type, competiteur } = await getQueryWithSchema(event, rankingEvolutionQuerySchema)
  return competiteur === undefined
    ? getEvolutionForAll(type)
    : getEvolutionForCompetitor(type, competiteur)
})
