import { describe, expect, it } from 'vitest'
import { findDeliveredFixtureUsages } from '~/utils/page-delivery.util'

/*********************************************************
 * Garde de release (T-REL-01, OPS-3)
 *
 * @description
 * Un build de release (`RELEASE_BUILD=true`, script `test:release`, appelé par le Dockerfile avant `nuxt build`)
 * échoue dès qu'une page LIVRÉE (`PAGE_DELIVERY`) consomme un endpoint encore en `API_SOURCE.FIXTURE`.
 * Une page non livrée est masquée en production (404, hors navigation) : ses fixtures ne comptent pas.
 * Un endpoint partagé (`ME`, `EDITIONS`…) bloque la release tant qu'une seule page livrée le consomme en fixture.
 * Hors release, ce test est ignoré.
 ********************************************************/
describe.runIf(process.env.RELEASE_BUILD === 'true')('garde de release par page livrée', () => {
  it('aucune page livrée ne consomme un endpoint en FIXTURE', () => {
    expect(findDeliveredFixtureUsages()).toEqual([])
  })
})
