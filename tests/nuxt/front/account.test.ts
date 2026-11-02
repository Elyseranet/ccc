import { mockNuxtImport, mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { defineEventHandler, getHeader, readBody, readMultipartFormData, setResponseStatus } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { RouterLink } from 'vue-router'
import InvitationState from '../../../src/components/account/InvitationState.vue'
import LoginForm from '../../../src/components/account/LoginForm.vue'
import ProfileForm from '../../../src/components/account/ProfileForm.vue'
import { useAuthStore } from '../../../src/composables/useAuthStore'
import { useAccountRules } from '../../../src/composables/useAccountRules'
import { useLogin } from '../../../src/composables/useLogin'
import { useProfile } from '../../../src/composables/useProfile'
import { useSessionGuard } from '../../../src/composables/useSessionGuard'
import { ACCOUNT_AVATAR_MAX_BYTES, ACCOUNT_BODY_MAX_BYTES } from '../../../src/consts/account.const'
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../../../src/consts/auth.const'
import { ROUTES } from '../../../src/consts/routes.const'
import { ACCOUNT_ERROR, INVITATION_STATE, PROFILE_FIELD } from '../../../src/enums/account.enum'
import { API_ERROR_CODE } from '../../../src/enums/api-error-code.enum'
import { USER_ROLE } from '../../../src/enums/user.enum'
import type { IMe } from '../../../src/interfaces/me.interface'
import { AuthService } from '../../../src/services/auth.service'
import { MeService } from '../../../src/services/me.service'
import { toAccountError } from '../../../src/utils/account-error.util'
import { ApiRequestError } from '../../../src/utils/api-request-error.util'
import { validateAvatarFile } from '../../../src/utils/avatar-file.util'
import { buildProfileChanges, maskEmail, missingProfileFields } from '../../../src/utils/profile-form.util'
import { buildMe, buildMeWithCompetitor } from '../../helpers/me'

const { navigateToMock } = vi.hoisted(() => ({ navigateToMock: vi.fn() }))
mockNuxtImport('navigateTo', () => navigateToMock)

const apiError = (statusCode: number, code: API_ERROR_CODE) => new ApiRequestError({ statusCode, code, message: 'x' })
const failWith = (event: Parameters<Parameters<typeof defineEventHandler>[0]>[0], statusCode: number, code: API_ERROR_CODE) => {
  setResponseStatus(event, statusCode)
  return { statusCode, code, message: 'x' }
}

/*********************************************************
 * Compte (F-10)
 *
 * @description
 * Contrat M2 du back : un corps JSON part avec `application/json` posé par `$fetch`, sous 16 Kio ; un avatar part en
 * `multipart/form-data` avec le `boundary` du navigateur, dans un seul champ `file`. Puis les causes d'échec traduites, les
 * changements de profil, le masquage de l'email et le comportement des formulaires.
 ********************************************************/
describe('services du compte : en-têtes et corps (M2, B-16)', () => {
  const me = buildMeWithCompetitor()

  it('POST /auth/login : application/json, corps de moins de 16 Kio', async () => {
    const seen = vi.fn()
    registerEndpoint('/api/v1/auth/login', { method: 'POST', handler: defineEventHandler(async (event) => {
      seen(getHeader(event, 'content-type'), JSON.stringify(await readBody(event)).length)
      return me
    }) })
    await new AuthService().login({ email: 'a@example.test', password: 'un-mot-de-passe-assez-long' })
    expect(seen.mock.calls[0]![0]).toMatch(/^application\/json/)
    expect(seen.mock.calls[0]![1]).toBeLessThan(ACCOUNT_BODY_MAX_BYTES)
  })

  it('POST /auth/invitation/{jeton} : application/json, jeton encodé dans l’URL', async () => {
    const seen = vi.fn()
    registerEndpoint('/api/v1/auth/invitation/abc-123', { method: 'POST', handler: defineEventHandler(async (event) => {
      seen(getHeader(event, 'content-type'), await readBody(event))
      return me
    }) })
    await new AuthService().acceptInvitation('abc-123', { password: 'un-mot-de-passe-assez-long', phone: '+33 6 00 00 00 00' })
    expect(seen.mock.calls[0]![0]).toMatch(/^application\/json/)
    expect(seen.mock.calls[0]![1]).toEqual({ password: 'un-mot-de-passe-assez-long', phone: '+33 6 00 00 00 00' })
  })

  it('PATCH /moi : application/json, uniquement les champs de la liste blanche envoyés', async () => {
    const seen = vi.fn()
    registerEndpoint('/api/v1/moi', { method: 'PATCH', handler: defineEventHandler(async (event) => {
      seen(getHeader(event, 'content-type'), await readBody(event))
      return me
    }) })
    await new MeService().updateProfile({ phone: '+33 6 11 11 11 11' })
    expect(seen.mock.calls[0]![0]).toMatch(/^application\/json/)
    expect(seen.mock.calls[0]![1]).toEqual({ phone: '+33 6 11 11 11 11' })
  })

  it('PUT /moi/avatar : multipart avec le boundary du navigateur, un seul champ `file`', async () => {
    const seen = vi.fn()
    registerEndpoint('/api/v1/moi/avatar', { method: 'PUT', handler: defineEventHandler(async (event) => {
      const parts = await readMultipartFormData(event)
      seen(getHeader(event, 'content-type'), parts?.map(part => part.name))
      return { avatarUrl: '/api/v1/competiteurs/x/avatar?v=abc' }
    }) })
    await new MeService().uploadAvatar(new File(['x'], 'avatar.png', { type: 'image/png' }))
    expect(seen.mock.calls[0]![0]).toMatch(/^multipart\/form-data; boundary=/)
    expect(seen.mock.calls[0]![1]).toEqual(['file'])
  })

  it('DELETE /moi/avatar : 204 sans corps', async () => {
    const handler = vi.fn((event: Parameters<Parameters<typeof defineEventHandler>[0]>[0]) => {
      setResponseStatus(event, 204)
      return null
    })
    registerEndpoint('/api/v1/moi/avatar', { method: 'DELETE', handler: defineEventHandler(handler) })
    await expect(new MeService().removeAvatar()).resolves.toBeUndefined()
    expect(handler).toHaveBeenCalledTimes(1)
  })
})

describe('toAccountError : une cause traduite par code d’erreur', () => {
  it.each([
    [401, API_ERROR_CODE.INVALID_CREDENTIALS, ACCOUNT_ERROR.INVALID_CREDENTIALS],
    [401, API_ERROR_CODE.INVALID_CURRENT_PASSWORD, ACCOUNT_ERROR.INVALID_CURRENT_PASSWORD],
    [401, API_ERROR_CODE.UNAUTHORIZED, ACCOUNT_ERROR.SESSION_EXPIRED],
    [403, API_ERROR_CODE.FORBIDDEN, ACCOUNT_ERROR.FORBIDDEN],
    [404, API_ERROR_CODE.NOT_FOUND, ACCOUNT_ERROR.LINK_UNKNOWN],
    [410, API_ERROR_CODE.GONE, ACCOUNT_ERROR.LINK_GONE],
    [429, API_ERROR_CODE.RATE_LIMITED, ACCOUNT_ERROR.RATE_LIMITED],
    [400, API_ERROR_CODE.VALIDATION_FAILED, ACCOUNT_ERROR.VALIDATION_FAILED],
    [400, API_ERROR_CODE.BAD_REQUEST, ACCOUNT_ERROR.BODY_REJECTED],
    [413, API_ERROR_CODE.PAYLOAD_TOO_LARGE, ACCOUNT_ERROR.BODY_REJECTED],
    [413, API_ERROR_CODE.AVATAR_TOO_LARGE, ACCOUNT_ERROR.AVATAR_TOO_LARGE],
    [415, API_ERROR_CODE.AVATAR_UNSUPPORTED_TYPE, ACCOUNT_ERROR.AVATAR_UNSUPPORTED_TYPE],
    [422, API_ERROR_CODE.AVATAR_UNREADABLE, ACCOUNT_ERROR.AVATAR_UNREADABLE],
    [503, API_ERROR_CODE.SERVICE_BUSY, ACCOUNT_ERROR.BUSY],
    [500, API_ERROR_CODE.INTERNAL_ERROR, ACCOUNT_ERROR.UNKNOWN]
  ])('%i %s -> %s', (status, code, expected) => {
    expect(toAccountError(apiError(status, code))).toBe(expected)
  })

  it('un échec sans réponse (réseau coupé, délai) est « hors ligne »', () => {
    expect(toAccountError(new ApiRequestError({ statusCode: 0, code: API_ERROR_CODE.INTERNAL_ERROR, message: 'x' }, true))).toBe(ACCOUNT_ERROR.OFFLINE)
  })
})

describe('profil : changements, email masqué, avatar', () => {
  const me = buildMeWithCompetitor()
  const withPhone = (phone: string | null): IMe => ({ ...me, competitor: { ...me.competitor!, phone } })

  it('rien à envoyer quand rien n’a changé', () => {
    expect(buildProfileChanges(withPhone('0600'), { phone: '0600', currentPassword: '', newPassword: '' })).toBeNull()
  })

  it('un téléphone vidé devient null, un téléphone inchangé n’est pas renvoyé', () => {
    expect(buildProfileChanges(withPhone('0600'), { phone: '  ', currentPassword: '', newPassword: '' })).toEqual({ phone: null })
    expect(buildProfileChanges(withPhone(null), { phone: '', currentPassword: '', newPassword: '' })).toBeNull()
  })

  it('le nouveau mot de passe part avec le mot de passe actuel, jamais seul', () => {
    expect(buildProfileChanges(withPhone('0600'), { phone: '0600', currentPassword: 'actuel', newPassword: 'nouveau' })).toEqual({ currentPassword: 'actuel', newPassword: 'nouveau' })
  })

  it('un compte sans fiche de joueur ne peut changer que son mot de passe', () => {
    const admin = buildMe(USER_ROLE.ADMIN)
    expect(buildProfileChanges(admin, { phone: '0600', currentPassword: '', newPassword: '' })).toBeNull()
    expect(buildProfileChanges(admin, { phone: '0600', currentPassword: 'a', newPassword: 'b' })).toEqual({ currentPassword: 'a', newPassword: 'b' })
  })

  it('l’email est masqué : première lettre et extension', () => {
    expect(maskEmail('sam@exemple.fr')).toBe('s•••••@•••••.fr')
  })

  it('un avatar de plus de 2 Mo ou hors JPEG, PNG, WebP est refusé avant l’envoi', () => {
    expect(validateAvatarFile({ size: ACCOUNT_AVATAR_MAX_BYTES + 1, type: 'image/png' })).toBe(ACCOUNT_ERROR.AVATAR_TOO_LARGE)
    expect(validateAvatarFile({ size: 10, type: 'image/gif' })).toBe(ACCOUNT_ERROR.AVATAR_UNSUPPORTED_TYPE)
    expect(validateAvatarFile({ size: ACCOUNT_AVATAR_MAX_BYTES, type: 'image/webp' })).toBeNull()
  })
})

describe('useLogin', () => {
  const mountLogin = async () => {
    let api!: ReturnType<typeof useLogin>
    await mountSuspended(defineComponent({ setup () {
      api = useLogin()
      return () => null
    } }))
    return api
  }

  beforeEach(() => {
    useAuthStore(useNuxtApp().$pinia).clear()
    navigateToMock.mockReset()
  })

  it('un participant arrive sur son profil, le store porte l’IMe reçu', async () => {
    registerEndpoint('/api/v1/auth/login', { method: 'POST', handler: defineEventHandler(() => buildMeWithCompetitor()) })
    const { login, error } = await mountLogin()
    await login({ email: 'a@example.test', password: 'x' })
    expect(error.value).toBeNull()
    expect(useAuthStore(useNuxtApp().$pinia).isAuthenticated).toBe(true)
    expect(navigateToMock).toHaveBeenCalledWith(ROUTES.PROFILE)
  })

  it('un administrateur arrive sur son espace', async () => {
    registerEndpoint('/api/v1/auth/login', { method: 'POST', handler: defineEventHandler(() => buildMe(USER_ROLE.ADMIN)) })
    const { login } = await mountLogin()
    await login({ email: 'a@example.test', password: 'x' })
    expect(navigateToMock).toHaveBeenCalledWith(ROUTES.ADMIN)
  })

  it('des identifiants invalides laissent la session vide, sans navigation', async () => {
    registerEndpoint('/api/v1/auth/login', { method: 'POST', handler: defineEventHandler(event => failWith(event, 401, API_ERROR_CODE.INVALID_CREDENTIALS)) })
    const { login, error, pending } = await mountLogin()
    await login({ email: 'a@example.test', password: 'x' })
    expect(error.value).toBe(ACCOUNT_ERROR.INVALID_CREDENTIALS)
    expect(pending.value).toBe(false)
    expect(useAuthStore(useNuxtApp().$pinia).isAuthenticated).toBe(false)
    expect(navigateToMock).not.toHaveBeenCalled()
  })
})

describe('useProfile', () => {
  const mountProfile = async () => {
    let api!: ReturnType<typeof useProfile>
    await mountSuspended(defineComponent({ setup () {
      api = useProfile()
      return () => null
    } }))
    return api
  }

  beforeEach(() => {
    useAuthStore(useNuxtApp().$pinia).setMe(buildMeWithCompetitor())
  })

  it('enregistre le téléphone, remplace le compte par la réponse du serveur et annonce l’enregistrement', async () => {
    const updated = buildMeWithCompetitor()
    updated.competitor!.phone = '+33 6 11 11 11 11'
    registerEndpoint('/api/v1/moi', { method: 'PATCH', handler: defineEventHandler(() => updated) })
    const profile = await mountProfile()
    expect(await profile.save({ phone: '+33 6 11 11 11 11', currentPassword: '', newPassword: '' })).toBe(true)
    expect(profile.saved.value).toBe(true)
    expect(useAuthStore(useNuxtApp().$pinia).me?.competitor?.phone).toBe('+33 6 11 11 11 11')
  })

  it('un mot de passe actuel refusé reste une erreur, sans annonce d’enregistrement', async () => {
    registerEndpoint('/api/v1/moi', { method: 'PATCH', handler: defineEventHandler(event => failWith(event, 401, API_ERROR_CODE.INVALID_CURRENT_PASSWORD)) })
    const profile = await mountProfile()
    expect(await profile.save({ phone: '', currentPassword: 'faux', newPassword: 'un-nouveau-mot-de-passe' })).toBe(false)
    expect(profile.error.value).toBe(ACCOUNT_ERROR.INVALID_CURRENT_PASSWORD)
    expect(profile.saved.value).toBe(false)
  })

  it('sans changement, aucune requête ne part et l’enregistrement est annoncé', async () => {
    const handler = vi.fn(() => buildMeWithCompetitor())
    registerEndpoint('/api/v1/moi', { method: 'PATCH', handler: defineEventHandler(handler) })
    const profile = await mountProfile()
    expect(await profile.save({ phone: '', currentPassword: '', newPassword: '' })).toBe(true)
    expect(handler).not.toHaveBeenCalled()
    expect(profile.saved.value).toBe(true)
  })

  it('un avatar trop gros est refusé sans requête ; posé, il met à jour le compte', async () => {
    const put = vi.fn()
    registerEndpoint('/api/v1/moi/avatar', { method: 'PUT', handler: defineEventHandler(() => {
      put()
      return { avatarUrl: '/x' }
    }) })
    const refreshed = buildMeWithCompetitor()
    refreshed.competitor!.avatarUrl = '/api/v1/competiteurs/competitor-test/avatar?v=abc'
    registerEndpoint('/api/v1/moi', { method: 'GET', handler: defineEventHandler(() => refreshed) })
    const profile = await mountProfile()
    expect(await profile.uploadAvatar(new File([new Uint8Array(ACCOUNT_AVATAR_MAX_BYTES + 1)], 'gros.png', { type: 'image/png' }))).toBe(false)
    expect(profile.avatarError.value).toBe(ACCOUNT_ERROR.AVATAR_TOO_LARGE)
    expect(put).not.toHaveBeenCalled()
    expect(await profile.uploadAvatar(new File(['x'], 'ok.png', { type: 'image/png' }))).toBe(true)
    expect(put).toHaveBeenCalledTimes(1)
    expect(useAuthStore(useNuxtApp().$pinia).me?.competitor?.avatarUrl).toContain('?v=abc')
  })
})

describe('formulaires du compte', () => {
  const withRouterLink = { global: { components: { RouterLink } } }

  it('la connexion refuse un email invalide et un mot de passe vide, sans émettre', async () => {
    const wrapper = await mountSuspended(LoginForm, withRouterLink)
    await wrapper.get('#login-email').setValue('pas-un-email')
    await wrapper.get('[data-cy="login-form"]').trigger('submit')
    await flushPromises()
    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.text()).toContain('adresse email valide')
  })

  it('la connexion émet les identifiants saisis, l’email sans espaces autour', async () => {
    const wrapper = await mountSuspended(LoginForm, withRouterLink)
    await wrapper.get('#login-email').setValue('  a@example.test ')
    await wrapper.get('#login-password').setValue('un-mot-de-passe')
    await wrapper.get('[data-cy="login-form"]').trigger('submit')
    await flushPromises()
    expect(wrapper.emitted('submit')?.[0]).toEqual([{ email: 'a@example.test', password: 'un-mot-de-passe' }])
  })

  it('l’erreur de connexion est annoncée dans une alerte, avec le message de la cause', async () => {
    const wrapper = await mountSuspended(LoginForm, { ...withRouterLink, props: { error: ACCOUNT_ERROR.INVALID_CREDENTIALS } })
    const alert = wrapper.get('[data-cy="login-error"]')
    expect(alert.attributes('role')).toBe('alert')
    expect(alert.text()).toContain('Email ou mot de passe incorrect')
  })

  it('le profil d’un compte sans fiche de joueur n’offre que le mot de passe', async () => {
    const wrapper = await mountSuspended(ProfileForm, { ...withRouterLink, props: { me: buildMe(USER_ROLE.ADMIN) } })
    expect(wrapper.find('[data-cy="avatar-field"]').exists()).toBe(false)
    expect(wrapper.find('#profile-phone').exists()).toBe(false)
    expect(wrapper.find('[data-cy="profile-public"]').exists()).toBe(false)
    expect(wrapper.find('#profile-new-password').exists()).toBe(true)
    expect(wrapper.get('[data-cy="profile-no-competitor"]').text()).toContain('Compte sans fiche de joueur')
  })

  it('le profil montre l’identité en lecture seule, l’email masqué et le lien vers la fiche publique', async () => {
    const wrapper = await mountSuspended(ProfileForm, { ...withRouterLink, props: { me: buildMeWithCompetitor() } })
    const readonly = wrapper.get('[data-cy="profile-readonly"]').text()
    expect(readonly).toContain('Sam Dupont')
    expect(readonly).toContain('c•••••@•••••.test')
    expect(readonly).not.toContain('compte@example.test')
    expect(wrapper.get('[data-cy="profile-public"]').attributes('href')).toBe('/joueurs/competitor-test')
  })

  it('un mot de passe actuel refusé s’affiche sur son champ, sans alerte, sans vider les autres champs', async () => {
    const wrapper = await mountSuspended(ProfileForm, { ...withRouterLink, props: { me: buildMeWithCompetitor(), error: ACCOUNT_ERROR.INVALID_CURRENT_PASSWORD } })
    await wrapper.get('#profile-new-password').setValue('un-nouveau-mot-de-passe')
    expect(wrapper.find('[data-cy="profile-error"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Le mot de passe actuel est incorrect')
    expect((wrapper.get('#profile-new-password').element as HTMLInputElement).value).toBe('un-nouveau-mot-de-passe')
  })

  it('le profil refuse une confirmation différente du nouveau mot de passe, sans émettre', async () => {
    const wrapper = await mountSuspended(ProfileForm, { ...withRouterLink, props: { me: buildMeWithCompetitor() } })
    await wrapper.get('#profile-current-password').setValue('actuel')
    await wrapper.get('#profile-new-password').setValue('un-nouveau-mot-de-passe')
    await wrapper.get('#profile-confirm-password').setValue('autre-chose')
    await wrapper.get('[data-cy="profile-form"]').trigger('submit')
    await flushPromises()
    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.text()).toContain('Les deux mots de passe sont différents')
  })

  it('le bouton de déconnexion du profil est hors du formulaire et émet logout', async () => {
    const wrapper = await mountSuspended(ProfileForm, { ...withRouterLink, props: { me: buildMeWithCompetitor() } })
    const button = wrapper.get('[data-cy="profile-logout"]')
    expect(wrapper.get('[data-cy="profile-form"]').element.contains(button.element)).toBe(false)
    await button.trigger('click')
    expect(wrapper.emitted('logout')).toHaveLength(1)
  })

  it.each([
    [INVITATION_STATE.GONE, 'Lien expiré ou déjà utilisé', 'invitation-back'],
    [INVITATION_STATE.UNKNOWN, 'Lien d’invitation inconnu', 'invitation-back'],
    [INVITATION_STATE.FAILED, 'Impossible de vérifier l’invitation', 'invitation-retry']
  ])('l’invitation %s affiche « %s » et son action', async (state, title, action) => {
    const wrapper = await mountSuspended(InvitationState, { ...withRouterLink, props: { state } })
    expect(wrapper.text()).toContain(title)
    expect(wrapper.find(`[data-cy="${action}"]`).exists()).toBe(true)
  })

  it('un compte activé dont l’avatar a échoué mène au profil et dit pourquoi', async () => {
    const wrapper = await mountSuspended(InvitationState, { ...withRouterLink, props: { state: INVITATION_STATE.READY, activated: true, avatarError: ACCOUNT_ERROR.AVATAR_UNREADABLE } })
    expect(wrapper.text()).toContain('Compte activé')
    expect(wrapper.get('[data-cy="invitation-avatar-error"]').text()).toContain('illisible')
    expect(wrapper.get('[data-cy="invitation-profile"]').attributes('href')).toBe(ROUTES.PROFILE)
  })
})

