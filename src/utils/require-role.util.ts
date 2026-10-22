import type { H3Event } from 'h3'
import type { USER_ROLE } from '../enums/user.enum.js'
import type { IAuthUser } from '../interfaces/auth.interface.js'
import { forbidden, unauthorized } from './api-error.util.js'

/** 401 sans identité. */
export const requireUser = (event: H3Event): IAuthUser => {
  const user = event.context.user
  if (!user) {
    throw unauthorized()
  }
  return user
}

/** 401 sans identité, 403 avec un rôle qui ne figure pas dans la liste. */
export const requireRole = (event: H3Event, ...roles: USER_ROLE[]): IAuthUser => {
  const user = requireUser(event)
  if (!roles.includes(user.role)) {
    throw forbidden()
  }
  return user
}
