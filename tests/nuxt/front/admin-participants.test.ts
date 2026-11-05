import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { defineEventHandler, getHeader, readRawBody, readBody, setResponseStatus } from 'h3'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { ADMIN_PARTICIPANTS_PAGE_SIZE, PARTICIPANT_CREATE_VALUE } from '../../../src/consts/admin-participants.const'
import { API_ERROR_CODE } from '../../../src/enums/api-error-code.enum'
import { EDITION_STATUS } from '../../../src/enums/edition.enum'
import { PARTICIPANT_FEEDBACK_STATUS } from '../../../src/enums/participant-feedback.enum'
import { ACCOUNT_STATE } from '../../../src/enums/user.enum'
import type { IParticipantFormValues } from '../../../src/interfaces/admin-participants.interface'
import type { IAdminParticipant } from '../../../src/interfaces/edition.interface'
import { useAdminEditionStore } from '../../../src/composables/useAdminEditionStore'
import { useAdminParticipants } from '../../../src/composables/useAdminParticipants'
import { CompetitorService } from '../../../src/services/competitor.service'
import { EditionService } from '../../../src/services/edition.service'
import { ApiRequestError } from '../../../src/utils/api-request-error.util'
import { buildSuggestions, toNewCompetitor, toParticipantError, toParticipantRow } from '../../../src/utils/admin-participants.util'
import ParticipantCreateForm from '~/components/admin/participants/ParticipantCreateForm.vue'
import ParticipantList from '~/components/admin/participants/ParticipantList.vue'

/*********************************************************
 * F-09 : admin, participants, parcours d'ÉCRITURE en tests de service et de composant
 *
 * @description
 * Tests de composant, clairement nommés : les écritures de l'écran (rattacher, créer avec `invitationSent` à `true`, `false`
 * ou `null`, retirer, email déjà pris, photo) sont jouées contre des routes simulées (`registerEndpoint`). Les mêmes
 * parcours, sur la vraie base et une édition créée par le test, sont dans `tests/e2e/writes/F-09.spec.ts` (QA-3).
 * `invitationSent: false` (SMTP injoignable) n'a pas d'équivalent e2e : le serveur de test capture les courriels.
 ********************************************************/
const EDITION_ID = '00000000-0000-4000-8000-0000000000e1'
const COMPETITOR_ID = '00000000-0000-4000-8000-0000000000c1'
const PARTICIPATION_ID = '00000000-0000-4000-8000-0000000000a1'

const participant = (name: string, state: ACCOUNT_STATE | null, overrides: Partial<IAdminParticipant> = {}): IAdminParticipant => ({
  participationId: `${PARTICIPATION_ID}-${name}`,
  competitor: { id: `${COMPETITOR_ID}-${name}`, displayName: name, firstName: null, lastName: null, nickname: null, avatarUrl: null },
  poolId: null,
  isSeed: false,
  seedRank: null,
  status: 'REGISTERED' as IAdminParticipant['status'],
  finalStage: null,
  points: null,
  poolRank: null,
  editionsPlayed: 3,
  account: state === null ? null : { state, invitationExpiresAt: null },
  ...overrides
})

const FORM: IParticipantFormValues = { lastName: ' Roussel ', firstName: 'Camille', nickname: '', email: ' camille@exemple.fr ', phone: '', avatar: null }

const apiError = (statusCode: number, code: API_ERROR_CODE) => ({ statusCode, code, message: code })

const registerEditions = () => registerEndpoint('/api/v1/editions', defineEventHandler(() => [
  { id: EDITION_ID, code: '2027', year: 2027, name: null, status: EDITION_STATUS.REGISTRATION }
]))
const registerList = (rows: IAdminParticipant[] = [participant('Lisa André', ACCOUNT_STATE.ACTIVE)]) =>
  registerEndpoint(`/api/v1/admin/editions/${EDITION_ID}/participants`, defineEventHandler(() => rows))

