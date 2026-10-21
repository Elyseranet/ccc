import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RouterLink } from 'vue-router'
import { API_ERROR_CODE } from '#shared/enums/api-error-code.enum'
import { USER_ROLE } from '#shared/enums/user.enum'
import { ADMIN_MORE_ITEMS } from '~/consts/admin-more.const'
import { ROUTES } from '~/consts/routes.const'
import AdminMorePage from '~/pages/admin/plus.vue'
import { AuthService } from '~/services/auth.service'
import { useAuthStore } from '~/stores/auth.store'
import { ApiRequestError } from '~/utils/api-request-error.util'

const mountPage = (query = '') => mountSuspended(AdminMorePage, { route: `${ROUTES.ADMIN_MORE}${query}`, global: { components: { RouterLink } } })

describe('page « Plus » de l’admin (F-12)', () => {
  it('propose exactement Participants, site public et Mon compte, sans rien de ce que masque FA-09', () => {
    expect(ADMIN_MORE_ITEMS.map(item => item.to)).toEqual([ROUTES.ADMIN_PARTICIPANTS, ROUTES.HOME, ROUTES.PROFILE])
  })

  it('rend un h1 unique, trois entrées traduites, le sélecteur d’édition et la déconnexion', async () => {
    const wrapper = await mountPage()
    expect(wrapper.findAll('h1')).toHaveLength(1)
    expect(wrapper.get('h1').text()).toBe('Plus')
    const nav = wrapper.get('[data-cy="admin-more-nav"]')
    expect(nav.attributes('aria-label')).toBe('Plus d’options')
    expect(nav.text()).toContain('Participants')
    expect(nav.text()).toContain('Voir le site public')
    expect(nav.text()).toContain('Mon compte')
    expect(nav.findAll('a')).toHaveLength(3)
    expect(wrapper.find('[data-cy="admin-more-edition-select"]').exists()).toBe(true)
    expect(wrapper.get('[data-cy="admin-more-logout"]').text()).toBe('Se déconnecter')
  })
})

describe('états dégradés de la page « Plus » (F-12)', () => {
  beforeEach(() => {
    useAuthStore(useNuxtApp().$pinia).setSession({ role: USER_ROLE.ADMIN, initials: 'AD' })
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

  for (const variant of ['empty', 'error', 'rate_limited']) {
    it(`variante ${variant} : la page se rend avec un sélecteur sans option, sans plantage`, async () => {
      const wrapper = await mountPage(`?fixture=${variant}`)
      expect(wrapper.get('h1').text()).toBe('Plus')
      expect(wrapper.find('[data-cy="admin-more-edition-select"]').exists()).toBe(true)
      expect(wrapper.get('[data-cy="admin-more-logout"]').text()).toBe('Se déconnecter')
    })
  }
})