describe('profil incomplet : ce qui manque, lu sur l’IMe (décision utilisateur)', () => {
  const complete = (): IMe => {
    const me = buildMeWithCompetitor()
    me.competitor!.phone = '+33 6 00 00 00 00'
    me.competitor!.avatarUrl = '/api/v1/competiteurs/competitor-test/avatar?v=abc'
    return me
  }

  it('un profil rempli n’a rien qui manque ; un compte sans fiche de joueur non plus', () => {
    expect(missingProfileFields(complete())).toEqual([])
    expect(missingProfileFields(buildMe(USER_ROLE.ADMIN))).toEqual([])
  })

  it('chaque information facultative vide est citée : pseudo, téléphone, photo', () => {
    const me = buildMeWithCompetitor()
    me.competitor!.nickname = null
    expect(missingProfileFields(me)).toEqual([PROFILE_FIELD.NICKNAME, PROFILE_FIELD.PHONE, PROFILE_FIELD.AVATAR])
    expect(missingProfileFields({ ...me, competitor: { ...me.competitor!, nickname: '  ', phone: '' } })).toContain(PROFILE_FIELD.PHONE)
  })

  it('la bannière apparaît, non bloquante, tant qu’il manque quelque chose, et disparaît quand tout est renseigné', async () => {
    const withRouterLink = { global: { components: { RouterLink } } }
    const incomplete = await mountSuspended(ProfileForm, { ...withRouterLink, props: { me: buildMeWithCompetitor() } })
    expect(incomplete.get('[data-cy="profile-incomplete"]').text()).toContain('Profil incomplet : il manque téléphone, photo')
    expect(incomplete.get('[data-cy="profile-submit"]').attributes('disabled')).toBeUndefined()
    const full = await mountSuspended(ProfileForm, { ...withRouterLink, props: { me: complete() } })
    expect(full.find('[data-cy="profile-incomplete"]').exists()).toBe(false)
  })
})

