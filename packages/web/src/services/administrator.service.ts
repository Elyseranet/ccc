import type { IBaseServiceOptions } from '../interfaces/api-client.interface.js'
import type { IAdminAccount, IAdminInvited } from '../interfaces/administrator.interface.js'
import type { IInvitationResent, ISetAccountEmailRequest } from '../interfaces/invitation.interface.js'
import { BaseService } from './base.service.js'

/*********************************************************
 * AdministratorService
 *
 * @description
 * Client des comptes administrateurs (B-31, `docs/api/administrateurs.md`) : liste, invitation (ou promotion d'un compte joueur), renvoi,
 * correction de l'email d'un compte non activé, retrait de l'accès. Rôle `ADMIN` exigé sur toutes les routes.
 ********************************************************/
export class AdministratorService extends BaseService {
  constructor (options: IBaseServiceOptions = {}) {
    super(options)
  }

  list (): Promise<IAdminAccount[]> {
    return this.request<IAdminAccount[]>('/admin/administrateurs')
  }

  /** 201 compte créé, 200 `promoted: true` compte joueur promu ; 409 `ALREADY_ADMIN`. */
  invite (email: string): Promise<IAdminInvited> {
    const body: ISetAccountEmailRequest = { email }
    return this.request<IAdminInvited>('/admin/administrateurs', { method: 'POST', body: { ...body } })
  }

  /** Nouvelle invitation, ancien lien annulé ; 409 `ACCOUNT_ACTIVE`. */
  resendInvitation (id: string): Promise<IInvitationResent> {
    return this.request<IInvitationResent>(`/admin/administrateurs/${encodeURIComponent(id)}/invitation`, { method: 'POST' })
  }

  /** Corrige l'email d'un compte non activé et renvoie l'invitation ; 409 `ACCOUNT_ACTIVE` / `EMAIL_ALREADY_USED`. */
  correctEmail (id: string, email: string): Promise<IInvitationResent> {
    const body: ISetAccountEmailRequest = { email }
    return this.request<IInvitationResent>(`/admin/administrateurs/${encodeURIComponent(id)}`, { method: 'PATCH', body: { ...body } })
  }

  /** 204 ; 409 `LAST_ADMIN` / `CANNOT_REVOKE_SELF`. */
  revoke (id: string): Promise<void> {
    return this.request<void>(`/admin/administrateurs/${encodeURIComponent(id)}`, { method: 'DELETE' })
  }
}
