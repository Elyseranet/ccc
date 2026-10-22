import type { IAdminMatch } from '../../../../../interfaces/admin-match.interface.js'
import { loadAdminMatch, recordScore } from '../../../../../services/match.service.js'
import { readScoreCommand } from '../../../../../utils/match-score-route.util.js'
import { useDataSource } from '../../../../../utils/database.util.js'

/** « Enregistrer » un score sans le rendre opposable : aucun effet public. Réservé à l'administrateur. */
export default defineEventHandler(async (event): Promise<IAdminMatch> => {
  const command = await readScoreCommand(event, { ifMatchRequired: false })
  const dataSource = await useDataSource()
  await recordScore(dataSource, command)
  return loadAdminMatch(dataSource, command.matchId)
})
