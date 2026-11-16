import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { defineEventHandler, setResponseStatus } from 'h3'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RouterLink } from 'vue-router'
import { useAdminEditionStore } from '../../../src/composables/useAdminEditionStore'
import { useAuthStore } from '../../../src/composables/useAuthStore'
import { ADMIN_EDITION_DELETED_STATE_KEY } from '../../../src/consts/admin-editions.const'
import { API_ENDPOINT } from '../../../src/enums/api-endpoint.enum'
import { API_ERROR_CODE } from '../../../src/enums/api-error-code.enum'
import { EDITION_ORIGIN, EDITION_STATUS } from '../../../src/enums/edition.enum'
import { USER_ROLE } from '../../../src/enums/user.enum'
import type { IEditionDetail } from '../../../src/interfaces/edition.interface'
import { API_ROUTES } from '../../../src/consts/api-routes.const'
import { EditionService } from '../../../src/services/edition.service'
import { buildMe } from '../../helpers/me'
import EditionDeleteZone from '~/components/admin/editions/EditionDeleteZone.vue'
import EditionPage from '~/pages/admin/editions/[code].vue'

/*********************************************************
 * F-60 : admin, suppression d'une édition
 *
 * @description
 * Service, composable (via la page) et zone « danger » contre des routes simulées. Le dialogue de confirmation (code saisi, Échap, focus,
 * libellé) est vérifié sur la vraie base dans `tests/e2e/writes/F-60.spec.ts`.
 ********************************************************/
const EDITION_ID = '00000000-0000-4000-8000-0000000000e1'

const detail = (overrides: Partial<IEditionDetail> = {}): IEditionDetail => ({
  id: EDITION_ID,
  code: '2060',
  year: 2060,
  name: null,
  heldOn: null,
  location: null,
  status: EDITION_STATUS.POOLS_PLAYING,
  origin: EDITION_ORIGIN.APP,
  participantCount: null,
  unidentifiedParticipantCount: null,
  matchCount: 0,
  scoredMatchCount: 0,
  unknownResultMatchCount: 0,
  champion: null,
  final: null,
  semiFinalists: [],
  description: null,
  closedAt: null,
  participants: [],
  pools: [],
  rounds: [],
  matches: [],
  draws: [],
  bracket: [],
  ...overrides
})

beforeEach(() => {
  clearNuxtData()
  useState(ADMIN_EDITION_DELETED_STATE_KEY).value = null
  useAuthStore(useNuxtApp().$pinia).setMe(buildMe(USER_ROLE.ADMIN))
})

const mountEdit = (code = '2060') => mountSuspended(EditionPage, { route: `/admin/editions/${code}`, global: { components: { RouterLink } } })

const registerEdition = (overrides: Partial<IEditionDetail>, onDelete: (event: Parameters<Parameters<typeof defineEventHandler>[0]>[0]) => unknown = () => null) => {
  const code = overrides.code ?? '2060'
  registerEndpoint(`/api/v1/editions/${code}`, defineEventHandler(() => detail(overrides)))
  registerEndpoint(`/api/v1/editions/${EDITION_ID}`, defineEventHandler((event) => event.method === 'DELETE' ? onDelete(event) : detail(overrides)))
}

describe('service : suppression', () => {
  it('est un DELETE /editions/{id} sans corps, la réponse 204 ne rend rien', async () => {
    const seen = vi.fn()
    registerEndpoint(`/api/v1/editions/${EDITION_ID}`, defineEventHandler((event) => {
      seen(event.method)
      setResponseStatus(event, 204)
      return null
    }))
    await expect(new EditionService().remove(EDITION_ID)).resolves.toBeUndefined()
    expect(seen).toHaveBeenCalledWith('DELETE')
  })

  it('la route est déclarée, en attente de B-28 tant qu’elle n’existe pas (ARCH-11)', () => {
    expect(API_ROUTES[API_ENDPOINT.EDITION_DELETE].file).toBe('editions/[id]/index.delete.ts')
  })
})

