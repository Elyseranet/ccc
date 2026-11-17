import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { useCompetitorAccount } from '../../../src/composables/useCompetitorAccount'
import { API_ERROR_CODE } from '../../../src/enums/api-error-code.enum'
import { FEEDBACK_STATUS } from '../../../src/enums/feedback.enum'
import { COMPETITOR_ACCOUNT_STATUS } from '../../../src/enums/user.enum'
import { CompetitorService } from '../../../src/services/competitor.service'
import { isAccountEmailValid, toAccountFailure } from '../../../src/utils/admin-competitors.util'
import { ApiRequestError } from '../../../src/utils/api-request-error.util'
import CompetitorAccountBlock from '~/components/admin/competitors/CompetitorAccountBlock.vue'
import ParticipantInviteDialog from '~/components/admin/participants/ParticipantInviteDialog.vue'

/*********************************************************
 * F-62 : saisir l'email d'un joueur et l'inviter (admin)
 *
 * @description
 * Tests de composant et de composable contre des routes simulées (`registerEndpoint`) : la vraie route `PUT /competiteurs/{id}/compte`
 * est livrée par B-29 (`pendingTicket`). Les parcours sur la vraie base sont dans `tests/e2e/writes/F-62.spec.ts` (en attente de B-29).
 ********************************************************/
const COMPETITOR_ID = '00000000-0000-4000-8000-0000000000c1'
const PATH = `/api/v1/competiteurs/${COMPETITOR_ID}/compte`
const apiError = (statusCode: number, code: API_ERROR_CODE) => ({ statusCode, code, message: code })

const mountComposable = async () => {
  let api!: ReturnType<typeof useCompetitorAccount>
  await mountSuspended(defineComponent({
    setup () {
      api = useCompetitorAccount()
      return () => null
    }
  }))
  return api
}
const reply = (body: unknown, status = 200) => registerEndpoint(PATH, { method: 'PUT', handler: defineEventHandler((event) => {
  setResponseStatus(event, status)
  return body
}) })

describe('saisie de l’email : fonctions pures', () => {
  it('accepte une adresse complète rognée, refuse le vide, l’absence de domaine et l’excès de longueur', () => {
    expect(isAccountEmailValid('  lisa@exemple.fr ')).toBe(true)
    expect(isAccountEmailValid('')).toBe(false)
    expect(isAccountEmailValid('lisa@exemple')).toBe(false)
    expect(isAccountEmailValid('lisa exemple@x.fr')).toBe(false)
    expect(isAccountEmailValid(`${'a'.repeat(250)}@x.fr`)).toBe(false)
  })

  it('traduit 409 email pris, 409 compte actif, hors ligne et inconnu', () => {
    expect(toAccountFailure(new ApiRequestError(apiError(409, API_ERROR_CODE.EMAIL_ALREADY_USED))).title.key).toBe('admin.account.error_email_used_title')
    expect(toAccountFailure(new ApiRequestError(apiError(409, API_ERROR_CODE.ACCOUNT_ACTIVE))).title.key).toBe('admin.account.error_active_title')
    expect(toAccountFailure(new ApiRequestError(apiError(0, API_ERROR_CODE.INTERNAL_ERROR), true)).title.key).toBe('admin.competitors.error_offline_title')
    expect(toAccountFailure(new Error('x')).title.key).toBe('admin.account.error_unknown_title')
  })
})

describe('useCompetitorAccount', () => {
  it('le service envoie un PUT { email } sur /competiteurs/{id}/compte', async () => {
    const seen = vi.fn()
    registerEndpoint(PATH, { method: 'PUT', handler: defineEventHandler(async (event) => {
      seen(event.method, await readBody(event))
      return { accountStatus: COMPETITOR_ACCOUNT_STATUS.INVITED, invitationSent: true, invitationExpiresAt: '2030-01-01T00:00:00.000Z' }
    }) })
    await new CompetitorService().setAccountEmail(COMPETITOR_ID, 'lisa@exemple.fr')
    expect(seen).toHaveBeenCalledWith('PUT', { email: 'lisa@exemple.fr' })
  })

  it('invitation envoyée : retour de succès avec l’email rogné', async () => {
    reply({ accountStatus: COMPETITOR_ACCOUNT_STATUS.INVITED, invitationSent: true, invitationExpiresAt: '2030-01-01T00:00:00.000Z' })
    const api = await mountComposable()
    expect(await api.submit(COMPETITOR_ID, ' lisa@exemple.fr ')).toBe(true)
    expect(api.feedback.value).toMatchObject({ status: FEEDBACK_STATUS.SUCCESS, message: { key: 'admin.account.feedback_sent', params: { email: 'lisa@exemple.fr' } } })
    expect(api.failure.value).toBeNull()
  })

  it('envoi échoué : avertissement, le compte est créé quand même (succès de l’appel)', async () => {
    reply({ accountStatus: COMPETITOR_ACCOUNT_STATUS.INVITED, invitationSent: false, invitationExpiresAt: '2030-01-01T00:00:00.000Z' })
    const api = await mountComposable()
    expect(await api.submit(COMPETITOR_ID, 'lisa@exemple.fr')).toBe(true)
    expect(api.feedback.value).toMatchObject({ status: FEEDBACK_STATUS.WARNING, message: { key: 'admin.account.feedback_not_sent' } })
  })

  it('email pris : échec, emailTaken, pas de retour de succès ; puis compte actif', async () => {
    reply(apiError(409, API_ERROR_CODE.EMAIL_ALREADY_USED), 409)
    const api = await mountComposable()
    expect(await api.submit(COMPETITOR_ID, 'pris@exemple.fr')).toBe(false)
    expect(api.emailTaken.value).toBe(true)
    expect(api.feedback.value).toBeNull()
    reply(apiError(409, API_ERROR_CODE.ACCOUNT_ACTIVE), 409)
    expect(await api.submit(COMPETITOR_ID, 'lisa@exemple.fr')).toBe(false)
    expect(api.emailTaken.value).toBe(false)
    expect(api.failure.value?.code).toBe(API_ERROR_CODE.ACCOUNT_ACTIVE)
    api.reset()
    expect(api.failure.value).toBeNull()
    await flushPromises()
  })
})

