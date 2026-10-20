import { z } from 'zod'
import {
  AVATAR_ALLOWED_PROTOCOLS,
  AVATAR_URL_MAX_LENGTH,
  EMAIL_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PHONE_PATTERN
} from '../consts/auth.const'

/** Pas de contrainte de longueur minimale au login : on ne révèle pas la politique à un attaquant. */
export const loginSchema = z.object({
  email: z.string().trim().min(1).max(EMAIL_MAX_LENGTH),
  password: z.string().min(1).max(PASSWORD_MAX_LENGTH)
}).strict()

const avatarUrlSchema = z.string().trim().max(AVATAR_URL_MAX_LENGTH).refine((value) => {
  try {
    const url = new URL(value)
    return AVATAR_ALLOWED_PROTOCOLS.includes(url.protocol) && url.username === '' && url.password === ''
  } catch {
    return false
  }
}, 'Must be an https URL without credentials')

/**
 * Liste blanche A4 : avatar, téléphone, mot de passe. `.strict()` refuse en 400 tout autre champ
 * (`role`, `email`, `nickname`, `displayName`…), plutôt que de l'ignorer en silence.
 */
export const updateMeSchema = z.object({
  avatarUrl: avatarUrlSchema.nullable().optional(),
  phone: z.string().trim().regex(PHONE_PATTERN, 'Invalid phone number').nullable().optional(),
  currentPassword: z.string().min(1).max(PASSWORD_MAX_LENGTH).optional(),
  newPassword: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH).optional()
}).strict().superRefine((value, context) => {
  if (Object.keys(value).length === 0) {
    context.addIssue({ code: 'custom', message: 'At least one field is required', path: [] })
  }
  if ((value.currentPassword === undefined) !== (value.newPassword === undefined)) {
    context.addIssue({
      code: 'custom',
      message: 'currentPassword and newPassword must be sent together',
      path: [value.newPassword === undefined ? 'newPassword' : 'currentPassword']
    })
  }
})
