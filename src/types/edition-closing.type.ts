import type { IEditionDetail } from '../interfaces/edition.interface.js'

/** Ce que la clôture lit d'une édition : la forme publique, que le navigateur possède déjà. */
export type TClosingInput = Pick<IEditionDetail, 'participants' | 'rounds' | 'matches'>
