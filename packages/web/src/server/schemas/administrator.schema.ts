import { z } from 'zod'

export const administratorIdParamsSchema = z.object({ id: z.uuid() })
