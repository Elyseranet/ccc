import type { IBaseServiceOptions } from '../interfaces/api-client.interface.js'
import type { ILoginRequest } from '../interfaces/auth.interface.js'
import type { IAcceptInvitationRequest, IInvitationPreview } from '../interfaces/invitation.interface.js'
import type { IMe } from '../interfaces/me.interface.js'
import { BaseService } from './base.service.js'

/*********************************************************
 * AuthService
 *
 * @description
 * Les appels d'authentification du navigateur : connexion, déconnexion (F-12) et première connexion par invitation (F-10).
 * Les trois renvoient ou valident une session que le serveur pose en cookie httpOnly : le navigateur ne lit jamais le jeton.
 * La vérification et la consommation d'une invitation côté serveur vivent dans `invitation.service.ts`, que ce fichier ne
 * peut pas importer (il tire nodemailer, un module Node).
 ********************************************************/
export class AuthService extends BaseService {
  constructor (options: IBaseServiceOptions = {}) {
    super(options)
  }

  /** `POST /auth/login` : le compte connecté (`IMe`). 401 `INVALID_CREDENTIALS`, 429 si le compte est ralenti. */
  login (credentials: ILoginRequest): Promise<IMe> {
    return this.request<IMe>('/auth/login', { method: 'POST', body: { ...credentials } })
  }

  logout (): Promise<void> {
    return this.request<void>('/auth/logout', { method: 'POST' })
  }

  /** `GET /auth/invitation/{jeton}` : de quoi pré-remplir le formulaire. 404 jeton inconnu, 410 expiré ou consommé. */
  previewInvitation (token: string): Promise<IInvitationPreview> {
    return this.request<IInvitationPreview>(`/auth/invitation/${encodeURIComponent(token)}`)
  }

  /** `POST /auth/invitation/{jeton}` : fixe le mot de passe, consomme le jeton et ouvre la session. */
  acceptInvitation (token: string, body: IAcceptInvitationRequest): Promise<IMe> {
    return this.request<IMe>(`/auth/invitation/${encodeURIComponent(token)}`, { method: 'POST', body: { ...body } })
  }
}
