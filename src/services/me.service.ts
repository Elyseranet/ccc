import { USER_ROLE } from '#shared/enums/user.enum'
import { FIXTURE_ADMIN_INITIALS } from '~/consts/api.const'
import { API_ENDPOINT } from '~/enums/api-endpoint.enum'
import type { IMeServiceOptions } from '~/interfaces/api-client.interface'
import type { ISessionIdentity } from '~/interfaces/session.interface'
import { BaseService } from '~/services/base.service'

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
