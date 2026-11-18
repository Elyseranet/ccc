import { setResponseHeaders } from 'h3'
import { buildEditionExportFilename, EDITION_EXPORT_CONTENT_TYPE } from '../../../../../../consts/edition-export.const.js'
import { USER_ROLE } from '../../../../../../enums/user.enum.js'
import { loadAdminDraws } from '../../../../../../services/draw.service.js'
import { findEditionOrThrow, loadEditionDetail } from '../../../../../../services/edition.service.js'
import { useDataSource } from '../../../../../../utils/database.util.js'
import { buildEditionWorkbook } from '../../../../../../utils/edition-export.util.js'
import { requireRole } from '../../../../../../utils/require-role.util.js'
import { getParamsWithSchema } from '../../../../../../utils/validation.util.js'
import { editionParamsSchema } from '../../../../../schemas/edition.schema.js'

/**
 * GET /api/v1/admin/editions/{id}/export.xlsx (B-30) : classeur Excel de l'édition (archives comprises), un onglet par partie.
 * Administrateur seulement, rôle vérifié avant toute lecture. Les données viennent des services existants (détail public de
 * l'édition, tirages admin) : aucun email ni donnée de compte. Jamais mis en cache.
 */
export default defineEventHandler(async (event): Promise<Buffer> => {
  requireRole(event, USER_ROLE.ADMIN)
  const { id } = await getParamsWithSchema(event, editionParamsSchema)
  const dataSource = await useDataSource()
  const edition = await findEditionOrThrow(dataSource, id)
  const [detail, draws] = await Promise.all([loadEditionDetail(dataSource, edition), loadAdminDraws(dataSource, edition.id)])
  const workbook = await buildEditionWorkbook({ edition: detail, qualification: edition.qualification, draws })
  setResponseHeaders(event, {
    'Content-Type': EDITION_EXPORT_CONTENT_TYPE,
    'Content-Disposition': `attachment; filename="${buildEditionExportFilename(edition.code)}"`,
    'Cache-Control': 'no-store'
  })
  return workbook
})
