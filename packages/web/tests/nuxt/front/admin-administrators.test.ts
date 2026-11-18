import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { useAdminAdministrators } from '../../../src/composables/useAdminAdministrators'
import { ADMIN_REVOKE_CASE } from '../../../src/enums/administrator.enum'
import { API_ERROR_CODE } from '../../../src/enums/api-error-code.enum'
import { FEEDBACK_STATUS } from '../../../src/enums/feedback.enum'
import { ACCOUNT_STATE, USER_STATUS } from '../../../src/enums/user.enum'
import type { IAdminAccount } from '../../../src/interfaces/administrator.interface'
import { AdministratorService } from '../../../src/services/administrator.service'
import { toAdministratorAvatarName, toAdministratorFailure, toAdministratorRows, toInviteFeedback, toRevokeCase } from '../../../src/utils/admin-administrators.util'
import { ApiRequestError } from '../../../src/utils/api-request-error.util'
import AdministratorFixDialog from '~/components/admin/administrators/AdministratorFixDialog.vue'
import AdministratorInviteCard from '~/components/admin/administrators/AdministratorInviteCard.vue'
import AdministratorPromoteDialog from '~/components/admin/administrators/AdministratorPromoteDialog.vue'
import AdministratorList from '~/components/admin/administrators/AdministratorList.vue'

/*********************************************************
 * F-68 : écran « Administrateurs » (inviter, promouvoir, corriger, renvoyer, retirer)
 *
 * @description
 * Fonctions pures, composable et composants contre des routes simulées (`registerEndpoint`) : les vraies routes `/admin/administrateurs`
 * sont livrées par B-31 (`pendingTicket`). Les parcours sur la vraie base sont dans `tests/e2e/writes/F-68.spec.ts` (en attente de B-31).
 ********************************************************/
const BASE = '/api/v1/admin/administrateurs'
const apiError = (statusCode: number, code: API_ERROR_CODE) => ({ statusCode, code, message: code })

const account = (patch: Partial<IAdminAccount>): IAdminAccount => ({
  id: 'id-1',
  email: 'lou.bernard@exemple.fr',
  status: USER_STATUS.ACTIVE,
  invitationExpiresAt: null,
  invitationExpired: false,
  competitor: { id: 'c1', displayName: 'Lou Bernard' },
  lastLoginAt: null,
  createdAt: '2026-10-30T14:00:00.000Z',
  isSelf: false,
  ...patch
})
const SELF = account({ id: 'self', isSelf: true })
const ACTIVE_NO_FILE = account({ id: 'sam', email: 'sam.dupont@exemple.fr', competitor: null })
const INVITED = account({ id: 'maya', email: 'maya.bonnet@exemple.fr', status: USER_STATUS.INVITED, invitationExpiresAt: '2026-11-25T10:00:00.000Z', competitor: null })
const EXPIRED = account({ id: 'anna', email: 'anna.chevalier@exemple.fr', status: USER_STATUS.INVITED, invitationExpiresAt: '2026-11-10T10:00:00.000Z', invitationExpired: true, competitor: null })

const mountComposable = async () => {
  clearNuxtData()
  let api!: ReturnType<typeof useAdminAdministrators>
  await mountSuspended(defineComponent({
    setup () {
      api = useAdminAdministrators()
      return () => null
    }
  }))
  return api
}
const reply = (method: 'GET' | 'POST' | 'PATCH' | 'DELETE', path: string, body: unknown, status = 200) => registerEndpoint(path, { method, handler: defineEventHandler((event) => {
  setResponseStatus(event, status)
  return body
}) })

