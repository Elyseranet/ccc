import { USER_ROLE } from '../../../../shared/enums/user.enum'
import { requireRole } from '../../../utils/auth/require-role.util'

/** Sonde de garde : prouve que `requireRole(ADMIN)` répond 401 / 403 / 200. Les vraies routes admin arrivent avec B-09+. */
export default defineEventHandler((event) => {
  requireRole(event, USER_ROLE.ADMIN)
  return { status: 'ok' }
})
