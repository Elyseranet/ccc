import { createHash } from 'node:crypto'
import sharp from 'sharp'
import { AVATAR_MIME_TYPE } from '../enums/avatar.enum.js'
import {
  AVATAR_MAX_DIMENSION_PX,
  AVATAR_MAX_INPUT_PIXELS,
  AVATAR_SHARP_FORMAT,
  JPEG_SIGNATURE,
  PNG_SIGNATURE,
  WEBP_MARK,
  WEBP_MARK_OFFSET,
  WEBP_RIFF
} from '../consts/avatar.const.js'
import type { IProcessedAvatar } from '../interfaces/avatar.interface.js'
import { avatarUnreadable } from './api-error.util.js'

const startsWith = (bytes: Uint8Array, signature: readonly number[], offset = 0): boolean =>
  bytes.length >= offset + signature.length && signature.every((value, index) => bytes[offset + index] === value)

/** Type détecté par les octets magiques ; jamais par l'extension ni par le `Content-Type` déclaré. */
export const detectAvatarMimeType = (bytes: Uint8Array): AVATAR_MIME_TYPE | null => {
  if (startsWith(bytes, JPEG_SIGNATURE)) {
    return AVATAR_MIME_TYPE.JPEG
  }
  if (startsWith(bytes, PNG_SIGNATURE)) {
    return AVATAR_MIME_TYPE.PNG
  }
  if (startsWith(bytes, WEBP_RIFF) && startsWith(bytes, WEBP_MARK, WEBP_MARK_OFFSET)) {
    return AVATAR_MIME_TYPE.WEBP
  }
  return null
}

/**
 * Ré-encode l'image : orientation EXIF appliquée (`rotate()` sans argument), côté plus long ramené à
 * 512 px sans agrandissement, même format en sortie. Sans `withMetadata()`, sharp n'écrit ni EXIF (GPS compris),
 * ni XMP, ni IPTC. Le décodage complet neutralise aussi les fichiers piégés (polyglottes, segments malformés).
 * Un fichier illisible ou tronqué lève 422.
 */
export const processAvatarImage = async (input: Buffer, mimeType: AVATAR_MIME_TYPE): Promise<IProcessedAvatar> => {
  let content: Buffer
  try {
    content = await sharp(input, { limitInputPixels: AVATAR_MAX_INPUT_PIXELS })
      .rotate()
      .resize({ width: AVATAR_MAX_DIMENSION_PX, height: AVATAR_MAX_DIMENSION_PX, fit: 'inside', withoutEnlargement: true })
      .toFormat(AVATAR_SHARP_FORMAT[mimeType])
      .toBuffer()
  } catch {
    throw avatarUnreadable()
  }
  return {
    content,
    mimeType,
    byteSize: content.length,
    sha256: createHash('sha256').update(content).digest('hex')
  }
}