describe('lignes de la table', () => {
  const rows = toAdministratorRows([SELF, ACTIVE_NO_FILE, INVITED, EXPIRED])

  it('état du compte, « Vous », phrase sous l’email', () => {
    expect(rows.map(row => row.state)).toEqual([ACCOUNT_STATE.ACTIVE, ACCOUNT_STATE.ACTIVE, ACCOUNT_STATE.INVITED, ACCOUNT_STATE.INVITATION_EXPIRED])
    expect(rows.map(row => row.isSelf)).toEqual([true, false, false, false])
    expect(rows[0]?.detail).toMatchObject({ key: 'admin.administrators.detail_competitor', params: { name: 'Lou Bernard' } })
    expect(rows[1]?.detail.key).toBe('admin.administrators.detail_no_competitor')
    expect(rows[2]?.detail).toMatchObject({ key: 'admin.administrators.detail_valid_until', params: { date: '25 novembre 2026' } })
    expect(rows[3]?.detail).toMatchObject({ key: 'admin.administrators.detail_expired', params: { date: '10 novembre 2026' } })
  })

  it('« Renvoyer » et « Corriger » tant que le compte n’est pas activé (comme F-62)', () => {
    expect(rows.map(row => row.canResend)).toEqual([false, false, true, true])
    expect(rows.map(row => row.canFix)).toEqual([false, false, true, true])
  })

  it('le dernier administrateur actif n’est pas retirable', () => {
    expect(rows.every(row => !row.lastActive)).toBe(true)
    expect(toAdministratorRows([ACTIVE_NO_FILE, INVITED])[0]?.lastActive).toBe(true)
  })

  it('initiales : la fiche, sinon les mots de l’email', () => {
    expect(toAdministratorAvatarName(INVITED)).toBe('maya bonnet')
    expect(toAdministratorAvatarName(SELF)).toBe('Lou Bernard')
  })

  it('cas de retrait : actif avec ou sans fiche, invité avec ou sans fiche', () => {
    expect(toRevokeCase(SELF)).toBe(ADMIN_REVOKE_CASE.ACTIVE_WITH_COMPETITOR)
    expect(toRevokeCase(ACTIVE_NO_FILE)).toBe(ADMIN_REVOKE_CASE.ACTIVE_WITHOUT_COMPETITOR)
    expect(toRevokeCase(INVITED)).toBe(ADMIN_REVOKE_CASE.INVITED_WITHOUT_COMPETITOR)
    expect(toRevokeCase(account({ status: USER_STATUS.INVITED }))).toBe(ADMIN_REVOKE_CASE.INVITED_WITH_COMPETITOR)
  })
})

describe('refus et retours', () => {
  it('traduit les 409 de B-31', () => {
    expect(toAdministratorFailure(new ApiRequestError(apiError(409, API_ERROR_CODE.ALREADY_ADMIN))).text.key).toBe('admin.administrators.error_already_admin_text')
    expect(toAdministratorFailure(new ApiRequestError(apiError(409, API_ERROR_CODE.LAST_ADMIN))).text.key).toBe('admin.administrators.error_last_admin_text')
    expect(toAdministratorFailure(new ApiRequestError(apiError(409, API_ERROR_CODE.CANNOT_REVOKE_SELF))).text.key).toBe('admin.administrators.error_self_text')
    expect(toAdministratorFailure(new ApiRequestError(apiError(404, API_ERROR_CODE.NOT_FOUND))).text.key).toBe('admin.administrators.error_not_found_text')
    expect(toAdministratorFailure(new ApiRequestError(apiError(409, API_ERROR_CODE.EMAIL_ALREADY_USED))).title.key).toBe('admin.account.error_email_used_title')
  })

  it('invitation : un compte créé reprend le retour de F-62, un compte promu se nomme', () => {
    const created = { id: 'x', accountStatus: USER_STATUS.INVITED, promoted: false, invitationSent: true, invitationExpiresAt: '2030-01-01T00:00:00.000Z' }
    expect(toInviteFeedback(created, 'a@b.fr', 'a@b.fr')).toMatchObject({ status: FEEDBACK_STATUS.SUCCESS, message: { key: 'admin.account.feedback_sent' } })
    expect(toInviteFeedback({ ...created, invitationSent: false }, 'a@b.fr', 'a@b.fr')).toMatchObject({ status: FEEDBACK_STATUS.WARNING, message: { key: 'admin.account.feedback_not_sent' } })
    expect(toInviteFeedback({ ...created, promoted: true }, 'a@b.fr', 'Simon Vaur')).toMatchObject({ message: { key: 'admin.administrators.feedback_promoted', params: { name: 'Simon Vaur' } } })
  })
})

