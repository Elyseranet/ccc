import type { IAdminActivityDrawTarget, IAdminActivityMatchTarget } from '../interfaces/admin-activity.interface.js'

/** Union discriminée sur `type` (ADMIN_ACTIVITY_TARGET). */
export type TAdminActivityTarget = IAdminActivityMatchTarget | IAdminActivityDrawTarget
