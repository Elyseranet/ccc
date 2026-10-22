import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { API_ERROR_CODE } from '../../../src/enums/api-error-code.enum'
import { USER_ROLE } from '../../../src/enums/user.enum'
import { useLogout } from '../../../src/composables/useLogout'
import { ROUTES } from '../../../src/consts/routes.const'
import { FIXTURE_VARIANT } from '../../../src/enums/fixture-variant.enum'
import { AuthService } from '../../../src/services/auth.service'
import { useAuthStore } from '../../../src/stores/auth.store'
import { ApiRequestError } from '../../../src/utils/api-request-error.util'

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
  it('se déconnecte sur la fixture sans erreur', async () => {
    await expect(new AuthService().logout()).resolves.toBeUndefined()
  })

  it('rejette en 500 sur la variante error', async () => {
    await expect(new AuthService({ variant: FIXTURE_VARIANT.ERROR }).logout()).rejects.toMatchObject({ error: { statusCode: 500 } })
  })
})

describe('useLogout', () => {
  beforeEach(() => {
    useAuthStore(useNuxtApp().$pinia).clear()
    navigateToMock.mockReset()
  })

  it('vide la session puis renvoie vers l’accueil', async () => {
    const auth = useAuthStore(useNuxtApp().$pinia)
    auth.setSession({ role: USER_ROLE.ADMIN, initials: 'AD' })
    const { logout, failed } = await mountLogout()
    await logout()
    expect(auth.isAuthenticated).toBe(false)
    expect(auth.initials).toBeNull()
    expect(failed.value).toBe(false)
    expect(navigateToMock).toHaveBeenCalledWith(ROUTES.HOME)
  })

  it('traite un 401 comme un succès : la session serveur n’existe déjà plus', async () => {
    const auth = useAuthStore(useNuxtApp().$pinia)
    auth.setSession({ role: USER_ROLE.ADMIN, initials: 'AD' })
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
    auth.setSession({ role: USER_ROLE.ADMIN, initials: 'AD' })
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
    auth.setSession({ role: USER_ROLE.ADMIN, initials: 'AD' })
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