describe('useAdminAdministrators', () => {
  it('le service parle au contrat : POST { email }, PATCH { email }, POST /invitation, DELETE', async () => {
    const seen = vi.fn()
    for (const [method, path] of [['POST', BASE], ['PATCH', `${BASE}/id-1`], ['POST', `${BASE}/id-1/invitation`], ['DELETE', `${BASE}/id-1`]] as const) {
      registerEndpoint(path, { method, handler: defineEventHandler(async (event) => {
        seen(event.method, event.path.replace(/^\/_/, ''), method === 'DELETE' ? null : await readBody(event))
        return method === 'DELETE' ? null : {}
      }) })
    }
    const service = new AdministratorService()
    await service.invite('a@exemple.fr')
    await service.correctEmail('id-1', 'b@exemple.fr')
    await service.resendInvitation('id-1')
    await service.revoke('id-1')
    expect(seen).toHaveBeenCalledWith('POST', BASE, { email: 'a@exemple.fr' })
    expect(seen).toHaveBeenCalledWith('PATCH', `${BASE}/id-1`, { email: 'b@exemple.fr' })
    expect(seen).toHaveBeenCalledWith('DELETE', `${BASE}/id-1`, null)
  })

  it('email d’un compte joueur : 409 PROMOTION_CONFIRMATION_REQUIRED = promotion en attente, rien n’est affiché comme refus ; confirmer renvoie confirmPromotion', async () => {
    const bodies: unknown[] = []
    reply('GET', BASE, [SELF])
    registerEndpoint(BASE, { method: 'POST', handler: defineEventHandler(async (event) => {
      const body = await readBody(event) as { confirmPromotion?: boolean }
      bodies.push(body)
      if (!body.confirmPromotion) {
        setResponseStatus(event, 409)
        return { statusCode: 409, code: API_ERROR_CODE.PROMOTION_CONFIRMATION_REQUIRED, message: 'x', details: { displayName: 'Simon Vaur' } }
      }
      return { id: 'simon', accountStatus: USER_STATUS.ACTIVE, promoted: true, invitationSent: true, invitationExpiresAt: null }
    }) })
    const api = await mountComposable()
    await flushPromises()
    expect(await api.invite('simon.vaur@exemple.fr')).toBe(false)
    expect(api.promotion.value).toEqual({ email: 'simon.vaur@exemple.fr', displayName: 'Simon Vaur' })
    expect(api.inviteFailure.value).toBeNull()
    expect(api.feedback.value).toBeNull()
    expect(await api.confirmPromotion()).toBe(true)
    expect(bodies).toEqual([{ email: 'simon.vaur@exemple.fr' }, { email: 'simon.vaur@exemple.fr', confirmPromotion: true }])
    expect(api.promotion.value).toBeNull()
    expect(api.feedback.value?.message).toMatchObject({ key: 'admin.administrators.feedback_promoted', params: { name: 'Simon Vaur' } })
    api.cancelPromotion()
    expect(api.promotion.value).toBeNull()
  })

  it('invitation d’un email de compte joueur : retour nommé d’après la fiche, liste rechargée', async () => {
    reply('GET', BASE, [SELF, account({ id: 'simon', email: 'simon.vaur@exemple.fr', competitor: { id: 'c2', displayName: 'Simon Vaur' } })])
    reply('POST', BASE, { id: 'simon', accountStatus: USER_STATUS.ACTIVE, promoted: true, invitationSent: true, invitationExpiresAt: null })
    const api = await mountComposable()
    await flushPromises()
    expect(await api.invite(' simon.vaur@exemple.fr ')).toBe(true)
    expect(api.feedback.value).toMatchObject({ status: FEEDBACK_STATUS.SUCCESS, message: { key: 'admin.administrators.feedback_promoted', params: { name: 'Simon Vaur' } } })
    expect(api.inviteFailure.value).toBeNull()
  })

  it('déjà administrateur : refus rangé côté carte, pas de retour de succès', async () => {
    reply('GET', BASE, [SELF])
    reply('POST', BASE, apiError(409, API_ERROR_CODE.ALREADY_ADMIN), 409)
    const api = await mountComposable()
    await flushPromises()
    expect(await api.invite('sam.dupont@exemple.fr')).toBe(false)
    expect(api.inviteFailure.value?.code).toBe(API_ERROR_CODE.ALREADY_ADMIN)
    expect(api.feedback.value).toBeNull()
    api.resetInvite()
    expect(api.inviteFailure.value).toBeNull()
  })

  it('retrait : retour « Invitation annulée » pour un invité sans fiche, « Accès retiré » sinon ; refus LAST_ADMIN sous la table', async () => {
    reply('GET', BASE, [SELF, ACTIVE_NO_FILE, INVITED])
    reply('DELETE', `${BASE}/maya`, null, 204)
    reply('DELETE', `${BASE}/sam`, apiError(409, API_ERROR_CODE.LAST_ADMIN), 409)
    const api = await mountComposable()
    await flushPromises()
    expect(await api.revoke('maya')).toBe(true)
    expect(api.feedback.value?.message).toMatchObject({ key: 'admin.administrators.feedback_cancelled', params: { email: 'maya.bonnet@exemple.fr' } })
    expect(await api.revoke('sam')).toBe(false)
    expect(api.actionFailure.value?.code).toBe(API_ERROR_CODE.LAST_ADMIN)
    expect(api.feedback.value).toBeNull()
  })
})