const mountComposable = async () => {
  useAdminEditionStore(useNuxtApp().$pinia).editionId = EDITION_ID
  let api!: ReturnType<typeof useAdminParticipants>
  await mountSuspended(defineComponent({
    setup () {
      api = useAdminParticipants()
      return () => null
    }
  }))
  await flushPromises()
  return api
}

describe('services des inscrits : en-têtes, corps et verbes', () => {
  it('l’ajout part en application/json, sans Content-Type forcé, sous 16 Ko (M2)', async () => {
    const seen = vi.fn()
    registerEndpoint(`/api/v1/editions/${EDITION_ID}/participants`, { method: 'POST', handler: defineEventHandler(async (event) => {
      seen(getHeader(event, 'content-type'), await readRawBody(event))
      setResponseStatus(event, 201)
      return { participationId: 'p', invitationSent: null }
    }) })
    await new EditionService().addParticipant(EDITION_ID, { newCompetitor: toNewCompetitor(FORM) })
    const [contentType, raw] = seen.mock.calls[0]!
    expect(contentType).toMatch(/^application\/json/)
    expect(String(raw).length).toBeLessThan(16 * 1024)
    expect(JSON.parse(String(raw))).toEqual({ newCompetitor: { email: 'camille@exemple.fr', firstName: 'Camille', lastName: 'Roussel' } })
  })

  it('le retrait est un DELETE sans corps, la photo un PUT multipart au champ « file » avec le boundary du navigateur', async () => {
    const verbs = vi.fn()
    registerEndpoint(`/api/v1/editions/${EDITION_ID}/participants/${PARTICIPATION_ID}`, { method: 'DELETE', handler: defineEventHandler((event) => {
      verbs(event.method)
      setResponseStatus(event, 204)
      return null
    }) })
    await new EditionService().removeParticipant(EDITION_ID, PARTICIPATION_ID)
    expect(verbs).toHaveBeenCalledWith('DELETE')

    const seen = vi.fn()
    registerEndpoint(`/api/v1/competiteurs/${COMPETITOR_ID}/avatar`, { method: 'PUT', handler: defineEventHandler(async (event) => {
      seen(getHeader(event, 'content-type'))
      return { avatarUrl: '/api/v1/competiteurs/x/avatar?v=abc' }
    }) })
    const result = await new CompetitorService().uploadAvatar(COMPETITOR_ID, new File(['x'], 'photo.png', { type: 'image/png' }))
    expect(result.avatarUrl).toContain('?v=')
    expect(seen.mock.calls[0]![0]).toMatch(/^multipart\/form-data; boundary=/)
  })

  it('le renvoi d’invitation est un POST sans corps', async () => {
    const seen = vi.fn()
    registerEndpoint(`/api/v1/competiteurs/${COMPETITOR_ID}/invitation`, { method: 'POST', handler: defineEventHandler(async (event) => {
      seen(event.method, await readRawBody(event))
      return { invitationSent: true, invitationExpiresAt: '2030-01-01T00:00:00.000Z' }
    }) })
    expect((await new CompetitorService().resendInvitation(COMPETITOR_ID)).invitationSent).toBe(true)
    expect(seen.mock.calls[0]![0]).toBe('POST')
  })
})

