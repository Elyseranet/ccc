import { describe, expect, it } from 'vitest'
import { findFixtureEndpoints } from '~/utils/fixture.util'

/*********************************************************
 * Garde de release
 *
 * @description
 * On ne livre pas de fixture en production : dans un build de release (`RELEASE_BUILD=true`, script `test:release`),
 * aucune entrée de `API_SOURCES` ne doit valoir `FIXTURE`. Hors release, ce test est ignoré.
 ********************************************************/
describe.runIf(process.env.RELEASE_BUILD === 'true')('api-sources en release', () => {
  it('ne contient aucune entrée FIXTURE', () => {
    expect(findFixtureEndpoints()).toEqual([])
  })
})
