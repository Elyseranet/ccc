import { DRAW_KIND, DRAW_STATUS } from '../../enums/draw.enum.js'
import { ROUND_KIND } from '../../enums/round.enum.js'
import type { IDraw } from '../../interfaces/draw.interface.js'
import { editionDetailFixture } from './edition.fixture.js'
import type { IFixtureSet } from '../../interfaces/fixture.interface.js'

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
