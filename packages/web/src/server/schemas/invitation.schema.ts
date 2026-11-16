import { z } from 'zod'
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, PHONE_PATTERN } from '../../consts/auth.const.js'
import { IDENTITY_NAME_MAX_LENGTH, IDENTITY_NAME_PATTERN } from '../../consts/invitation.const.js'

const nameSchema = z.string().trim().min(1).max(IDENTITY_NAME_MAX_LENGTH).regex(IDENTITY_NAME_PATTERN, 'Invalid characters')
const nicknameSchema = z.string().trim().max(IDENTITY_NAME_MAX_LENGTH).regex(IDENTITY_NAME_PATTERN, 'Invalid characters')
const phoneSchema = z.string().trim().regex(PHONE_PATTERN, 'Invalid phone number')

/** `POST /auth/invitation/{jeton}` : mêmes règles de mot de passe que B-08. */
export const acceptInvitationSchema = z.object({
  password: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  nickname: nicknameSchema.nullable().optional(),
  phone: phoneSchema.nullable().optional()
}).strict()
