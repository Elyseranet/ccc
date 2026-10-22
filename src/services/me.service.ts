import type { IBaseServiceOptions } from '../interfaces/api-client.interface.js'
import type { IMe } from '../interfaces/me.interface.js'
import { BaseService } from './base.service.js'

/*********************************************************
 * MeService
 *
 * @description
 * `GET /moi` (B-08) : le compte connecté. Sans session, le serveur répond 401 (`ApiRequestError`).
 ********************************************************/
export class MeService extends BaseService {
  constructor (options: IBaseServiceOptions = {}) {
    super(options)
  }

  me (): Promise<IMe> {
    return this.request<IMe>('/moi')
  }
}