describe('fonctions pures des inscrits', () => {
  it('traduit une erreur par code : une clé par code, « hors ligne » et « inconnue » à part', () => {
    const cases: Array<[API_ERROR_CODE, string]> = [
      [API_ERROR_CODE.PARTICIPANT_ALREADY_REGISTERED, 'admin.participants.error_already_registered'],
      [API_ERROR_CODE.REGISTRATION_CLOSED, 'admin.participants.error_registration_closed'],
      [API_ERROR_CODE.EDITION_CLOSED, 'admin.participants.error_edition_closed'],
      [API_ERROR_CODE.EMAIL_ALREADY_USED, 'admin.participants.error_email_used'],
      [API_ERROR_CODE.COMPETITOR_NOT_FOUND, 'admin.participants.error_competitor_not_found'],
      [API_ERROR_CODE.VALIDATION_FAILED, 'admin.participants.error_validation'],
      [API_ERROR_CODE.UNAUTHORIZED, 'admin.participants.error_unauthorized'],
      [API_ERROR_CODE.FORBIDDEN, 'admin.participants.error_forbidden'],
      [API_ERROR_CODE.AVATAR_TOO_LARGE, 'admin.participants.error_avatar_too_large'],
      [API_ERROR_CODE.AVATAR_UNSUPPORTED_TYPE, 'admin.participants.error_avatar_type'],
      [API_ERROR_CODE.AVATAR_UNREADABLE, 'admin.participants.error_avatar_unreadable']
    ]
    for (const [code, key] of cases) {
      expect(toParticipantError(new ApiRequestError(apiError(400, code))).key).toBe(key)
    }
    expect(toParticipantError(new ApiRequestError(apiError(0, API_ERROR_CODE.INTERNAL_ERROR), true)).key).toBe('admin.participants.error_offline')
    expect(toParticipantError(new Error('x')).key).toBe('admin.participants.error_unknown')
  })

  it('newCompetitor : valeurs rognées, pseudo et téléphone omis quand ils sont vides', () => {
    expect(toNewCompetitor({ ...FORM, nickname: ' Décap ', phone: ' +33 6 12 34 56 78 ' })).toEqual({
      email: 'camille@exemple.fr', firstName: 'Camille', lastName: 'Roussel', nickname: 'Décap', phone: '+33 6 12 34 56 78'
    })
    expect(Object.keys(toNewCompetitor(FORM))).toEqual(['email', 'firstName', 'lastName'])
  })

  it('suggestions : les profils déjà inscrits sont écartés et « Créer » vient toujours en dernier', () => {
    const items = [
      { id: 'a', displayName: 'Camille Durand', avatarUrl: null, editionsPlayed: 1 },
      { id: 'b', displayName: 'Camille Roux', avatarUrl: null, editionsPlayed: 4 }
    ] as Parameters<typeof buildSuggestions>[0]
    const suggestions = buildSuggestions(items, new Set(['b']), 'Cam')
    expect(suggestions.map(suggestion => suggestion.value)).toEqual(['a', PARTICIPANT_CREATE_VALUE])
    expect(suggestions[0]!.subtitle.key).toBe('admin.participants.suggestion_one')
    expect(suggestions.at(-1)!.isCreate).toBe(true)
    expect(buildSuggestions([], new Set(), 'Cam').map(suggestion => suggestion.value)).toEqual([PARTICIPANT_CREATE_VALUE])
    expect(buildSuggestions(items, new Set(), 'Cam').filter(suggestion => suggestion.isCreate)).toHaveLength(1)
    expect(toParticipantRow(participant('Lisa André', null)).accountState).toBeNull()
  })
})