describe('composants', () => {
  it('liste : pastilles, « Vous » sans action, actions par état, dernier actif inactif avec sa raison', async () => {
    const wrapper = await mountSuspended(AdministratorList, { props: { administrators: [SELF, ACTIVE_NO_FILE, INVITED, EXPIRED], pending: false, busy: false } })
    expect(wrapper.get('[data-cy="administrator-count"]').text()).toBe('4')
    expect(wrapper.find('[data-cy="administrator-self"]').text()).toBe('Vous')
    expect(wrapper.findAll('[data-cy="administrator-no-action"]')).toHaveLength(1)
    expect(wrapper.findAll('[data-cy="administrator-revoke"]')).toHaveLength(3)
    expect(wrapper.findAll('[data-cy="administrator-fix"]')).toHaveLength(2)
    expect(wrapper.findAll('[data-cy="administrator-resend"]')).toHaveLength(2)
    expect(wrapper.findAll('[data-cy="administrator-resend"]')[1]!.attributes('aria-label')).toBe('Renvoyer l’invitation à anna.chevalier@exemple.fr')
    await wrapper.findAll('[data-cy="administrator-revoke"]')[0]!.trigger('click')
    expect(wrapper.emitted('revoke')![0]).toEqual(['sam'])
    expect(wrapper.find('[data-cy="administrator-alone"]').exists()).toBe(false)
  })

  it('liste : seul, la phrase « Invitez-en un autre » ; dernier administrateur actif : bouton inactif relié à sa raison', async () => {
    const alone = await mountSuspended(AdministratorList, { props: { administrators: [SELF], pending: false, busy: false } })
    expect(alone.get('[data-cy="administrator-alone"]').text()).toContain('seul administrateur')
    const last = await mountSuspended(AdministratorList, { props: { administrators: [ACTIVE_NO_FILE, INVITED], pending: false, busy: false } })
    const button = last.findAll('[data-cy="administrator-revoke"]')[0]!
    expect(button.attributes('disabled')).toBeDefined()
    expect(last.get(`#${button.attributes('aria-describedby')}`).text()).toContain('au moins un administrateur actif')
  })

  it('carte : un email invalide n’émet rien, un email valide émet submit ; « déjà administrateur » marque le champ', async () => {
    const wrapper = await mountSuspended(AdministratorInviteCard, { props: { modelValue: 'pas-un-email', pending: false, failure: null } })
    await wrapper.get('[data-cy="administrator-invite-form"]').trigger('submit')
    await flushPromises()
    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.find('[data-cy="administrator-invite-info"]').exists()).toBe(true)
    await wrapper.setProps({ modelValue: 'camille@exemple.fr' })
    await wrapper.get('[data-cy="administrator-invite-form"]').trigger('submit')
    await flushPromises()
    expect(wrapper.emitted('submit')).toHaveLength(1)
    const failure = toAdministratorFailure(new ApiRequestError(apiError(409, API_ERROR_CODE.ALREADY_ADMIN)))
    await wrapper.setProps({ failure })
    expect(wrapper.find('[data-cy="administrator-invite-info"]').exists()).toBe(false)
    expect(wrapper.get('[data-cy="administrator-invite-error"]').text()).toContain('Email déjà utilisé.')
    expect(wrapper.get('input[type="email"]').attributes('aria-invalid')).toBe('true')
    expect(wrapper.text()).toContain('Cet email est déjà celui d’un administrateur.')
  })

  it('boîte « Corriger » : email pré-rempli, phrase d’état, soumet l’email corrigé', async () => {
    const wrapper = await mountSuspended(AdministratorFixDialog, { props: { open: true, account: INVITED, pending: false, failure: null }, attachTo: document.body })
    await flushPromises()
    expect(document.body.textContent).toContain('Corriger l’invitation')
    expect(document.body.textContent).toContain('Invitation envoyée à maya.bonnet@exemple.fr, valable jusqu’au 25 novembre 2026.')
    const input = document.body.querySelector('input[type="email"]') as HTMLInputElement
    expect(input.value).toBe('maya.bonnet@exemple.fr')
    input.value = 'maya.bonnet@exemple.org'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await flushPromises()
    ;(document.body.querySelector('[data-cy="administrator-fix-confirm"]') as HTMLElement).click()
    await flushPromises()
    expect(wrapper.emitted('submit')![0]).toEqual(['maya.bonnet@exemple.org'])
    wrapper.unmount()
  })

  it('boîte « Nommer » : titre et texte du joueur, Annuler émet cancel, Nommer émet confirm', async () => {
    const wrapper = await mountSuspended(AdministratorPromoteDialog, { props: { promotion: { email: 'simon.vaur@exemple.fr', displayName: 'Simon Vaur' }, pending: false }, attachTo: document.body })
    await flushPromises()
    expect(document.body.textContent).toContain('Nommer Simon Vaur administrateur ?')
    expect(document.body.textContent).toContain('simon.vaur@exemple.fr est l’email du compte joueur de Simon Vaur. Ce compte deviendra administrateur : il garde sa fiche et son mot de passe. Il est prévenu par mail.')
    ;(document.body.querySelector('[data-cy="administrator-promote-confirm"]') as HTMLElement).click()
    ;(document.body.querySelector('[data-cy="administrator-promote-cancel"]') as HTMLElement).click()
    await flushPromises()
    expect(wrapper.emitted('confirm')).toHaveLength(1)
    expect(wrapper.emitted('cancel')).toHaveLength(1)
    wrapper.unmount()
  })
})
