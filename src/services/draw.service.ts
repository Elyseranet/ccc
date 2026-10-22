import type { IDraw } from '../interfaces/draw.interface.js'
import { API_ENDPOINT } from '../enums/api-endpoint.enum.js'
import type { IBaseServiceOptions } from '../interfaces/api-client.interface.js'
import { BaseService } from './base.service.js'

/*********************************************************
 * DrawService
 *
 * @description
 * Tirages, brouillons compris (C7). L'écriture des affectations est ajoutée par le ticket Tirages (B-11).
 ********************************************************/
export class DrawService extends BaseService {
  constructor (options: IBaseServiceOptions = {}) {
    super(options)
  }

  adminList (editionId: string): Promise<IDraw[]> {
    return this.resolve<IDraw[]>(
      API_ENDPOINT.ADMIN_DRAWS,
      () => this.request<IDraw[]>(`/admin/editions/${encodeURIComponent(editionId)}/tirages`),
      async () => (await import('../assets/fixtures/draw.fixture.js')).adminDrawsFixture(editionId)
    )
  }
}
