import { USER_ROLE } from '../enums/user.enum.js'
import { FIXTURE_ADMIN_INITIALS } from '../consts/api.const.js'
import { API_ENDPOINT } from '../enums/api-endpoint.enum.js'
import type { IMeServiceOptions } from '../interfaces/api-client.interface.js'
import type { ISessionIdentity } from '../interfaces/session.interface.js'
import { BaseService } from './base.service.js'

/*********************************************************
 * MeService
 *
 * @description
 * `GET /moi`. Le type de retour sera `IMe` (B-08) ; F-00 n'en consomme que le rôle.
 ********************************************************/
export class MeService extends BaseService {
  private readonly fixtureRole: ISessionIdentity['role']

  constructor (options: IMeServiceOptions = {}) {
    super(options)
    this.fixtureRole = options.fixtureRole ?? null
  }

  me (): Promise<ISessionIdentity> {
    return this.resolve<ISessionIdentity>(
      API_ENDPOINT.ME,
      () => this.request<ISessionIdentity>('/moi'),
      async () => ({ default: { role: this.fixtureRole, initials: this.fixtureRole === USER_ROLE.ADMIN ? FIXTURE_ADMIN_INITIALS : null }, empty: { role: null, initials: null } })
    )
  }
}
