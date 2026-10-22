import { setResponseHeader } from 'h3'
import type { IMe } from '../../../interfaces/me.interface'
import { loadMe } from '../../utils/auth/me.util'
import { requireUser } from '../../utils/auth/require-role.util'

export default defineEventHandler(async (event): Promise<IMe> => {
  const user = requireUser(event)
  setResponseHeader(event, 'Cache-Control', 'no-store')
  return loadMe(await useDataSource(), user.id)
})
