import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { defineEventHandler, getHeader, getQuery, readBody, setResponseStatus } from 'h3'
import { flushPromises } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '../../../src/composables/useAuthStore'
import { ROUTES } from '../../../src/consts/routes.const'
import { API_ERROR_CODE } from '../../../src/enums/api-error-code.enum'
import { USER_ROLE } from '../../../src/enums/user.enum'
import type { ICompetitorDetail, ICompetitorListItem } from '../../../src/interfaces/competitor.interface'
import { CompetitorService } from '../../../src/services/competitor.service'
import { buildMe } from '../../helpers/me'
import CompetitorIdentityForm from '~/components/admin/competitors/CompetitorIdentityForm.vue'
import CompetitorsIndexPage from '~/pages/admin/competiteurs/index.vue'
import CompetitorPage from '~/pages/admin/competiteurs/[id].vue'

/*********************************************************
 * F-13 : admin, compétiteurs (annuaire, correction d'identité avec If-Match)
 *
 * @description
 * Tests de composant et de page contre des routes simulées (`registerEndpoint`). Le contrat de version (T-SEC-10) est vérifié
 * sur l'en-tête réellement envoyé : sans lui le serveur répond 428, et 428 est un défaut du front. Les mêmes parcours sur la
 * vraie base sont dans `tests/e2e/writes/F-13.spec.ts`.
 ********************************************************/
const LOU = '00000000-0000-4000-8000-0000000000c1'
const MAYA = '00000000-0000-4000-8000-0000000000c2'

const item = (id: string, displayName: string, overrides: Partial<ICompetitorListItem> = {}): ICompetitorListItem => ({
  id,
  displayName,
  firstName: null,
  lastName: null,
  nickname: null,
  avatarUrl: null,
  titles: 0,
  editionsPlayed: 2,
  matchesPlayed: 0,
  wins: 0,
  losses: 0,
  unknownResults: 0,
  firstEditionCode: null,
  ...overrides
})

const detail = (overrides: Partial<ICompetitorDetail> = {}): ICompetitorDetail => ({
  id: LOU,
  displayName: 'Lou Bernard',
  firstName: 'Lou',
  lastName: 'Bernard',
  nickname: 'La Mousse',
  avatarUrl: null,
  version: 3,
  participations: [],
  stats: { played: 0, wins: 0, losses: 0, unknownResults: 0, pointsFor: 0, pointsAgainst: 0, titles: 0 },
  ...overrides
})

const apiError = (statusCode: number, code: API_ERROR_CODE) => ({ statusCode, code, message: code })

beforeEach(() => {
  clearNuxtData()
  useAuthStore(useNuxtApp().$pinia).setMe(buildMe(USER_ROLE.ADMIN))
})

interface IBackend {
  patched: ReturnType<typeof vi.fn>
  listQueries: ReturnType<typeof vi.fn>
}

/** Un annuaire de deux profils et la fiche de Lou ; le PATCH enregistre ce qu'il reçoit. `patch` décide de la réponse. */
const registerBackend = (patch?: (version: number) => { status: number, body: unknown } | null): IBackend => {
  const patched = vi.fn()
  const listQueries = vi.fn()
  let current = detail()
  registerEndpoint('/api/v1/competiteurs', defineEventHandler((event) => {
    listQueries(getQuery(event))
    const items = [item(LOU, current.displayName, { firstName: current.firstName, lastName: current.lastName, nickname: current.nickname }), item(MAYA, 'Maya Roux')]
    return { items, total: 145, page: 1, pageSize: 10 }
  }))
  registerEndpoint(`/api/v1/competiteurs/${LOU}`, defineEventHandler(async (event) => {
    if (event.method === 'PATCH') {
      const body = await readBody(event)
      const header = getHeader(event, 'if-match')
      patched(header, body)
      const version = Number(/\d+/.exec(header ?? '')?.[0])
      const forced = patch?.(version)
      if (forced) {
        setResponseStatus(event, forced.status)
        return forced.body
      }
      current = { ...current, ...body, version: current.version + 1 }
      return { id: LOU, displayName: current.displayName, firstName: current.firstName, lastName: current.lastName, nickname: current.nickname, avatarUrl: null, version: current.version }
    }
    return current
  }))
  return { patched, listQueries }
}

