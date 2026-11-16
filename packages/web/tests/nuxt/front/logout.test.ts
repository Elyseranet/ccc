import { mockNuxtImport, mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { defineEventHandler, setResponseStatus } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { API_ERROR_CODE } from '../../../src/enums/api-error-code.enum'
import { USER_ROLE } from '../../../src/enums/user.enum'
import { useLogout } from '../../../src/composables/useLogout'
import { LOGGED_OUT_STATE_KEY } from '../../../src/consts/auth-session.const'
import { ROUTES } from '../../../src/consts/routes.const'
import { AuthService } from '../../../src/services/auth.service'
import { useAuthStore } from '../../../src/composables/useAuthStore'
import { ApiRequestError } from '../../../src/utils/api-request-error.util'
import { buildMe } from '../../helpers/me'

const { navigateToMock } = vi.hoisted(() => ({ navigateToMock: vi.fn() }))
mockNuxtImport('navigateTo', () => navigateToMock)

const mountLogout = async () => {
  let api!: ReturnType<typeof useLogout>
  await mountSuspended(defineComponent({
    setup () {
      api = useLogout()
      return () => null
    }
  }))
  return api
}

describe('AuthService', () => {
  it('appelle POST /api/v1/auth/logout', async () => {
    const handler = vi.fn(() => null)
    registerEndpoint('/api/v1/auth/logout', { method: 'POST', handler: defineEventHandler(handler) })
    await expect(new AuthService().logout()).resolves.toBeUndefined()
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('rejette en ApiRequestError 500 quand l’API échoue', async () => {
    registerEndpoint('/api/v1/auth/logout', { method: 'POST', handler: defineEventHandler((event) => {
      setResponseStatus(event, 500)
      return { statusCode: 500, code: API_ERROR_CODE.INTERNAL_ERROR, message: 'boom' }
    }) })
    await expect(new AuthService().logout()).rejects.toMatchObject({ error: { statusCode: 500 } })
  })
})

describe('useLogout', () => {
  beforeEach(() => {
    useAuthStore(useNuxtApp().$pinia).clear()
    navigateToMock.mockReset()
    registerEndpoint('/api/v1/auth/logout', { method: 'POST', handler: defineEventHandler(() => null) })
  })

  it('annonce la déconnexion sur l’accueil, quel que soit le rôle (état partagé lu par le layout)', async () => {
    const auth = useAuthStore(useNuxtApp().$pinia)
    for (const role of [USER_ROLE.ADMIN, USER_ROLE.PARTICIPANT]) {
      useState<boolean>(LOGGED_OUT_STATE_KEY).value = false
      auth.setMe(buildMe(role))
      const { logout } = await mountLogout()
      await logout()
      expect(useState<boolean>(LOGGED_OUT_STATE_KEY).value).toBe(true)
      expect(navigateToMock).toHaveBeenLastCalledWith(ROUTES.HOME)
    }
  })

  it('un échec garde la session et n’annonce aucune déconnexion', async () => {
    useState<boolean>(LOGGED_OUT_STATE_KEY).value = false
    registerEndpoint('/api/v1/auth/logout', { method: 'POST', handler: defineEventHandler((event) => {
      setResponseStatus(event, 500)
      return { statusCode: 500, code: API_ERROR_CODE.INTERNAL_ERROR, message: 'x' }
    }) })
    useAuthStore(useNuxtApp().$pinia).setMe(buildMe(USER_ROLE.ADMIN))
    const { logout, failed } = await mountLogout()
    await logout()
    expect(failed.value).toBe(true)
    expect(useState<boolean>(LOGGED_OUT_STATE_KEY).value).toBe(false)
  })

  it('vide la session puis renvoie vers l’accueil', async () => {
    const auth = useAuthStore(useNuxtApp().$pinia)
    auth.setMe(buildMe(USER_ROLE.ADMIN))
    const { logout, failed } = await mountLogout()
    await logout()
    expect(auth.isAuthenticated).toBe(false)
    expect(auth.initials).toBeNull()
    expect(failed.value).toBe(false)
    expect(navigateToMock).toHaveBeenCalledWith(ROUTES.HOME)
  })

  it('traite un 401 comme un succès : la session serveur n’existe déjà plus', async () => {
    const auth = useAuthStore(useNuxtApp().$pinia)
    auth.setMe(buildMe(USER_ROLE.ADMIN))
    const spy = vi.spyOn(AuthService.prototype, 'logout').mockRejectedValueOnce(
      new ApiRequestError({ statusCode: 401, code: API_ERROR_CODE.UNAUTHORIZED, message: 'Unauthorized' })
    )
    const { logout, failed } = await mountLogout()
    await logout()
    expect(failed.value).toBe(false)
    expect(auth.isAuthenticated).toBe(false)
    expect(navigateToMock).toHaveBeenCalledWith(ROUTES.HOME)
    spy.mockRestore()
  })

  it('garde la session sur un 5xx', async () => {
    const auth = useAuthStore(useNuxtApp().$pinia)
    auth.setMe(buildMe(USER_ROLE.ADMIN))
    const spy = vi.spyOn(AuthService.prototype, 'logout').mockRejectedValueOnce(
      new ApiRequestError({ statusCode: 500, code: API_ERROR_CODE.INTERNAL_ERROR, message: 'boom' })
    )
    const { logout, failed } = await mountLogout()
    await logout()
    expect(failed.value).toBe(true)
    expect(auth.isAdmin).toBe(true)
    expect(navigateToMock).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('garde la session et signale l’échec quand l’appel échoue', async () => {
    const auth = useAuthStore(useNuxtApp().$pinia)
    auth.setMe(buildMe(USER_ROLE.ADMIN))
    const spy = vi.spyOn(AuthService.prototype, 'logout').mockRejectedValueOnce(new Error('boom'))
    const { logout, failed, pending } = await mountLogout()
    await logout()
    expect(failed.value).toBe(true)
    expect(pending.value).toBe(false)
    expect(auth.isAdmin).toBe(true)
    expect(navigateToMock).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
