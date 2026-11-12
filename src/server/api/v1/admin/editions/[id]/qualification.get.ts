import { getQuery, setResponseHeader } from 'h3'
import { USER_ROLE } from '../../../../../../enums/user.enum.js'
import type { IQualificationStatus } from '../../../../../../interfaces/qualification.interface.js'
import { loadQualificationStatus } from '../../../../../../services/qualification.service.js'
import { useDataSource } from '../../../../../../utils/database.util.js'
import { requireRole } from '../../../../../../utils/require-role.util.js'
import { getParamsWithSchema, parseWithSchema } from '../../../../../../utils/validation.util.js'
import { editionParamsSchema } from '../../../../../schemas/edition.schema.js'
import { qualificationQuerySchema } from '../../../../../schemas/qualification.schema.js'

/**
 * GET /api/v1/admin/editions/{id}/qualification (administrateur) : l'état de la qualification, sans rien écrire. La
 * simulation `?topPerPool=&bestNextCount=` ne sert que tant que la liste n'est pas figée.
 */
export default defineEventHandler(async (event): Promise<IQualificationStatus> => {
  requireRole(event, USER_ROLE.ADMIN)
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const { id } = await getParamsWithSchema(event, editionParamsSchema)
  const query = parseWithSchema(qualificationQuerySchema, getQuery(event))
  const simulation = query.topPerPool !== undefined && query.bestNextCount !== undefined
    ? { topPerPool: query.topPerPool, bestNextCount: query.bestNextCount }
    : null
  return loadQualificationStatus(await useDataSource(), id, simulation)
})
