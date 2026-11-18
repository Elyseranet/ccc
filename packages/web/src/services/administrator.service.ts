import type { IAdminAccount } from '../interfaces/administrator.interface.js'
import type { IBaseServiceOptions } from '../interfaces/api-client.interface.js'
import { BaseService } from './base.service.js'

/*********************************************************
 * AdministratorService
 *
 * @description
 * Comptes administrateurs (B-31). Pour l'instant la seule lecture (`GET /admin/administrateurs`), ajoutée par F-69 pour le sélecteur
 * « Relier à un administrateur » ; F-68 y ajoute invitation, correction et retrait.
 ********************************************************/
export class AdministratorService extends BaseService {
  constructor (options: IBaseServiceOptions = {}) {
    super(options)
  }

  list (): Promise<IAdminAccount[]> {
    return this.request<IAdminAccount[]>('/admin/administrateurs')
  }
}
