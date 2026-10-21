import type { IDraw } from '#shared/interfaces/api/draw.interface'
import { API_ENDPOINT } from '~/enums/api-endpoint.enum'
import type { IBaseServiceOptions } from '~/interfaces/api-client.interface'
import { BaseService } from '~/services/base.service'

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
      async () => (await import('~/fixtures/draw.fixture')).adminDrawsFixture(editionId)
    )
  }
}
