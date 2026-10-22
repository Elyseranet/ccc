import type { IRankingEvolutionSeries, IRankingRow } from '#shared/interfaces/api/ranking.interface'
import { API_ENDPOINT } from '~/enums/api-endpoint.enum'
import { RANKING_KIND } from '~/enums/ranking-kind.enum'
import type { IBaseServiceOptions } from '~/interfaces/api-client.interface'
import { BaseService } from '~/services/base.service'

/*********************************************************
 * RankingService
 *
 * @description
 * Classements ACP et All Time (RG4) et évolution annuelle de tous les joueurs (RG8, C5).
 ********************************************************/
export class RankingService extends BaseService {
  constructor (options: IBaseServiceOptions = {}) {
    super(options)
  }

  ranking (kind: RANKING_KIND): Promise<IRankingRow[]> {
    const isAcp = kind === RANKING_KIND.ACP
    return this.resolve<IRankingRow[]>(
      isAcp ? API_ENDPOINT.RANKING_ACP : API_ENDPOINT.RANKING_ALL_TIME,
      () => this.request<IRankingRow[]>(isAcp ? '/classements/acp' : '/classements/all-time'),
      async () => (await import('~/fixtures/ranking.fixture')).rankingFixture(kind)
    )
  }

  evolution (kind: RANKING_KIND): Promise<IRankingEvolutionSeries[]> {
    return this.resolve<IRankingEvolutionSeries[]>(
      API_ENDPOINT.RANKING_EVOLUTION,
      () => this.request<IRankingEvolutionSeries[]>('/classements/evolution', { query: { type: kind } }),
      async () => (await import('~/fixtures/ranking.fixture')).evolutionFixture(kind)
    )
  }
}
