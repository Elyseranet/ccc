import { getRequestHeader } from 'h3'
import type { H3Event } from 'h3'
import {
  AVATAR_MAX_BYTES,
  AVATAR_UPLOAD_BODY_MAX_BYTES,
  AVATAR_UPLOAD_FIELD,
  AVATAR_UPLOAD_TIMEOUT_MS,
  MULTIPART_CONTENT_TYPE_PATTERN
} from '../consts/avatar.const.js'
import { avatarTooLarge, validationFailed } from './api-error.util.js'
import { readRequestBody } from './request-body.util.js'

const invalidUpload = (message: string) => validationFailed([{ path: AVATAR_UPLOAD_FIELD, message }])

/** Le plafond générique de `readRequestBody` (PAYLOAD_TOO_LARGE) devient le code propre à l'avatar. */
const readBoundedBody = async (event: H3Event): Promise<Buffer> => {
  try {
    return await readRequestBody(event, { maxBytes: AVATAR_UPLOAD_BODY_MAX_BYTES, timeoutMs: AVATAR_UPLOAD_TIMEOUT_MS })
  } catch (error) {
    throw (error as { statusCode?: number } | null)?.statusCode === 413 ? avatarTooLarge() : error
  }
}

/**
 * Lit l'image d'un `multipart/form-data` à un seul champ `file`. Refus avant toute lecture : `Content-Length`
 * supérieur au plafond (413), corps qui n'est pas du multipart (400). La limite JSON de 16 Kio (M2) ne s'applique pas ici :
 * `readBoundedJsonBody` ne lit que `application/json`.
 */
export const readAvatarUpload = async (event: H3Event): Promise<Buffer> => {
  const contentType = getRequestHeader(event, 'content-type') ?? ''
  if (!MULTIPART_CONTENT_TYPE_PATTERN.test(contentType)) {
    throw invalidUpload('Expected multipart/form-data')
  }
  const declaredLength = Number(getRequestHeader(event, 'content-length'))
  if (Number.isFinite(declaredLength) && declaredLength > AVATAR_UPLOAD_BODY_MAX_BYTES) {
    throw avatarTooLarge()
  }

  const body = await readBoundedBody(event)

  let entries: Array<[string, FormDataEntryValue]>
  try {
    entries = [...(await new Response(new Uint8Array(body), { headers: { 'content-type': contentType } }).formData()).entries()]
  } catch {
    throw invalidUpload('Malformed multipart body')
  }
  if (entries.length !== 1 || entries[0]![0] !== AVATAR_UPLOAD_FIELD) {
    throw invalidUpload(`Exactly one "${AVATAR_UPLOAD_FIELD}" field is expected`)
  }
  const file = entries[0]![1]
  if (typeof file === 'string') {
    throw invalidUpload(`"${AVATAR_UPLOAD_FIELD}" must be a file`)
  }
  if (file.size > AVATAR_MAX_BYTES) {
    throw avatarTooLarge()
  }
  return Buffer.from(await file.arrayBuffer())
}
