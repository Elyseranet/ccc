import type { AVATAR_MIME_TYPE } from '../enums/avatar.enum.js'

/** Réponse de `PUT /moi/avatar` et `PUT /competiteurs/{id}/avatar` : l'URL (empreinte `?v=` incluse) de l'avatar posé. */
export interface IAvatarUploadResponse {
  avatarUrl: string
}

/** Résultat du ré-encodage, prêt à être stocké dans `competitor_avatars`. */
export interface IProcessedAvatar {
  content: Buffer
  mimeType: AVATAR_MIME_TYPE
  byteSize: number
  sha256: string
}

/** Image servie par `GET /competiteurs/{id}/avatar`. */
export interface IStoredAvatar {
  content: Buffer
  mimeType: AVATAR_MIME_TYPE
  sha256: string
}
