import { z } from 'zod'
import { setAccountEmailSchema } from './competitor.schema.js'

export const administratorIdParamsSchema = z.object({ id: z.uuid() })

/** `POST /admin/administrateurs` : `confirmPromotion: true` autorise la promotion d'un compte joueur (B-33). */
export const inviteAdministratorSchema = setAccountEmailSchema.extend({ confirmPromotion: z.boolean().optional() }).strict()