describe('useAdminParticipants : parcours d’écriture contre des routes simulées', () => {
  beforeEach(() => {
    registerEditions()
    registerList()
  })

  it('rattacher un profil existant : 201, invitationSent null, message « Profil rattaché », aucune invitation', async () => {
    const body = vi.fn()
    registerEndpoint(`/api/v1/editions/${EDITION_ID}/participants`, { method: 'POST', handler: defineEventHandler(async (event) => {
      body(await readBody(event))
      setResponseStatus(event, 201)
      return { ...participant('Camille Durand', null), invitationSent: null }
    }) })
    const api = await mountComposable()
    expect(await api.attach(COMPETITOR_ID)).toBe(true)
    expect(body).toHaveBeenCalledWith({ competitorId: COMPETITOR_ID })
    expect(api.feedback.value).toMatchObject({ status: PARTICIPANT_FEEDBACK_STATUS.SUCCESS, message: { key: 'admin.participants.feedback_attached' } })
  })

  it('créer un participant : invitationSent true, « Invitation envoyée », la photo part dans un second appel', async () => {
    registerEndpoint(`/api/v1/editions/${EDITION_ID}/participants`, { method: 'POST', handler: defineEventHandler((event) => {
      setResponseStatus(event, 201)
      return { ...participant('Camille Roussel', ACCOUNT_STATE.INVITED), invitationSent: true }
    }) })
    const avatar = vi.fn()
    registerEndpoint(`/api/v1/competiteurs/${COMPETITOR_ID}-Camille Roussel/avatar`, { method: 'PUT', handler: defineEventHandler(() => {
      avatar()
      return { avatarUrl: '/x?v=1' }
    }) })
    const api = await mountComposable()
    expect(await api.create({ ...FORM, avatar: new File(['x'], 'photo.png', { type: 'image/png' }) })).toBe(true)
    expect(api.feedback.value).toMatchObject({ status: PARTICIPANT_FEEDBACK_STATUS.SUCCESS, message: { key: 'admin.participants.feedback_invitation_sent' } })
    expect(avatar).toHaveBeenCalledTimes(1)
    expect(api.pendingAvatar.value).toBeNull()
  })

  it('créer un participant : invitationSent false s’affiche honnêtement, jamais comme un envoi réussi', async () => {
    registerEndpoint(`/api/v1/editions/${EDITION_ID}/participants`, { method: 'POST', handler: defineEventHandler((event) => {
      setResponseStatus(event, 201)
      return { ...participant('Camille Roussel', ACCOUNT_STATE.INVITED), invitationSent: false }
    }) })
    const api = await mountComposable()
    await api.create(FORM)
    expect(api.feedback.value).toMatchObject({ status: PARTICIPANT_FEEDBACK_STATUS.WARNING, message: { key: 'admin.participants.feedback_invitation_failed' } })
  })

  it('email déjà pris : 409 EMAIL_ALREADY_USED marque le champ, sans retour d’erreur générique', async () => {
    registerEndpoint(`/api/v1/editions/${EDITION_ID}/participants`, { method: 'POST', handler: defineEventHandler((event) => {
      setResponseStatus(event, 409)
      return apiError(409, API_ERROR_CODE.EMAIL_ALREADY_USED)
    }) })
    const api = await mountComposable()
    expect(await api.create(FORM)).toBe(false)
    expect(api.emailTaken.value).toBe(true)
    expect(api.feedback.value).toBeNull()
  })

  it('ajout après validation du tirage : 409 REGISTRATION_CLOSED traduit en message d’erreur', async () => {
    registerEndpoint(`/api/v1/editions/${EDITION_ID}/participants`, { method: 'POST', handler: defineEventHandler((event) => {
      setResponseStatus(event, 409)
      return apiError(409, API_ERROR_CODE.REGISTRATION_CLOSED)
    }) })
    const api = await mountComposable()
    expect(await api.attach(COMPETITOR_ID)).toBe(false)
    expect(api.feedback.value).toMatchObject({ status: PARTICIPANT_FEEDBACK_STATUS.ERROR, message: { key: 'admin.participants.error_registration_closed' } })
  })

  it('un refus REGISTRATION_CLOSED recharge l’édition : l’écran apprend son état et masque les actions', async () => {
    let statusCalls = 0
    registerEndpoint('/api/v1/editions', defineEventHandler(() => {
      statusCalls += 1
      return [{ id: EDITION_ID, code: '2027', year: 2027, name: null, status: statusCalls > 1 ? EDITION_STATUS.POOLS_DRAWN : EDITION_STATUS.REGISTRATION }]
    }))
    registerEndpoint(`/api/v1/editions/${EDITION_ID}/participants`, { method: 'POST', handler: defineEventHandler((event) => {
      setResponseStatus(event, 409)
      return apiError(409, API_ERROR_CODE.REGISTRATION_CLOSED)
    }) })
    const api = await mountComposable()
    expect(api.isReadOnly.value).toBe(false)
    await api.attach(COMPETITOR_ID)
    await flushPromises()
    expect(api.isReadOnly.value).toBe(true)
    expect(api.feedback.value?.message.key).toBe('admin.participants.error_registration_closed')
  })

  it('retrait avant tirage : 204, message « retiré » ; après tirage : 409 REGISTRATION_CLOSED', async () => {
    registerEndpoint(`/api/v1/editions/${EDITION_ID}/participants/${PARTICIPATION_ID}`, { method: 'DELETE', handler: defineEventHandler((event) => {
      setResponseStatus(event, 204)
      return null
    }) })
    const api = await mountComposable()
    expect(await api.remove(PARTICIPATION_ID)).toBe(true)
    expect(api.feedback.value?.message.key).toBe('admin.participants.feedback_removed')

    registerEndpoint(`/api/v1/editions/${EDITION_ID}/participants/${PARTICIPATION_ID}`, { method: 'DELETE', handler: defineEventHandler((event) => {
      setResponseStatus(event, 409)
      return apiError(409, API_ERROR_CODE.REGISTRATION_CLOSED)
    }) })
    expect(await api.remove(PARTICIPATION_ID)).toBe(false)
    expect(api.feedback.value?.message.key).toBe('admin.participants.error_registration_closed')
  })

  it('photo : l’échec du second appel garde le participant créé, propose « Réessayer l’envoi de la photo », sans recréer le compétiteur', async () => {
    const created = vi.fn()
    registerEndpoint(`/api/v1/editions/${EDITION_ID}/participants`, { method: 'POST', handler: defineEventHandler((event) => {
      created()
      setResponseStatus(event, 201)
      return { ...participant('Camille Roussel', ACCOUNT_STATE.INVITED), invitationSent: true }
    }) })
    registerEndpoint(`/api/v1/competiteurs/${COMPETITOR_ID}-Camille Roussel/avatar`, { method: 'PUT', handler: defineEventHandler((event) => {
      setResponseStatus(event, 413)
      return apiError(413, API_ERROR_CODE.AVATAR_TOO_LARGE)
    }) })
    const api = await mountComposable()
    await api.create({ ...FORM, avatar: new File(['x'], 'photo.png', { type: 'image/png' }) })
    expect(api.pendingAvatar.value).toMatchObject({ displayName: 'Camille Roussel' })
    expect(api.feedback.value).toMatchObject({ status: PARTICIPANT_FEEDBACK_STATUS.ERROR, message: { key: 'admin.participants.feedback_avatar_failed' } })

    registerEndpoint(`/api/v1/competiteurs/${COMPETITOR_ID}-Camille Roussel/avatar`, { method: 'PUT', handler: defineEventHandler(() => ({ avatarUrl: '/x?v=2' })) })
    expect(await api.retryAvatar()).toBe(true)
    expect(api.pendingAvatar.value).toBeNull()
    expect(created).toHaveBeenCalledTimes(1)
  })

  it('renvoyer l’invitation : true, « Invitation renvoyée » ; false, avertissement', async () => {
    registerEndpoint(`/api/v1/competiteurs/${COMPETITOR_ID}/invitation`, { method: 'POST', handler: defineEventHandler(() => ({ invitationSent: true, invitationExpiresAt: '2030-01-01T00:00:00.000Z' })) })
    const api = await mountComposable()
    await api.resend(COMPETITOR_ID)
    expect(api.feedback.value?.message.key).toBe('admin.participants.feedback_resent')
    registerEndpoint(`/api/v1/competiteurs/${COMPETITOR_ID}/invitation`, { method: 'POST', handler: defineEventHandler(() => ({ invitationSent: false, invitationExpiresAt: '2030-01-01T00:00:00.000Z' })) })
    await api.resend(COMPETITOR_ID)
    expect(api.feedback.value).toMatchObject({ status: PARTICIPANT_FEEDBACK_STATUS.WARNING, message: { key: 'admin.participants.feedback_resend_failed' } })
  })
})