describe('page de modification : zone de suppression', () => {
  it('édition de l’appli en cours : la zone « danger » est présente', async () => {
    registerEdition({})
    const wrapper = await mountEdit()
    await flushPromises()
    expect(wrapper.find('[data-cy="edition-delete-zone"]').exists()).toBe(true)
    expect(wrapper.get('[data-cy="edition-delete-open"]').text()).toContain('Supprimer l’édition…')
  })

  it('édition de l’appli clôturée : la zone est présente aussi', async () => {
    registerEdition({ status: EDITION_STATUS.CLOSED })
    const wrapper = await mountEdit()
    await flushPromises()
    expect(wrapper.find('[data-cy="edition-closed"]').exists()).toBe(true)
    expect(wrapper.find('[data-cy="edition-delete-zone"]').exists()).toBe(true)
  })

  it('archive (LEGACY_IMPORT) : aucune zone', async () => {
    registerEdition({ code: '2012a', year: 2012, status: EDITION_STATUS.CLOSED, origin: EDITION_ORIGIN.LEGACY_IMPORT })
    const wrapper = await mountEdit('2012a')
    await flushPromises()
    expect(wrapper.find('[data-cy="edition-closed"]').exists()).toBe(true)
    expect(wrapper.find('[data-cy="edition-delete-zone"]').exists()).toBe(false)
  })

  it('confirmation : DELETE envoyé, édition active remise à null, code posé pour le snackbar de la liste', async () => {
    const seen = vi.fn()
    registerEdition({}, (event) => {
      seen(event.method)
      setResponseStatus(event, 204)
      return null
    })
    const store = useAdminEditionStore(useNuxtApp().$pinia)
    store.editionId = EDITION_ID
    const wrapper = await mountEdit()
    await flushPromises()
    wrapper.getComponent(EditionDeleteZone).vm.$emit('confirm')
    await vi.waitFor(() => expect(seen).toHaveBeenCalledWith('DELETE'))
    await flushPromises()
    expect(store.editionId).toBeNull()
    expect(useState(ADMIN_EDITION_DELETED_STATE_KEY).value).toBe('2060')
  })

  it('une autre édition active est laissée telle quelle', async () => {
    registerEdition({}, (event) => {
      setResponseStatus(event, 204)
      return null
    })
    const store = useAdminEditionStore(useNuxtApp().$pinia)
    store.editionId = '00000000-0000-4000-8000-0000000000e2'
    const wrapper = await mountEdit()
    await flushPromises()
    wrapper.getComponent(EditionDeleteZone).vm.$emit('confirm')
    await vi.waitFor(() => expect(useState(ADMIN_EDITION_DELETED_STATE_KEY).value).toBe('2060'))
    expect(store.editionId).toBe('00000000-0000-4000-8000-0000000000e2')
  })

  it('409 EDITION_LEGACY_PROTECTED : message traduit sous le bouton, rien n’est supprimé côté écran', async () => {
    registerEdition({}, (event) => {
      setResponseStatus(event, 409)
      return { statusCode: 409, code: API_ERROR_CODE.EDITION_LEGACY_PROTECTED, message: API_ERROR_CODE.EDITION_LEGACY_PROTECTED }
    })
    const store = useAdminEditionStore(useNuxtApp().$pinia)
    store.editionId = EDITION_ID
    const wrapper = await mountEdit()
    await flushPromises()
    wrapper.getComponent(EditionDeleteZone).vm.$emit('confirm')
    await vi.waitFor(() => expect(wrapper.find('[data-cy="edition-delete-error"]').exists()).toBe(true))
    expect(wrapper.get('[data-cy="edition-delete-error"]').text()).toContain('Suppression refusée.')
    expect(store.editionId).toBe(EDITION_ID)
    expect(useState(ADMIN_EDITION_DELETED_STATE_KEY).value).toBeNull()
  })

  it('404 : message « Édition introuvable. »', async () => {
    registerEdition({}, (event) => {
      setResponseStatus(event, 404)
      return { statusCode: 404, code: API_ERROR_CODE.NOT_FOUND, message: API_ERROR_CODE.NOT_FOUND }
    })
    const wrapper = await mountEdit()
    await flushPromises()
    wrapper.getComponent(EditionDeleteZone).vm.$emit('confirm')
    await vi.waitFor(() => expect(wrapper.find('[data-cy="edition-delete-error"]').exists()).toBe(true))
    expect(wrapper.get('[data-cy="edition-delete-error"]').text()).toContain('Édition introuvable.')
  })
})
