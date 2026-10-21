import type { IEditionDetail } from '#shared/interfaces/api/edition.interface'

export type TEdition2026Body = Pick<IEditionDetail, 'participants' | 'pools' | 'rounds' | 'matches' | 'draws' | 'bracket'>
