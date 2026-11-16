import { z } from 'zod'
import { ADMIN_ACTIVITY_DEFAULT_LIMIT, ADMIN_ACTIVITY_MAX_LIMIT } from '../../consts/admin-activity.const.js'

/** `limit` : entier strict de 1 à 100 ("abc", "1.5", "" et "0" sont rejetés, pas corrigés). Tout autre paramètre est refusé. */
export const adminActivityQuerySchema = z.strictObject({
  limit: z.string().regex(/^\d{1,3}$/).transform(Number).pipe(z.number().int().min(1).max(ADMIN_ACTIVITY_MAX_LIMIT))
    .default(ADMIN_ACTIVITY_DEFAULT_LIMIT)
})