describe('useSessionGuard : une session expirée remet l’état à zéro (revue de sécurité M2)', () => {
  const mountGuard = async () => {
    let api!: ReturnType<typeof useSessionGuard>
    await mountSuspended(defineComponent({ setup () {
      api = useSessionGuard()
      return () => null
    } }))
    return api
  }

  beforeEach(() => {
    useAuthStore(useNuxtApp().$pinia).setMe(buildMeWithCompetitor())
    navigateToMock.mockReset()
  })

  it('un 401 UNAUTHORIZED vide le compte et renvoie vers /connexion', async () => {
    const guard = await mountGuard()
    expect(guard.expireOn(apiError(401, API_ERROR_CODE.UNAUTHORIZED))).toBe(true)
    expect(useAuthStore(useNuxtApp().$pinia).isAuthenticated).toBe(false)
    expect(navigateToMock).toHaveBeenCalledWith(ROUTES.LOGIN)
  })

  it.each([
    [401, API_ERROR_CODE.INVALID_CREDENTIALS],
    [401, API_ERROR_CODE.INVALID_CURRENT_PASSWORD],
    [403, API_ERROR_CODE.FORBIDDEN],
    [500, API_ERROR_CODE.INTERNAL_ERROR]
  ])('%i %s n’est pas une session expirée', async (status, code) => {
    const guard = await mountGuard()
    expect(guard.expireOn(apiError(status, code))).toBe(false)
    expect(useAuthStore(useNuxtApp().$pinia).isAuthenticated).toBe(true)
    expect(navigateToMock).not.toHaveBeenCalled()
  })

  it('useProfile : une écriture en 401 UNAUTHORIZED ne laisse pas d’erreur affichée, la session est vidée', async () => {
    registerEndpoint('/api/v1/moi', { method: 'PATCH', handler: defineEventHandler(event => failWith(event, 401, API_ERROR_CODE.UNAUTHORIZED)) })
    let api!: ReturnType<typeof useProfile>
    await mountSuspended(defineComponent({ setup () {
      api = useProfile()
      return () => null
    } }))
    expect(await api.save({ phone: '+33 6 11 11 11 11', currentPassword: '', newPassword: '' })).toBe(false)
    expect(api.error.value).toBeNull()
    expect(useAuthStore(useNuxtApp().$pinia).isAuthenticated).toBe(false)
    expect(navigateToMock).toHaveBeenCalledWith(ROUTES.LOGIN)
  })
})

