import { FIXTURE_QUERY_PARAM, FIXTURE_SESSION_COOKIE } from '~/consts/api.const'
import type { FIXTURE_VARIANT } from '~/enums/fixture-variant.enum'
import { isFixtureSelectionAllowed, parseFixtureRole, parseFixtureVariant } from '~/utils/fixture.util'

/*********************************************************
 * useFixtureVariant
 *
 * @description
 * Variante de fixture (`?fixture=empty|error`) pour tester les états dégradés.
 * Sélectionnable en dev et en test seulement : ignorée dans un build de production.
 ********************************************************/
export const useFixtureVariant = (): FIXTURE_VARIANT => {
  const route = useRoute()
  return parseFixtureVariant(route.query[FIXTURE_QUERY_PARAM], isFixtureSelectionAllowed())
}

/*********************************************************
 * useFixtureRole
 *
 * @description
 * Rôle de la session de fixture, lu dans le cookie `ccc_fixture_session` (`admin` | `participant`).
 * Dev et test seulement ; en production la session vient de `GET /moi`.
 ********************************************************/
export const useFixtureRole = () => {
  const cookie = useCookie<string | null>(FIXTURE_SESSION_COOKIE, { default: () => null })
  return parseFixtureRole(cookie.value, isFixtureSelectionAllowed())
}
