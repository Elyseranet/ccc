import { API_ENDPOINT } from '../enums/api-endpoint.enum.js'
import type { IBaseServiceOptions } from '../interfaces/api-client.interface.js'
import { BaseService } from './base.service.js'

/*********************************************************
 * AuthService
 *
 * @description
 * `POST /auth/logout` (F-12). Le ticket Compte (F-10) y ajoute la connexion et l'invitation.
 ********************************************************/
export class AuthService extends BaseService {
  constructor (options: IBaseServiceOptions = {}) {
    super(options)
  }

  logout (): Promise<void> {
    return this.resolve<void>(
      API_ENDPOINT.AUTH_LOGOUT,
      () => this.request<void>('/auth/logout', { method: 'POST' }),
      async () => ({ default: undefined, empty: undefined })
    )
  }
}
