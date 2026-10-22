import { describe, expect, it } from 'vitest'
import { findDeliveredPendingUsages } from '../../../src/utils/page-delivery.util'

/*********************************************************
 * Garde de release (T-REL-01, OPS-3, ARCH-8)
 *
 * @description
 * Un build de release (`RELEASE_BUILD=true`, script `test:release`, lancé par le Dockerfile avant `nuxt build`)
 * échoue dès qu'une page LIVRÉE (`PAGE_DELIVERY`) consomme un endpoint dont la route Nitro n'existe pas encore
 * (`API_ROUTES`, `pendingTicket`). Une page non livrée est masquée en production (404, hors navigation) : elle ne
 * compte pas. Un endpoint partagé (`ME`, `EDITIONS`…) bloque la release dès qu'une seule page livrée le consomme
 * sans route. Hors release, ce test est ignoré.
 ********************************************************/
describe.runIf(process.env.RELEASE_BUILD === 'true')('garde de release par page livrée', () => {
  it('aucune page livrée ne consomme un endpoint sans route', () => {
    expect(findDeliveredPendingUsages()).toEqual([])
  })
})
