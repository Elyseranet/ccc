import type { ICompetitorDetail, ICompetitorListItem } from '#shared/interfaces/api/competitor.interface'
import type { IHeadToHead } from '#shared/interfaces/api/head-to-head.interface'
import type { IPaginated } from '#shared/interfaces/api/pagination.interface'
import { API_ENDPOINT } from '~/enums/api-endpoint.enum'
import type { IBaseServiceOptions, ICompetitorsQuery } from '~/interfaces/api-client.interface'
import { BaseService } from '~/services/base.service'

/*********************************************************
 * CompetitorService
 *
 * @description
 * Annuaire public (E-e : `?q=` public), fiche joueur et face-à-face (RG36, RG37).
 ********************************************************/
export class CompetitorService extends BaseService {
  constructor (options: IBaseServiceOptions = {}) {
    super(options)
  }

  list (query: ICompetitorsQuery = {}): Promise<IPaginated<ICompetitorListItem>> {
    return this.resolve<IPaginated<ICompetitorListItem>>(
      API_ENDPOINT.COMPETITORS,
      () => this.request<IPaginated<ICompetitorListItem>>('/competiteurs', { query: { ...query } }),
      async () => (await import('~/fixtures/competitor.fixture')).competitorsFixture(query)
    )
  }

  detail (id: string): Promise<ICompetitorDetail> {
    return this.resolve<ICompetitorDetail>(
      API_ENDPOINT.COMPETITOR,
      () => this.request<ICompetitorDetail>(`/competiteurs/${encodeURIComponent(id)}`),
      async () => (await import('~/fixtures/competitor.fixture')).competitorDetailFixture(id)
    )
  }

  headToHead (id: string, opponentId: string): Promise<IHeadToHead> {
    return this.resolve<IHeadToHead>(
      API_ENDPOINT.HEAD_TO_HEAD,
      () => this.request<IHeadToHead>(`/competiteurs/${encodeURIComponent(id)}/face-a-face`, { query: { adversaire: opponentId } }),
      async () => (await import('~/fixtures/competitor.fixture')).headToHeadFixture(id, opponentId)
    )
  }
}
