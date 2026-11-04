import { ACCOUNT_AVATAR_MAX_BYTES, ACCOUNT_AVATAR_TYPES } from '../consts/account.const.js'
import { ACCOUNT_ERROR } from '../enums/account.enum.js'

/**
 * Contrôle de retour immédiat d'un fichier d'avatar (taille, puis type). Le serveur fait foi : il refuse plus de 2 Mo (413),
 * un format hors JPEG, PNG, WebP d'après la signature du fichier (415), et une image illisible (422).
 */
export const validateAvatarFile = (file: Pick<File, 'size' | 'type'>): ACCOUNT_ERROR | null => {
  if (file.size > ACCOUNT_AVATAR_MAX_BYTES) {
    return ACCOUNT_ERROR.AVATAR_TOO_LARGE
  }
  return ACCOUNT_AVATAR_TYPES.includes(file.type) ? null : ACCOUNT_ERROR.AVATAR_UNSUPPORTED_TYPE
}
