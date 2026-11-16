import { getQuery, setResponseHeader } from 'h3'
import { USER_ROLE } from '../../../../../../enums/user.enum.js'
import type { IAdminMatch } from '../../../../../../interfaces/admin-match.interface.js'
import { parseAdminMatchListQuery } from '../../../../../../utils/match-score.util.js'
import { findEditionOrThrow } from '../../../../../../services/edition.service.js'
import { loadAdminMatches } from '../../../../../../services/match.service.js'
import { requireRole } from '../../../../../../utils/require-role.util.js'
import { editionParamsSchema } from '../../../../../schemas/edition.schema.js'
import { getParamsWithSchema } from '../../../../../../utils/validation.util.js'
import { useDataSource } from '../../../../../../utils/database.util.js'

/** C6 : vue admin des matchs d'une édition, avec le score saisi (`recordedScore`) et le commentaire (A13). */
export default defineEventHandler(async (event): Promise<IAdminMatch[]> => {
  requireRole(event, USER_ROLE.ADMIN)
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const { id } = await getParamsWithSchema(event, editionParamsSchema)
  const query = parseAdminMatchListQuery(getQuery(event))
  const dataSource = await useDataSource()
  const edition = await findEditionOrThrow(dataSource, id)
  return loadAdminMatches(dataSource, edition.id, query)
})
