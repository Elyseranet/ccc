import type { IBaseServiceOptions } from '../interfaces/api-client.interface.js'
import type { IUpdateMeRequest } from '../interfaces/auth.interface.js'
import type { IAvatarUploadResponse } from '../interfaces/avatar.interface.js'
import type { IMe } from '../interfaces/me.interface.js'
import { AVATAR_UPLOAD_FIELD } from '../consts/avatar.const.js'
import { BaseService } from './base.service.js'

/*********************************************************
 * MeService
 *
 * @description
 * Le compte connecté (B-08, B-16) : lecture, modification du téléphone et du mot de passe, avatar. Sans session, le
 * serveur répond 401 (`ApiRequestError`). L'avatar part en `multipart/form-data` : un `FormData`, dont le navigateur pose
 * lui-même le `Content-Type` avec son `boundary`. Le serveur en refuse plus de 2 Mo (413), le contrôle du front n'est qu'un
 * retour immédiat. Ce fichier ne peut pas être fusionné avec `avatar.service.ts`, qui tire `sharp`, un module Node.
 ********************************************************/
export class MeService extends BaseService {
  constructor (options: IBaseServiceOptions = {}) {
    super(options)
  }

  me (): Promise<IMe> {
    return this.request<IMe>('/moi')
  }

  /** `PATCH /moi` : liste blanche (téléphone, mot de passe). Renvoie le compte à jour. */
  updateProfile (changes: IUpdateMeRequest): Promise<IMe> {
    return this.request<IMe>('/moi', { method: 'PATCH', body: { ...changes } })
  }

  /** `PUT /moi/avatar` : un seul champ `file`. */
  uploadAvatar (file: File): Promise<IAvatarUploadResponse> {
    const body = new FormData()
    body.append(AVATAR_UPLOAD_FIELD, file)
    return this.request<IAvatarUploadResponse>('/moi/avatar', { method: 'PUT', body })
  }

  /** `DELETE /moi/avatar` : 204, les initiales reviennent. 404 s'il n'y avait pas d'avatar. */
  removeAvatar (): Promise<void> {
    return this.request<void>('/moi/avatar', { method: 'DELETE' })
  }
}