describe('composants des inscrits', () => {
  it('la liste montre l’état du compte, un bouton Retirer nommé par joueur si l’édition l’autorise, Renvoyer pour un compte invité ou expiré', async () => {
    const rows = [
      participant('Lisa André', ACCOUNT_STATE.ACTIVE),
      participant('Maya Bonnet', ACCOUNT_STATE.INVITED),
      participant('Anna Chevalier', ACCOUNT_STATE.INVITATION_EXPIRED),
      participant('Archive Joueur', null)
    ]
    const wrapper = await mountSuspended(ParticipantList, { props: { participants: rows, editable: true, pending: false, busyParticipationId: null } })
    expect(wrapper.get('[data-cy="participant-count"]').text()).toBe('4')
    expect(wrapper.findAll('[data-cy="participant-remove"]')).toHaveLength(4)
    expect(wrapper.find('[aria-label="Retirer Lisa André"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-cy="participant-resend"]')).toHaveLength(2)
    expect(wrapper.get('[data-cy="participant-account-ACTIVE"]').text()).toBe('Actif')
    expect(wrapper.get('[data-cy="participant-account-INVITED"]').text()).toBe('Invité')
    expect(wrapper.get('[data-cy="participant-account-INVITATION_EXPIRED"]').text()).toBe('Invitation expirée')
    expect(wrapper.get('[data-cy="participant-account-none"]').text()).toBe('Sans compte')
    expect(wrapper.html()).not.toMatch(/@/)
    await wrapper.get('[data-cy="participant-remove"]').trigger('click')
    expect(wrapper.emitted('remove')![0]).toEqual([rows[0]!.participationId])
  })

  it('édition clôturée : aucun bouton Retirer ; liste paginée par 8 avec le compteur « 1–8 sur N »', async () => {
    const rows = Array.from({ length: 11 }, (_, index) => participant(`Joueur ${String(index).padStart(2, '0')}`, ACCOUNT_STATE.ACTIVE))
    const wrapper = await mountSuspended(ParticipantList, { props: { participants: rows, editable: false, pending: false, busyParticipationId: null } })
    expect(wrapper.find('[data-cy="participant-remove"]').exists()).toBe(false)
    expect(wrapper.findAll('tbody tr')).toHaveLength(ADMIN_PARTICIPANTS_PAGE_SIZE)
    expect(wrapper.get('[data-cy="pagination-range"]').text()).toBe('1–8 sur 11')
  })

  it('le formulaire : champs obligatoires, email invalide bloquent l’envoi ; valeurs valides émises rognées', async () => {
    const wrapper = await mountSuspended(ParticipantCreateForm, { props: { initialLastName: '', pending: false, emailTaken: false } })
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.text()).toContain('Champ obligatoire')

    await wrapper.get('[data-cy="participant-form-last-name"] input').setValue(' Roussel ')
    await wrapper.get('[data-cy="participant-form-first-name"] input').setValue('Camille')
    await wrapper.get('[data-cy="participant-form-email"] input').setValue('pas-un-email')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.text()).toContain('Adresse email invalide')

    await wrapper.get('[data-cy="participant-form-email"] input').setValue('camille@exemple.fr')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.emitted('submit')).toHaveLength(1)
    expect(wrapper.emitted('submit')![0]![0]).toMatchObject({ lastName: ' Roussel ', firstName: 'Camille', email: 'camille@exemple.fr', avatar: null })
  })

  it('email déjà pris : message sous le champ (error-messages), champ invalide, formulaire conservé', async () => {
    const wrapper = await mountSuspended(ParticipantCreateForm, { props: { initialLastName: 'Cam', pending: false, emailTaken: true } })
    expect(wrapper.get('[data-cy="participant-form-email"]').text()).toContain('déjà rattaché à un autre compte')
    expect(wrapper.get('[data-cy="participant-form-email"] input').attributes('aria-invalid')).toBe('true')
    expect(wrapper.get('[data-cy="participant-form-invitation-info"]').text()).toContain('Invitation')
    expect((wrapper.get('[data-cy="participant-form-last-name"] input').element as HTMLInputElement).value).toBe('Cam')
  })
})
