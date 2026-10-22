import { describe, expect, it } from 'vitest'
import { CompetitorService } from '~/services/competitor.service'
import { EditionService } from '~/services/edition.service'
import { RankingService } from '~/services/ranking.service'
import { CompetitorService as RelativeCompetitorService } from '../../../src/services/competitor.service'

describe('T-ARCH-02 : les services fusionnés se chargent dans l’environnement nuxt de Vitest', () => {
  it('importe les trois services fusionnés sans mock, par alias et par chemin relatif', () => {
    expect([CompetitorService, EditionService, RankingService, RelativeCompetitorService].map(service => typeof service)).toEqual(['function', 'function', 'function', 'function'])
  })
})