const settle = async (wrapper: Pick<VueWrapper, 'findAll'>) => {
  await flushPromises()
  await vi.waitFor(() => expect(wrapper.findAll('[data-cy="competitor-form-submit"][aria-busy="true"]')).toHaveLength(0))
  await flushPromises()
}

const mountPage = (id = LOU) => mountSuspended(CompetitorPage, { route: `/admin/competiteurs/${id}`, global: { components: { RouterLink } } })

describe('service : correction d’identité', () => {
  it('le PATCH porte If-Match "<version>" et un corps JSON sans version', async () => {
    const backend = registerBackend()
    await new CompetitorService().updateIdentity(LOU, { displayName: 'Lou B.' }, 3)
    expect(backend.patched).toHaveBeenCalledWith('"3"', { displayName: 'Lou B.' })
  })
})

describe('formulaire d’identité', () => {
  const mountForm = (props: Record<string, unknown> = {}) => mountSuspended(CompetitorIdentityForm, {
    props: { competitor: detail(), values: { displayName: 'Lou Bernard', firstName: 'Lou', lastName: 'Bernard', nickname: 'La Mousse' }, ...props }
  })

  it('montre le nom affiché en titre, les quatre champs et le nom affiché obligatoire (astérisque)', async () => {
    const wrapper = await mountForm()
    expect(wrapper.get('[data-cy="competitor-form-title"]').text()).toBe('Lou Bernard')
    expect((wrapper.get('[data-cy="competitor-form-first-name"] input').element as HTMLInputElement).value).toBe('Lou')
    expect((wrapper.get('[data-cy="competitor-form-nickname"] input').element as HTMLInputElement).value).toBe('La Mousse')
    expect(wrapper.text()).toContain('Utilisé partout sur le site public.')
    expect(wrapper.findAll('label').filter(label => label.text().includes('*'))).toHaveLength(1)
  })

  it('un nom affiché vide bloque l’envoi, avec le message sous le champ', async () => {
    const wrapper = await mountForm()
    await wrapper.get('[data-cy="competitor-form-display-name"] input').setValue('   ')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.get('[data-cy="competitor-form-display-name"]').text()).toContain('Champ obligatoire')
  })

  it('des valeurs valides sont émises', async () => {
    const wrapper = await mountForm()
    await wrapper.get('[data-cy="competitor-form-nickname"] input').setValue('')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.emitted('submit')![0]![0]).toEqual({ displayName: 'Lou Bernard', firstName: 'Lou', lastName: 'Bernard', nickname: '' })
  })

  it('affiche l’erreur de l’API dans une alerte, formulaire conservé', async () => {
    const wrapper = await mountForm({
      failure: { title: { key: 'admin.competitors.error_version_title', fallback: 'x' }, text: { key: 'admin.competitors.error_version_text', fallback: 'y' }, statusCode: 412, code: API_ERROR_CODE.VERSION_CONFLICT }
    })
    expect(wrapper.get('[data-cy="competitor-form-error"]').text()).toContain('Ce compétiteur a été modifié, rechargez.')
    expect(wrapper.get('[data-cy="competitor-form-error"]').attributes('role')).toBe('alert')
  })

  it('la confirmation passe par un snackbar de succès fermé par défaut', async () => {
    const closed = await mountForm()
    expect(closed.findComponent({ name: 'OrigamSnackbar' }).props('modelValue')).toBe(false)
    const open = await mountForm({ saved: true })
    expect(open.findComponent({ name: 'OrigamSnackbar' }).props()).toMatchObject({ modelValue: true, status: 'success', location: 'bottom', timeout: 4000 })
  })
})

