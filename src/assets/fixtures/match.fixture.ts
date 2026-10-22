import type { IAdminMatch } from '../../interfaces/admin-match.interface.js'
import { ADMIN_MATCHES_2026_FIXTURE, ADMIN_MATCHES_ARCHIVE_FIXTURE } from './admin-match-2026.fixture.js'
import { editionId } from './edition-id.fixture.js'
import type { IFixtureSet } from '../../interfaces/fixture.interface.js'

/*********************************************************
 * Fixtures file admin des scores
 *
 * @description
 * Aiguille par édition : 2026 porte les 105 matchs de la maquette (`admin-match-2026.fixture.ts`) ; une autre édition est
 * une archive dont seuls les matchs validés existent.
 ********************************************************/
export const adminMatchesFixture = (id: string): IFixtureSet<IAdminMatch[]> =>
  id === editionId('2026') ? ADMIN_MATCHES_2026_FIXTURE : ADMIN_MATCHES_ARCHIVE_FIXTURE
