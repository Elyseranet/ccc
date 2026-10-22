import { getRequestHeader, setResponseHeader } from 'h3'
import type { H3Event } from 'h3'
import { USER_ROLE } from '../enums/user.enum.js'
import { IF_MATCH_HEADER } from '../consts/match-score.const.js'
import type { IScoreCommand } from '../interfaces/match-score.interface.js'
import { matchParamsSchema, scoreSubmissionSchema } from '../server/schemas/match-score.schema.js'
import { requireRole } from './require-role.util.js'
import { badRequest } from './api-error.util.js'
import { getParamsWithSchema, readBodyWithSchema } from './validation.util.js'
import { parseIfMatchVersion } from './match-score.util.js'

/**
 * Squelette commun des écritures de score (administrateur) : rôle (401/403), réponse jamais mise en cache,
 * identifiant de match (400), corps `{ scores }` (400) et `If-Match` (obligatoire pour la correction).
 */
export const readScoreCommand = async (event: H3Event, options: { ifMatchRequired: boolean }): Promise<IScoreCommand> => {
  const user = requireRole(event, USER_ROLE.ADMIN)
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const { id } = await getParamsWithSchema(event, matchParamsSchema)
  const body = await readBodyWithSchema(event, scoreSubmissionSchema)
  const expectedVersion = parseIfMatchVersion(getRequestHeader(event, IF_MATCH_HEADER))
  if (options.ifMatchRequired && expectedVersion === undefined) {
    throw badRequest('If-Match header is required')
  }
  return {
    matchId: id,
    userId: user.id,
    requestId: event.context.requestId,
    scores: body.scores,
    expectedVersion
  }
}
