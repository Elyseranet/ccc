import type { IEditionParticipant } from '../../../../../interfaces/edition.interface'
import { toEditionParticipant } from '../../../../utils/edition/edition-assemble.util'
import { loadParticipations } from '../../../../services/edition.service'
import { readEditionResource } from '../../../../utils/edition/edition-route.util'

export default defineEventHandler((event) =>
  readEditionResource(event, async (dataSource, edition): Promise<IEditionParticipant[]> =>
    (await loadParticipations(dataSource, edition.id)).map(toEditionParticipant)))
