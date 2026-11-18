import type { IAdminDraw } from './draw.interface.js'
import type { IEditionDetail } from './edition.interface.js'
import type { IQualificationParameters } from './qualification.interface.js'

/** Ce que l'export Excel d'une édition lit (B-30) : vue de l'édition, qualification figée et tirages (brouillons compris). Aucune donnée de compte. */
export interface IEditionExportInput {
  edition: IEditionDetail
  qualification: IQualificationParameters | null
  draws: IAdminDraw[]
}