describe('bloc « Compte » de la fiche', () => {
  it('sans compte : état « Sans compte », champ à libellé visible, « Envoyer l’invitation »', async () => {
    const wrapper = await mountSuspended(CompetitorAccountBlock, { props: { account: { status: COMPETITOR_ACCOUNT_STATUS.NONE, email: null, invitationExpiresAt: null } } })
    expect(wrapper.get('[data-cy="competitor-account-state"]').attributes('data-status')).toBe('NONE')
    expect(wrapper.get('[data-cy="competitor-account-submit"]').text()).toBe('Envoyer l’invitation')
    const input = wrapper.get('input[type="email"]')
    expect(wrapper.get(`label[for="${input.attributes('id')}"]`).text()).toBe('Email · privé')
  })

  it('invité : email pré-rempli, expiration affichée, « Corriger et renvoyer »', async () => {
    const wrapper = await mountSuspended(CompetitorAccountBlock, { props: { account: { status: COMPETITOR_ACCOUNT_STATUS.INVITED, email: 'maya@exemple.fr', invitationExpiresAt: '2099-11-24T10:00:00.000Z' } } })
    expect(wrapper.get('[data-cy="competitor-account-state"]').text()).toContain('maya@exemple.fr')
    expect(wrapper.get('[data-cy="competitor-account-state"]').text()).toContain('24 novembre 2099')
    expect((wrapper.get('input[type="email"]').element as HTMLInputElement).value).toBe('maya@exemple.fr')
    expect(wrapper.get('[data-cy="competitor-account-submit"]').text()).toBe('Corriger et renvoyer')
  })

  it('actif : email en lecture seule, ni champ ni bouton', async () => {
    const wrapper = await mountSuspended(CompetitorAccountBlock, { props: { account: { status: COMPETITOR_ACCOUNT_STATUS.ACTIVE, email: 'lisa@exemple.fr', invitationExpiresAt: null } } })
    expect(wrapper.get('[data-cy="competitor-account-readonly"]').text()).toContain('lisa@exemple.fr')
    expect(wrapper.find('input').exists()).toBe(false)
    expect(wrapper.find('[data-cy="competitor-account-submit"]').exists()).toBe(false)
  })

  it('un email invalide n’émet rien et montre l’erreur ; un email valide émet submit', async () => {
    const wrapper = await mountSuspended(CompetitorAccountBlock, { props: { account: { status: COMPETITOR_ACCOUNT_STATUS.NONE, email: null, invitationExpiresAt: null } } })
    await wrapper.get('input[type="email"]').setValue('pas-un-email')
    await wrapper.get('[data-cy="competitor-account-form"]').trigger('submit')
    await flushPromises()
    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.get('input[type="email"]').attributes('aria-invalid')).toBe('true')
    await wrapper.get('input[type="email"]').setValue('lisa@exemple.fr')
    await wrapper.get('[data-cy="competitor-account-form"]').trigger('submit')
    await flushPromises()
    expect(wrapper.emitted('submit')![0]).toEqual(['lisa@exemple.fr'])
  })

  it('refus 409 email pris : alerte et champ en erreur', async () => {
    const failure = toAccountFailure(new ApiRequestError(apiError(409, API_ERROR_CODE.EMAIL_ALREADY_USED)))
    const wrapper = await mountSuspended(CompetitorAccountBlock, { props: { account: { status: COMPETITOR_ACCOUNT_STATUS.NONE, email: null, invitationExpiresAt: null }, failure } })
    expect(wrapper.get('[data-cy="competitor-account-error"]').text()).toContain('Email déjà utilisé.')
    expect(wrapper.get('input[type="email"]').attributes('aria-invalid')).toBe('true')
  })
})

describe('boîte « Inviter » de la liste', () => {
  it('nomme le joueur, ne soumet qu’un email valide', async () => {
    const wrapper = await mountSuspended(ParticipantInviteDialog, { props: { open: true, name: 'Archive Joueur' }, attachTo: document.body })
    await flushPromises()
    expect(document.body.textContent).toContain('Inviter Archive Joueur')
    const input = document.body.querySelector('input[type="email"]') as HTMLInputElement
    expect(document.body.querySelector(`label[for="${input.id}"]`)?.textContent).toContain('Email')
    ;(document.body.querySelector('[data-cy="participant-invite-confirm"]') as HTMLElement).click()
    await flushPromises()
    expect(wrapper.emitted('submit')).toBeUndefined()
    input.value = 'archive@exemple.fr'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await flushPromises()
    ;(document.body.querySelector('[data-cy="participant-invite-confirm"]') as HTMLElement).click()
    await flushPromises()
    expect(wrapper.emitted('submit')![0]).toEqual(['archive@exemple.fr'])
    wrapper.unmount()
  })
})
