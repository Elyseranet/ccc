import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { defineEventHandler, setResponseStatus } from 'h3'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RouterLink } from 'vue-router'
import { API_ERROR_CODE } from '../../../src/enums/api-error-code.enum'
import { USER_ROLE } from '../../../src/enums/user.enum'
import { ADMIN_MORE_ITEMS } from '../../../src/consts/admin-more.const'
import { ROUTES } from '../../../src/consts/routes.const'
import { isPageAccessible } from '../../../src/utils/page-delivery.util'
import AdminMorePage from '~/pages/admin/plus.vue'
import { AuthService } from '../../../src/services/auth.service'
import { useAuthStore } from '../../../src/composables/useAuthStore'
import { ApiRequestError } from '../../../src/utils/api-request-error.util'
import { buildMe } from '../../helpers/me'

const mountPage = () => mountSuspended(AdminMorePage, { route: ROUTES.ADMIN_MORE, global: { components: { RouterLink } } })

describe('page « Plus » de l’admin (F-12)', () => {
  it('propose exactement Phase finale, Éditions, Compétiteurs, Participants, site public et Mon compte, sans rien de ce que masque FA-09', () => {
    expect(ADMIN_MORE_ITEMS.map(item => item.to)).toEqual([ROUTES.ADMIN_FINAL_PHASE, ROUTES.ADMIN_EDITIONS, ROUTES.ADMIN_COMPETITORS, ROUTES.ADMIN_PARTICIPANTS, ROUTES.HOME, ROUTES.PROFILE])
  })

  it('en production, les entrées des pages non livrées restent masquées (PAGE_DELIVERY, F-12b, F-13)', () => {
    const production = ADMIN_MORE_ITEMS.filter(item => isPageAccessible(item.to, false)).map(item => item.to)
    expect(production).toEqual([ROUTES.ADMIN_PARTICIPANTS, ROUTES.HOME, ROUTES.PROFILE])
  })

  it('rend un h1 unique, six entrées traduites en test (pages non livrées visibles hors production), le sélecteur d’édition et la déconnexion', async () => {
    const wrapper = await mountPage()
    expect(wrapper.findAll('h1')).toHaveLength(1)
    expect(wrapper.get('h1').text()).toBe('Plus')
    const nav = wrapper.get('[data-cy="admin-more-nav"]')
    expect(nav.attributes('aria-label')).toBe('Plus d’options')
    expect(nav.text()).toContain('Phase finale')
    expect(nav.text()).toContain('Éditions')
    expect(nav.text()).toContain('Compétiteurs')
    expect(nav.text()).toContain('Participants')
    expect(nav.text()).toContain('Voir le site public')
    expect(nav.text()).toContain('Mon compte')
    expect(nav.findAll('a')).toHaveLength(6)
    expect(wrapper.find('[data-cy="admin-more-edition-select"]').exists()).toBe(true)
    expect(wrapper.get('[data-cy="admin-more-logout"]').text()).toBe('Se déconnecter')
  })
})

describe('états dégradés de la page « Plus » (F-12)', () => {
  beforeEach(() => {
    useAuthStore(useNuxtApp().$pinia).setMe(buildMe(USER_ROLE.ADMIN))
  })

  it('un échec de déconnexion affiche l’alerte et garde la session', async () => {
    const spy = vi.spyOn(AuthService.prototype, 'logout').mockRejectedValueOnce(
      new ApiRequestError({ statusCode: 500, code: API_ERROR_CODE.INTERNAL_ERROR, message: 'boom' })
    )
    const wrapper = await mountPage()
    expect(wrapper.find('[data-cy="admin-more-logout-error"]').exists()).toBe(false)
    await wrapper.get('[data-cy="admin-more-logout"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-cy="admin-more-logout-error"]').text()).toContain('La déconnexion a échoué')
    expect(useAuthStore(useNuxtApp().$pinia).isAdmin).toBe(true)
    spy.mockRestore()
  })

  for (const [label, status, body] of [
    ['liste vide', 200, []],
    ['erreur serveur', 500, { statusCode: 500, code: API_ERROR_CODE.INTERNAL_ERROR, message: 'boom' }],
    ['limite de débit', 429, { statusCode: 429, code: API_ERROR_CODE.RATE_LIMITED, message: 'slow down' }]
  ] as const) {
    it(`GET /editions en ${label} : la page se rend avec un sélecteur sans option, sans plantage`, async () => {
      registerEndpoint('/api/v1/editions', defineEventHandler((event) => {
        setResponseStatus(event, status)
        return body
      }))
      const wrapper = await mountPage()
      expect(wrapper.get('h1').text()).toBe('Plus')
      expect(wrapper.find('[data-cy="admin-more-edition-select"]').exists()).toBe(true)
      expect(wrapper.get('[data-cy="admin-more-logout"]').text()).toBe('Se déconnecter')
    })
  }
})
