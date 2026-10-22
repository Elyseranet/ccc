import type { IAdminMatch } from '../interfaces/admin-match.interface.js'
import { API_ENDPOINT } from '../enums/api-endpoint.enum.js'
import type { IAdminMatchesQuery, IBaseServiceOptions } from '../interfaces/api-client.interface.js'
import { BaseService } from './base.service.js'

/*********************************************************
 * MatchService
 *
 * @description
 * File admin des scores (C6). L'écriture (`PUT /matchs/{id}/score`, validation, correction)
 * est ajoutée par F-08 avec ses DTO de requête (B-12).
 ********************************************************/
export class MatchService extends BaseService {
  constructor (options: IBaseServiceOptions = {}) {
    super(options)
  }

  adminList (editionId: string, query: IAdminMatchesQuery = {}): Promise<IAdminMatch[]> {
    return this.resolve<IAdminMatch[]>(
      API_ENDPOINT.ADMIN_MATCHES,
      () => this.request<IAdminMatch[]>(`/admin/editions/${encodeURIComponent(editionId)}/matchs`, { query: { ...query, statut: query.statut?.join(',') } }),
      async () => (await import('../assets/fixtures/match.fixture.js')).adminMatchesFixture(editionId)
    )
  }
}
