import type { IEditionParticipant } from '../../../../../shared/interfaces/api/edition.interface'
import { toEditionParticipant } from '../../../../utils/edition/edition-assemble.util'
import { loadParticipations } from '../../../../utils/edition/edition-read.util'
import { readEditionResource } from '../../../../utils/edition/edition-route.util'

export default defineEventHandler((event) =>
  readEditionResource(event, async (dataSource, edition): Promise<IEditionParticipant[]> =>
    (await loadParticipations(dataSource, edition.id)).map(toEditionParticipant)))
