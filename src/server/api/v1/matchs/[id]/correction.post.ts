import type { IMatchValidationResult } from '../../../../../interfaces/score.interface.js'
import { correctMatch, loadValidationResult } from '../../../../../services/match.service.js'
import { readScoreCommand } from '../../../../../utils/match-score-route.util.js'
import { useDataSource } from '../../../../../utils/database.util.js'

/** A15 : corrige un score validé (`If-Match` obligatoire), journalisé ; 409 si un tour suivant est engagé. Administrateur. */
export default defineEventHandler(async (event): Promise<IMatchValidationResult> => {
  const command = await readScoreCommand(event, { ifMatchRequired: true })
  const dataSource = await useDataSource()
  await correctMatch(dataSource, command)
  return loadValidationResult(dataSource, command.matchId)
})
