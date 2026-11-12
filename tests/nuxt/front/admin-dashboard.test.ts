import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { defineEventHandler, setResponseStatus } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RouterLink } from 'vue-router'
import { useAdminEditionStore } from '../../../src/composables/useAdminEditionStore'
import { ADMIN_ACTIVITY_KIND, ADMIN_ACTIVITY_TARGET } from '../../../src/enums/admin-activity.enum'
import { API_ERROR_CODE } from '../../../src/enums/api-error-code.enum'
import { DRAW_KIND, DRAW_STATUS } from '../../../src/enums/draw.enum'
import { EDITION_STATUS } from '../../../src/enums/edition.enum'
import { MATCH_PURPOSE, MATCH_STATUS } from '../../../src/enums/match.enum'
import { ROUND_KIND, ROUND_STATUS } from '../../../src/enums/round.enum'
import { API_ROUTES } from '../../../src/consts/api-routes.const'
import { API_ENDPOINT } from '../../../src/enums/api-endpoint.enum'
import AdminDashboardPage from '../../../src/pages/admin/index.vue'

const mountPage = () => mountSuspended(AdminDashboardPage, { route: '/admin', global: { components: { RouterLink } } })

const adminMatch = (id: string, status: MATCH_STATUS) => ({
  id, sequence: 1, roundKind: ROUND_KIND.POOLS, poolRank: 1, purpose: MATCH_PURPOSE.REGULAR, targetScore: 5, status,
  sides: [], winnerParticipationId: null, comment: null, version: 1, recordedAt: null, validatedAt: null, validatedBy: null
})
const edition = (status: EDITION_STATUS, validated = 68) => ({
  id: 'e1', year: 2026, status, participants: Array.from({ length: 45 }), pools: Array.from({ length: 8 }),
  rounds: [{ id: 'r1', kind: ROUND_KIND.POOLS, sequence: 1, status: ROUND_STATUS.PLAYING, matchCount: 105, validatedMatchCount: validated }]
})
const draw = { id: 'd1', kind: DRAW_KIND.POOLS, roundKind: null, status: DRAW_STATUS.VALIDATED, parameters: { poolCount: 8, seedCount: 8 }, createdAt: '2026-11-01T10:00:00Z', validatedAt: null, assignments: [], createdBy: null, validatedBy: null }
const activity = [{
  kind: ADMIN_ACTIVITY_KIND.MATCH_VALIDATED, at: '2026-11-02T10:00:00Z', actor: { id: 'u1', displayName: 'Administrateur' },
  target: {
    type: ADMIN_ACTIVITY_TARGET.MATCH, id: 'm1', matchSequence: 1, roundKind: ROUND_KIND.POOLS, poolNumber: 4,
    sides: [
      { participationId: 'a', competitorId: 'ca', displayName: 'Manon Faure', score: 5 },
      { participationId: 'b', competitorId: 'cb', displayName: 'Théo Gauthier', score: 4 }
    ]
  }
}]