describe('page annuaire', () => {
  it('liste les compétiteurs, le décompte, « Corriger » vers la fiche, et invite à choisir', async () => {
    registerBackend()
    const wrapper = await mountSuspended(CompetitorsIndexPage, { route: ROUTES.ADMIN_COMPETITORS, global: { components: { RouterLink } } })
    await flushPromises()
    expect(wrapper.findAll('h1')).toHaveLength(1)
    expect(wrapper.get('[data-cy="page-title"]').text()).toBe('Compétiteurs')
    expect(wrapper.get('[data-cy="competitors-count"]').text()).toBe('145 compétiteurs')
    expect(wrapper.get('[data-cy="competitors-table"]').text()).toContain('Maya Roux')
    expect(wrapper.get(`[data-cy="competitors-action-${MAYA}"]`).attributes('href')).toBe(`/admin/competiteurs/${MAYA}`)
    expect(wrapper.get(`[data-cy="competitors-action-${MAYA}"]`).attributes('aria-label')).toBe('Corriger l’identité de Maya Roux')
    expect(wrapper.get('[data-cy="competitors-pager-range"]').text()).toBe('1–10 sur 145')
    expect(wrapper.get('[data-cy="competitors-select-hint"]').text()).toContain('Corriger')
    expect(wrapper.find('[data-cy="competitor-form"]').exists()).toBe(false)
  })

  it('une recherche d’un seul caractère n’est pas envoyée, deux caractères le sont', async () => {
    const backend = registerBackend()
    const wrapper = await mountSuspended(CompetitorsIndexPage, { route: ROUTES.ADMIN_COMPETITORS, global: { components: { RouterLink } } })
    await flushPromises()
    await wrapper.get('[data-cy="competitors-search"] input').setValue('m')
    await new Promise(resolve => setTimeout(resolve, 400))
    await flushPromises()
    expect(backend.listQueries.mock.calls.every(([query]) => query.q === undefined)).toBe(true)
    await wrapper.get('[data-cy="competitors-search"] input').setValue('ma')
    await vi.waitFor(() => expect(backend.listQueries.mock.calls.some(([query]) => query.q === 'ma')).toBe(true), { timeout: 2000 })
  })

  it('erreur serveur : alerte avec nouvelle tentative', async () => {
    registerEndpoint('/api/v1/competiteurs', defineEventHandler((event) => {
      setResponseStatus(event, 500)
      return apiError(500, API_ERROR_CODE.INTERNAL_ERROR)
    }))
    const wrapper = await mountSuspended(CompetitorsIndexPage, { route: ROUTES.ADMIN_COMPETITORS, global: { components: { RouterLink } } })
    await flushPromises()
    expect(wrapper.find('[data-cy="async-state-error"]').exists()).toBe(true)
  })

  it('aucun résultat : état vide', async () => {
    registerEndpoint('/api/v1/competiteurs', defineEventHandler(() => ({ items: [], total: 0, page: 1, pageSize: 10 })))
    const wrapper = await mountSuspended(CompetitorsIndexPage, { route: ROUTES.ADMIN_COMPETITORS, global: { components: { RouterLink } } })
    await flushPromises()
    expect(wrapper.find('[data-cy="async-state-empty"]').exists()).toBe(true)
    expect(wrapper.get('[data-cy="competitors-count"]').text()).toBe('0 compétiteurs')
  })
})

