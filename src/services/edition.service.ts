import type { IEditionDetail, IEditionSummary } from '#shared/interfaces/api/edition.interface'
import type { IMatch } from '#shared/interfaces/api/match.interface'
import type { IPaginated } from '#shared/interfaces/api/pagination.interface'
import type { IArchiveStats } from '#shared/interfaces/api/stats.interface'
import { API_ENDPOINT } from '~/enums/api-endpoint.enum'
import type { IEditionMatchesQuery, IBaseServiceOptions } from '~/interfaces/api-client.interface'
import { BaseService } from '~/services/base.service'

/*********************************************************
 * EditionService
 *
 * @description
 * Lecture des éditions, de leurs matchs et des compteurs d'archive (C1).
 ********************************************************/
export class EditionService extends BaseService {
  constructor (options: IBaseServiceOptions = {}) {
    super(options)
  }

  stats (): Promise<IArchiveStats> {
    return this.resolve<IArchiveStats>(
      API_ENDPOINT.STATS,
      () => this.request<IArchiveStats>('/stats'),
      async () => (await import('~/fixtures/edition.fixture')).STATS_FIXTURE
    )
  }

  list (): Promise<IEditionSummary[]> {
    return this.resolve<IEditionSummary[]>(
      API_ENDPOINT.EDITIONS,
      () => this.request<IEditionSummary[]>('/editions'),
      async () => (await import('~/fixtures/edition.fixture')).EDITIONS_FIXTURE
    )
  }

  detail (id: string): Promise<IEditionDetail> {
    return this.resolve<IEditionDetail>(
      API_ENDPOINT.EDITION,
      () => this.request<IEditionDetail>(`/editions/${encodeURIComponent(id)}`),
      async () => (await import('~/fixtures/edition.fixture')).editionDetailFixture(id)
    )
  }

  matches (id: string, query: IEditionMatchesQuery = {}): Promise<IPaginated<IMatch>> {
    return this.resolve<IPaginated<IMatch>>(
      API_ENDPOINT.EDITION_MATCHES,
      () => this.request<IPaginated<IMatch>>(`/editions/${encodeURIComponent(id)}/matchs`, { query: { ...query, statut: query.statut?.join(',') } }),
      async () => (await import('~/fixtures/edition.fixture')).editionMatchesFixture(id)
    )
  }
}