describe('règles de mot de passe : 15 caractères au moins, 128 au plus (B-08, validées côté navigateur par `rules`)', () => {
  const rules = useAccountRules()

  it('refuse sous le minimum avec un message qui dit le minimum, accepte au minimum et au maximum', () => {
    expect(rules.passwordLength('x'.repeat(PASSWORD_MIN_LENGTH - 1))).toContain(String(PASSWORD_MIN_LENGTH))
    expect(rules.passwordLength('x'.repeat(PASSWORD_MIN_LENGTH))).toBe(true)
    expect(rules.passwordLength('x'.repeat(PASSWORD_MAX_LENGTH))).toBe(true)
    expect(rules.passwordLength('x'.repeat(PASSWORD_MAX_LENGTH + 1))).toContain(String(PASSWORD_MAX_LENGTH))
  })

  it('un champ vide n’est refusé que s’il est obligatoire : le mot de passe du profil reste facultatif', () => {
    expect(rules.passwordLength('')).toBe(true)
    expect(rules.required('')).not.toBe(true)
  })

  it('la confirmation doit être identique, et le mot de passe actuel n’est exigé qu’avec un nouveau mot de passe', () => {
    expect(rules.sameAs(() => 'abc')('abd')).not.toBe(true)
    expect(rules.sameAs(() => 'abc')('abc')).toBe(true)
    expect(rules.currentPasswordRequired(() => 'nouveau')('')).not.toBe(true)
    expect(rules.currentPasswordRequired(() => '')('')).toBe(true)
  })

  it('un mot de passe de 14 caractères refusé par le serveur (400) est traduit en erreur de validation', async () => {
    registerEndpoint('/api/v1/auth/invitation/jeton-court', { method: 'POST', handler: defineEventHandler(event => failWith(event, 400, API_ERROR_CODE.VALIDATION_FAILED)) })
    await expect(new AuthService().acceptInvitation('jeton-court', { password: 'x'.repeat(PASSWORD_MIN_LENGTH - 1) })).rejects.toMatchObject({ error: { statusCode: 400 } })
    expect(toAccountError(apiError(400, API_ERROR_CODE.VALIDATION_FAILED))).toBe(ACCOUNT_ERROR.VALIDATION_FAILED)
  })
})
