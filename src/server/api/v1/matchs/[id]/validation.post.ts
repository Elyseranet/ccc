import type { IMatchValidationResult } from '../../../../../interfaces/score.interface.js'
import { LOG_EVENT } from '../../../../../consts/log-event.const.js'
import { loadValidationResult, validateMatch } from '../../../../../services/match.service.js'
import { logger } from '../../../../../utils/logger.util.js'
import { readScoreCommand } from '../../../../../utils/match-score-route.util.js'
import { useDataSource } from '../../../../../utils/database.util.js'

/**
 * « Valider » : idempotent (un rejeu aux mêmes scores renvoie 200 sans effet). La réponse porte l'état recalculé.
 * Réservé à l'administrateur.
 */
export default defineEventHandler(async (event): Promise<IMatchValidationResult> => {
  const startedAt = Date.now()
  const command = await readScoreCommand(event, { ifMatchRequired: false })
  const dataSource = await useDataSource()
  const outcome = await validateMatch(dataSource, command)
  const result = await loadValidationResult(dataSource, command.matchId)
  logger.info(LOG_EVENT.MATCH_VALIDATED, {
    requestId: command.requestId,
    matchId: outcome.matchId,
    editionId: outcome.editionId,
    userId: command.userId,
    durationMs: Date.now() - startedAt,
    replayed: outcome.replayed
  })
  return result
})