describe('page /admin, tableau de bord (F-07)', () => {
  let editionStatus = EDITION_STATUS.POOLS_PLAYING
  let editionFailure: { status: number, code: API_ERROR_CODE } | null = null
  let activityFailure = true
  registerEndpoint('/api/v1/editions/e1', defineEventHandler((event) => {
    if (editionFailure) {
      setResponseStatus(event, editionFailure.status)
      return { statusCode: editionFailure.status, code: editionFailure.code, message: 'x' }
    }
    return edition(editionStatus)
  }))
  registerEndpoint('/api/v1/admin/editions/e1/matchs', defineEventHandler(() => [
    ...Array.from({ length: 7 }, (_, index) => adminMatch(`r${index}`, MATCH_STATUS.RECORDED)),
    ...Array.from({ length: 30 }, (_, index) => adminMatch(`s${index}`, MATCH_STATUS.SCHEDULED))
  ]))
  registerEndpoint('/api/v1/admin/editions/e1/tirages', defineEventHandler(() => [draw]))
  registerEndpoint('/api/v1/admin/editions/e1/activite', defineEventHandler((event) => {
    if (activityFailure) {
      setResponseStatus(event, 500)
      return { statusCode: 500, code: API_ERROR_CODE.INTERNAL_ERROR, message: 'x' }
    }
    return activity
  }))

  beforeEach(() => {
    editionStatus = EDITION_STATUS.POOLS_PLAYING
    editionFailure = null
    activityFailure = true
    clearNuxtData()
    useAdminEditionStore(useNuxtApp().$pinia).editionId = 'e1'
  })

  it('la route du flux d’activité est livrée (B-15 mergé) : plus de pendingTicket (ARCH-11)', () => {
    expect(API_ROUTES[API_ENDPOINT.ADMIN_ACTIVITY].pendingTicket).toBeUndefined()
  })

  it('rend un h1 « Édition 2026 », le centre de contrôle à neuf étapes dont l’étape 4 active, les trois cartes et le bouton avec son compteur', async () => {
    const wrapper = await mountPage()
    await vi.waitFor(() => expect(wrapper.find('[data-cy="admin-control-center"]').exists()).toBe(true))
    expect(wrapper.findAll('h1')).toHaveLength(1)
    expect(wrapper.get('h1').text()).toBe('Édition 2026')
    expect(wrapper.get('[data-cy="admin-control-center-progress"]').text()).toBe('Étape 4 sur 9')
    expect(wrapper.findAll('[data-cy^="stepper-item-"]')).toHaveLength(9)
    expect(wrapper.get('[data-cy="stepper-item-3"]').text()).toContain('En cours · 68 / 105 validés · 7 saisis · 30 sans score')
    expect(wrapper.get('[data-cy="stepper-item-3"]').attributes('aria-current')).toBe('step')
    expect(wrapper.get('[data-cy="stepper-item-0"]').text()).toContain('Fait')
    expect(wrapper.get('[data-cy="stepper-item-8"]').text()).toContain('À venir')
    expect(wrapper.get('[data-cy="admin-todo-recorded"]').text()).toContain('7')
    expect(wrapper.get('[data-cy="admin-todo-scheduled"]').text()).toContain('30')
    expect(wrapper.get('[data-cy="admin-todo-draws"]').text()).toContain('0')
    expect(wrapper.get('[data-cy="admin-dashboard-cta"]').text()).toContain('Valider les scores saisis')
    expect(wrapper.get('[data-cy="admin-dashboard-cta"]').text()).toContain('7')
  })

  it('route d’activité absente ou en erreur : le bloc affiche l’état d’erreur d’AsyncState et le reste de la page reste complet', async () => {
    const wrapper = await mountPage()
    await vi.waitFor(() => expect(wrapper.find('[data-cy="admin-activity"] [data-cy="async-state-error"]').exists()).toBe(true))
    expect(wrapper.find('[data-cy="admin-control-center"]').exists()).toBe(true)
    expect(wrapper.find('[data-cy="admin-todo"]').exists()).toBe(true)
    expect(wrapper.find('[data-cy="admin-dashboard-issue"]').exists()).toBe(false)
  })

  it('route d’activité disponible : les validations s’affichent avec leur pastille et leur contexte', async () => {
    activityFailure = false
    const wrapper = await mountPage()
    await vi.waitFor(() => expect(wrapper.find('[data-cy="admin-activity-MATCH_VALIDATED:m1:2026-11-02T10:00:00Z"]').exists()).toBe(true))
    const row = wrapper.get('[data-cy="admin-activity-MATCH_VALIDATED:m1:2026-11-02T10:00:00Z"]').text()
    const list = wrapper.get('[data-cy="admin-activity"] .activity__list')
    expect(list.element.tagName).toBe('UL')
    expect(list.attributes('tabindex')).toBeUndefined()
    expect(wrapper.get('[data-cy="admin-activity-MATCH_VALIDATED:m1:2026-11-02T10:00:00Z"]').element.tagName).toBe('LI')
    expect(row).toContain('Match validé')
    expect(row).toContain('Manon Faure')
    expect(row).toContain('5–4')
    expect(row).toContain('Poule 4')
  })

  it('édition clôturée : lecture seule, toutes les étapes faites, bouton de validation inactif', async () => {
    editionStatus = EDITION_STATUS.CLOSED
    const wrapper = await mountPage()
    await vi.waitFor(() => expect(wrapper.find('[data-cy="admin-dashboard-archived"]').exists()).toBe(true))
    expect(wrapper.get('[data-cy="admin-control-center-progress"]').text()).toBe('Édition clôturée')
    expect(wrapper.get('[data-cy="admin-dashboard-cta"]').attributes('disabled')).toBeDefined()
  })

  it('403 : permission refusée, sans centre de contrôle', async () => {
    editionFailure = { status: 403, code: API_ERROR_CODE.FORBIDDEN }
    const wrapper = await mountPage()
    await vi.waitFor(() => expect(wrapper.find('[data-cy="admin-dashboard-issue"]').exists()).toBe(true))
    expect(wrapper.get('[data-cy="admin-dashboard-issue"]').text()).toContain('Accès refusé')
    expect(wrapper.find('[data-cy="admin-control-center"]').exists()).toBe(false)
  })

  it('404 : édition inexistante', async () => {
    editionFailure = { status: 404, code: API_ERROR_CODE.NOT_FOUND }
    const wrapper = await mountPage()
    await vi.waitFor(() => expect(wrapper.find('[data-cy="admin-dashboard-issue"]').exists()).toBe(true))
    expect(wrapper.get('[data-cy="admin-dashboard-issue"]').text()).toContain('Édition introuvable')
  })

  it('401 : session expirée avec le lien pour se reconnecter', async () => {
    editionFailure = { status: 401, code: API_ERROR_CODE.UNAUTHORIZED }
    const wrapper = await mountPage()
    await vi.waitFor(() => expect(wrapper.find('[data-cy="admin-dashboard-issue"]').exists()).toBe(true))
    expect(wrapper.get('[data-cy="admin-dashboard-issue"]').text()).toContain('Votre session a expiré')
    expect(wrapper.get('[data-cy="admin-dashboard-login"]').text()).toBe('Se reconnecter')
  })

  it('500 : état d’erreur d’AsyncState avec nouvelle tentative', async () => {
    editionFailure = { status: 500, code: API_ERROR_CODE.INTERNAL_ERROR }
    const wrapper = await mountPage()
    await vi.waitFor(() => expect(wrapper.find('[data-cy="async-state-error"]').exists()).toBe(true))
    expect(wrapper.find('[data-cy="async-state-retry"]').exists()).toBe(true)
  })

  it('aucune édition active : état vide', async () => {
    useAdminEditionStore(useNuxtApp().$pinia).editionId = null
    const wrapper = await mountPage()
    await vi.waitFor(() => expect(wrapper.find('[data-cy="async-state-empty"]').exists()).toBe(true))
    expect(wrapper.get('h1').text()).toBe('Tableau de bord')
  })
})
