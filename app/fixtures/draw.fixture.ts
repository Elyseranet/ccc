import { DRAW_KIND, DRAW_STATUS } from '#shared/enums/draw.enum'
import { ROUND_KIND } from '#shared/enums/round.enum'
import type { IDraw } from '#shared/interfaces/api/draw.interface'
import { editionDetailFixture } from '~/fixtures/edition.fixture'
import type { IFixtureSet } from '~/interfaces/fixture.interface'

/*********************************************************
 * Fixtures tirages admin
 *
 * @description
 * Source : les tirages de l'édition 2025 de edition.html (tirage des poules et tirages de la phase finale).
 ********************************************************/
export const adminDrawsFixture = (editionId: string): IFixtureSet<IDraw[]> => ({
  default: editionDetailFixture(editionId).default.draws,
  empty: []
})