describe('page de correction', () => {
  it('charge la fiche, marque la ligne, et envoie les changements avec If-Match de la version lue', async () => {
    const backend = registerBackend()
    const wrapper = await mountPage()
    await flushPromises()
    expect(wrapper.get('[data-cy="competitor-form-title"]').text()).toBe('Lou Bernard')
    expect(wrapper.findAll('[aria-current="true"]')).toHaveLength(1)
    await wrapper.get('[data-cy="competitor-form-display-name"] input').setValue('Lou B.')
    await wrapper.get('[data-cy="competitor-form-last-name"] input').setValue('')
    await wrapper.get('[data-cy="competitor-form"]').trigger('submit')
    await settle(wrapper)
    expect(backend.patched).toHaveBeenCalledWith('"3"', { displayName: 'Lou B.', firstName: 'Lou', lastName: null, nickname: 'La Mousse' })
    expect(wrapper.get('[data-cy="competitor-form-title"]').text()).toBe('Lou B.')
    expect(wrapper.findComponent({ name: 'OrigamSnackbar' }).props('modelValue')).toBe(true)
  })

  it('la version suivante est utilisée pour un second enregistrement', async () => {
    const backend = registerBackend()
    const wrapper = await mountPage()
    await flushPromises()
    await wrapper.get('[data-cy="competitor-form-nickname"] input').setValue('Mousse')
    await wrapper.get('[data-cy="competitor-form"]').trigger('submit')
    await settle(wrapper)
    await wrapper.get('[data-cy="competitor-form-nickname"] input').setValue('Mousse 2')
    await wrapper.get('[data-cy="competitor-form"]').trigger('submit')
    await settle(wrapper)
    expect(backend.patched.mock.calls.map(([header]) => header)).toEqual(['"3"', '"4"'])
  })

  it('412 VERSION_CONFLICT : message traduit et fiche rechargée avec les valeurs actuelles', async () => {
    let stale = true
    const backend = registerBackend((version) => {
      if (stale) {
        stale = false
        return { status: 412, body: { statusCode: 412, code: API_ERROR_CODE.VERSION_CONFLICT, message: 'x', details: { currentVersion: version + 1 } } }
      }
      return null
    })
    const wrapper = await mountPage()
    await flushPromises()
    await wrapper.get('[data-cy="competitor-form-nickname"] input').setValue('Autre')
    await wrapper.get('[data-cy="competitor-form"]').trigger('submit')
    await settle(wrapper)
    expect(wrapper.get('[data-cy="competitor-form-error"]').text()).toContain('Ce compétiteur a été modifié, rechargez.')
    expect(backend.patched).toHaveBeenCalledTimes(1)
    expect((wrapper.get('[data-cy="competitor-form-nickname"] input').element as HTMLInputElement).value).toBe('La Mousse')
  })

  it('428 PRECONDITION_REQUIRED : message de défaut, aucune boucle de réessai', async () => {
    const backend = registerBackend(() => ({ status: 428, body: apiError(428, API_ERROR_CODE.PRECONDITION_REQUIRED) }))
    const wrapper = await mountPage()
    await flushPromises()
    await wrapper.get('[data-cy="competitor-form"]').trigger('submit')
    await settle(wrapper)
    expect(wrapper.get('[data-cy="competitor-form-error"]').text()).toContain('Enregistrement impossible.')
    expect(backend.patched).toHaveBeenCalledTimes(1)
  })

  it('400 de validation : alerte d’erreur', async () => {
    registerBackend(() => ({ status: 400, body: apiError(400, API_ERROR_CODE.VALIDATION_FAILED) }))
    const wrapper = await mountPage()
    await flushPromises()
    await wrapper.get('[data-cy="competitor-form"]').trigger('submit')
    await settle(wrapper)
    expect(wrapper.get('[data-cy="competitor-form-error"]').text()).toContain('Le formulaire contient une erreur.')
  })

  it('compétiteur inconnu : état d’erreur, aucun formulaire', async () => {
    registerBackend()
    registerEndpoint(`/api/v1/competiteurs/${MAYA}`, defineEventHandler((event) => {
      setResponseStatus(event, 404)
      return apiError(404, API_ERROR_CODE.COMPETITOR_NOT_FOUND)
    }))
    const wrapper = await mountPage(MAYA)
    await flushPromises()
    expect(wrapper.find('[data-cy="competitor-form"]').exists()).toBe(false)
    expect(wrapper.find('[data-cy="async-state-error"]').exists()).toBe(true)
  })
})
