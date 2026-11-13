import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import { flushPromises } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RouterLink } from 'vue-router'
import { API_ERROR_CODE } from '../../../src/enums/api-error-code.enum'
import { EDITION_FORM_MODE } from '../../../src/enums/admin-editions.enum'
import { EDITION_ORIGIN, EDITION_STATUS } from '../../../src/enums/edition.enum'
import { USER_ROLE } from '../../../src/enums/user.enum'
import { useAuthStore } from '../../../src/composables/useAuthStore'
import { buildMe } from '../../helpers/me'
import type { IEditionFormValues } from '../../../src/interfaces/admin-editions.interface'
import type { IAdminFailure } from '../../../src/interfaces/admin-failure.interface'
import type { IEditionDetail, IEditionSummary } from '../../../src/interfaces/edition.interface'
import { EditionService } from '../../../src/services/edition.service'
import { ROUTES } from '../../../src/consts/routes.const'
import { emptyEditionFormValues } from '../../../src/utils/admin-editions.util'
import EditionClosed from '~/components/admin/editions/EditionClosed.vue'
import EditionForm from '~/components/admin/editions/EditionForm.vue'
import EditionsPage from '~/pages/admin/editions/index.vue'
import EditionNewPage from '~/pages/admin/editions/nouvelle.vue'
import EditionPage from '~/pages/admin/editions/[code].vue'

/*********************************************************
 * F-13 : admin, éditions (liste, création, modification, clôturée)
 *
 * @description
 * Tests de composant et de page contre des routes simulées (`registerEndpoint`). Les mêmes parcours sur la vraie base sont dans
 * `tests/e2e/writes/F-13.spec.ts`.
 ********************************************************/
const EDITION_ID = '00000000-0000-4000-8000-0000000000e1'

const summary = (overrides: Partial<IEditionSummary> = {}): IEditionSummary => ({
  id: EDITION_ID,
  code: '2026',
  year: 2026,
  name: null,
  heldOn: null,
  location: null,
  status: EDITION_STATUS.POOLS_PLAYING,
  origin: EDITION_ORIGIN.APP,
  participantCount: null,
  unidentifiedParticipantCount: null,
  matchCount: 0,
  scoredMatchCount: 0,
  unknownResultMatchCount: 0,
  champion: null,
  final: null,
  semiFinalists: [],
  ...overrides
})

const detail = (overrides: Partial<IEditionDetail> = {}): IEditionDetail => ({
  ...summary(),
  description: null,
  closedAt: null,
  participants: [],
  pools: [],
  rounds: [],
  matches: [],
  draws: [],
  bracket: [],
  ...overrides
})

beforeEach(() => {
  clearNuxtData()
  useAuthStore(useNuxtApp().$pinia).setMe(buildMe(USER_ROLE.ADMIN))
})

const settle = async (wrapper: Pick<VueWrapper, 'findAll'>) => {
  await flushPromises()
  await vi.waitFor(() => expect(wrapper.findAll('[data-cy="edition-form-submit"][aria-busy="true"]')).toHaveLength(0))
  await flushPromises()
}

const apiError = (statusCode: number, code: API_ERROR_CODE) => ({ statusCode, code, message: code })

const VALID: IEditionFormValues = { year: '2027', name: 'Championnat de Caps 2027', heldOn: null, location: '', description: '' }

const savedSnackbar = (wrapper: Pick<VueWrapper, 'findComponent'>) => wrapper.findComponent({ name: 'OrigamSnackbar' })

const mountForm = (props: Record<string, unknown> = {}) => mountSuspended(EditionForm, {
  props: { mode: EDITION_FORM_MODE.CREATE, values: emptyEditionFormValues(), pending: false, failure: null, ...props },
  global: { components: { RouterLink } }
})

describe('service des éditions : verbes et corps', () => {
  it('la création est un POST /editions au corps JSON, sans code', async () => {
    const seen = vi.fn()
    registerEndpoint('/api/v1/editions', defineEventHandler(async (event) => {
      if (event.method === 'POST') {
        seen(event.method, await readBody(event))
        setResponseStatus(event, 201)
        return summary({ code: '2027', year: 2027 })
      }
      return []
    }))
    const created = await new EditionService().create({ year: 2027, name: 'N' })
    expect(created.code).toBe('2027')
    expect(seen).toHaveBeenCalledWith('POST', { year: 2027, name: 'N' })
  })

  it('la modification est un PATCH /editions/{id} au corps JSON', async () => {
    const seen = vi.fn()
    registerEndpoint(`/api/v1/editions/${EDITION_ID}`, defineEventHandler(async (event) => {
      if (event.method === 'PATCH') {
        seen(event.method, await readBody(event))
        return summary({ name: 'Nouveau' })
      }
      return detail()
    }))
    await new EditionService().update(EDITION_ID, { name: 'Nouveau', heldOn: null })
    expect(seen).toHaveBeenCalledWith('PATCH', { name: 'Nouveau', heldOn: null })
  })
})

describe('formulaire de création', () => {
  it('champ Année : texte au clavier numérique, 4 caractères, pas de champ numérique (87eea8e)', async () => {
    const wrapper = await mountForm()
    const input = wrapper.get('[data-cy="edition-form-year"] input')
    expect(input.attributes('inputmode')).toBe('numeric')
    expect(input.attributes('maxlength')).toBe('4')
    expect(input.attributes('type')).not.toBe('number')
  })

  it('annonce que le code est généré par le serveur, dans une alerte info, et ne propose aucun champ Code', async () => {
    const wrapper = await mountForm()
    const info = wrapper.get('[data-cy="edition-form-code-info"]')
    expect(info.text()).toContain('le serveur le génère')
    expect(info.attributes('role')).toBe('status')
    expect(wrapper.find('[data-cy="edition-form-code"]').exists()).toBe(false)
  })

  it('une année vide ou à 2 chiffres bloque l’envoi, avec le message sous le champ ; « 27 » reste « 27 »', async () => {
    const wrapper = await mountForm()
    await wrapper.get('[data-cy="edition-form-name"] input').setValue('Championnat')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.get('[data-cy="edition-form-year"]').text()).toContain('année sur 4 chiffres')

    await wrapper.get('[data-cy="edition-form-year"] input').setValue('27')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.emitted('submit')).toBeUndefined()
    expect((wrapper.get('[data-cy="edition-form-year"] input').element as HTMLInputElement).value).toBe('27')
    expect(wrapper.get('[data-cy="edition-form-year"]').text()).toContain('année sur 4 chiffres')
  })

  it('une année hors bornes (1999) est refusée avec son message', async () => {
    const wrapper = await mountForm()
    await wrapper.get('[data-cy="edition-form-year"] input').setValue('1999')
    await wrapper.get('[data-cy="edition-form-name"] input').setValue('x')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.get('[data-cy="edition-form-year"]').text()).toContain('entre 2000 et 2100')
  })

  it('le nom est obligatoire à la création (le serveur le refuse vide)', async () => {
    const wrapper = await mountForm()
    await wrapper.get('[data-cy="edition-form-year"] input').setValue('2027')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.get('[data-cy="edition-form-name"]').text()).toContain('Champ obligatoire')
  })

  it('des valeurs valides sont émises', async () => {
    const wrapper = await mountForm()
    await wrapper.get('[data-cy="edition-form-year"] input').setValue(VALID.year)
    await wrapper.get('[data-cy="edition-form-name"] input').setValue(VALID.name)
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.emitted('submit')).toHaveLength(1)
    expect(wrapper.emitted('submit')![0]![0]).toMatchObject({ year: '2027', name: 'Championnat de Caps 2027', heldOn: null })
  })

  it('une erreur de l’API s’affiche dans une alerte d’erreur, formulaire conservé', async () => {
    const failure = { title: { key: 'admin.editions.error_code_exhausted_title', fallback: 'x' }, text: { key: 'admin.editions.error_code_exhausted_text', fallback: 'y' }, statusCode: 409, code: API_ERROR_CODE.EDITION_CODE_EXHAUSTED }
    const wrapper = await mountForm({ values: VALID, failure })
    const alert = wrapper.get('[data-cy="edition-form-error"]')
    expect(alert.text()).toContain('Plus aucun code disponible pour cette année.')
    expect(alert.attributes('role')).toBe('alert')
    expect((wrapper.get('[data-cy="edition-form-name"] input').element as HTMLInputElement).value).toBe(VALID.name)
  })

  it('pendant l’envoi, le bouton principal est en chargement et Annuler est désactivé', async () => {
    const wrapper = await mountForm({ pending: true })
    expect(wrapper.get('[data-cy="edition-form-cancel"]').attributes('disabled')).toBeDefined()
  })
})

describe('formulaire de modification', () => {
  const mountEdit = (overrides: Partial<IEditionSummary> = {}, props: Record<string, unknown> = {}) => mountForm({
    mode: EDITION_FORM_MODE.EDIT,
    edition: summary(overrides),
    values: { year: '2026', name: 'Édition 2026', heldOn: null, location: 'Lyon', description: '' },
    ...props
  })

  it('ne propose pas l’année, montre code, année et statut en lecture seule (R-9)', async () => {
    const wrapper = await mountEdit()
    expect(wrapper.find('[data-cy="edition-form-year"]').exists()).toBe(false)
    expect(wrapper.get('[data-cy="edition-readonly-code"]').text()).toContain('2026')
    expect(wrapper.get('[data-cy="edition-readonly-year"]').text()).toContain('2026')
    expect(wrapper.get('[data-cy="edition-readonly-status"]').text()).toContain('Phase de poules')
    expect(wrapper.find('[data-cy="edition-form-code-info"]').exists()).toBe(false)
  })

  it('reprend les valeurs de l’édition et émet les modifications', async () => {
    const wrapper = await mountEdit()
    expect((wrapper.get('[data-cy="edition-form-location"] input').element as HTMLInputElement).value).toBe('Lyon')
    await wrapper.get('[data-cy="edition-form-location"] input').setValue('Paris')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.emitted('submit')![0]![0]).toMatchObject({ name: 'Édition 2026', location: 'Paris' })
  })

  it('un nom vide est accepté en modification (édition sans nom) : il n’est simplement pas envoyé', async () => {
    const wrapper = await mountEdit({}, { values: { year: '2026', name: '', heldOn: null, location: '', description: '' } })
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.emitted('submit')).toHaveLength(1)
  })

  it('affiche la confirmation après un enregistrement', async () => {
    const wrapper = await mountEdit({}, { saved: true })
    expect(savedSnackbar(wrapper).props()).toMatchObject({ modelValue: true, status: 'success', location: 'bottom', timeout: 4000, text: 'Modifications enregistrées' })
  })

  it('sans enregistrement, le snackbar est fermé', async () => {
    const wrapper = await mountEdit()
    expect(savedSnackbar(wrapper).props('modelValue')).toBe(false)
  })

  it('le nom n’est marqué obligatoire (astérisque) qu’à la création, l’année toujours à la création', async () => {
    const edit = await mountEdit()
    const create = await mountForm()
    expect(edit.get('label[for]').text()).not.toContain('*')
    expect(edit.text()).not.toContain('*')
    const labels = create.findAll('label').map(label => label.text())
    expect(labels.filter(text => text.includes('*'))).toHaveLength(2)
    expect(create.get('[data-cy="edition-form-name"] input').attributes('required')).toBeDefined()
  })
})

describe('édition clôturée', () => {
  const mountClosed = (failure: IAdminFailure | null = null) => mountSuspended(EditionClosed, {
    props: { edition: detail({ code: '2025', year: 2025, status: EDITION_STATUS.CLOSED, participantCount: 45 }), failure }
  })

  it('bandeau info compact « Édition clôturée » (role=status) et champs en lecture seule, sans formulaire', async () => {
    const wrapper = await mountClosed()
    const notice = wrapper.get('[data-cy="edition-closed-notice"]')
    expect(notice.text()).toContain('Édition clôturée')
    expect(notice.text()).toContain('figés')
    expect(notice.attributes('role')).toBe('status')
    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.get('[data-cy="edition-readonly-participants"]').text()).toContain('45')
    expect(wrapper.get('[data-cy="edition-readonly-name"]').text()).toContain('Non renseigné')
    expect(wrapper.get('[data-cy="edition-readonly-date"]').text()).toContain('Non renseigné')
  })

  it('un 409 EDITION_CLOSED est traduit dans une alerte d’erreur', async () => {
    const wrapper = await mountClosed({
      title: { key: 'admin.editions.error_closed_title', fallback: 'x' },
      text: { key: 'admin.editions.error_closed_text', fallback: 'y', params: { code: '2025' } },
      statusCode: 409,
      code: API_ERROR_CODE.EDITION_CLOSED
    })
    const alert = wrapper.get('[data-cy="edition-closed-error"]')
    expect(alert.text()).toContain('Modification refusée.')
    expect(alert.text()).toContain('L’édition 2025 est clôturée')
  })
})

describe('page liste des éditions', () => {
  const mountList = () => mountSuspended(EditionsPage, { route: ROUTES.ADMIN_EDITIONS, global: { components: { RouterLink } } })

  it('liste les éditions, « Non renseigné » pour l’archive, Consulter pour une clôturée et Modifier sinon', async () => {
    registerEndpoint('/api/v1/editions', defineEventHandler(() => [
      summary({ participantCount: null }),
      summary({ id: 'c', code: '2025', year: 2025, status: EDITION_STATUS.CLOSED, origin: EDITION_ORIGIN.LEGACY_IMPORT, participantCount: 45 })
    ]))
    const wrapper = await mountList()
    await flushPromises()
    expect(wrapper.findAll('h1')).toHaveLength(1)
    expect(wrapper.get('[data-cy="page-title"]').text()).toBe('Éditions')
    expect(wrapper.get('[data-cy="editions-table"]').text()).toContain('Non renseigné')
    expect(wrapper.get('[data-cy="editions-action-2026"]').text()).toBe('Modifier')
    expect(wrapper.get('[data-cy="editions-action-2026"]').attributes('aria-label')).toBe('Modifier l’édition 2026')
    expect(wrapper.get('[data-cy="editions-action-2025"]').text()).toBe('Consulter')
    expect(wrapper.get('[data-cy="editions-action-2025"]').attributes('href')).toBe('/admin/editions/2025')
    expect(wrapper.get('[data-cy="editions-create"]').attributes('href')).toBe('/admin/editions/nouvelle')
    expect(wrapper.get('[data-cy="editions-table"]').text()).toContain('45')
  })

  it('la recherche filtre par code ou année et annonce l’absence de résultat', async () => {
    registerEndpoint('/api/v1/editions', defineEventHandler(() => [summary(), summary({ id: 'c', code: '2025', year: 2025 })]))
    const wrapper = await mountList()
    await flushPromises()
    await wrapper.get('[data-cy="editions-search"] input').setValue('2025')
    await flushPromises()
    expect(wrapper.find('[data-cy="editions-action-2026"]').exists()).toBe(false)
    expect(wrapper.find('[data-cy="editions-action-2025"]').exists()).toBe(true)
    await wrapper.get('[data-cy="editions-search"] input').setValue('1999')
    await flushPromises()
    expect(wrapper.get('[data-cy="editions-no-match"]').text()).toContain('Aucune édition ne correspond')
  })

  it('liste vide : état vide, sans tableau', async () => {
    registerEndpoint('/api/v1/editions', defineEventHandler(() => []))
    const wrapper = await mountList()
    await flushPromises()
    expect(wrapper.find('[data-cy="async-state-empty"]').exists()).toBe(true)
    expect(wrapper.find('[data-cy="editions-table"]').exists()).toBe(false)
  })

  it('erreur serveur : alerte d’erreur avec nouvelle tentative', async () => {
    registerEndpoint('/api/v1/editions', defineEventHandler((event) => {
      setResponseStatus(event, 500)
      return apiError(500, API_ERROR_CODE.INTERNAL_ERROR)
    }))
    const wrapper = await mountList()
    await flushPromises()
    expect(wrapper.find('[data-cy="async-state-error"]').exists()).toBe(true)
    expect(wrapper.find('[data-cy="async-state-retry"]').exists()).toBe(true)
  })
})

describe('page de création', () => {
  const mountNew = () => mountSuspended(EditionNewPage, { route: ROUTES.ADMIN_EDITION_NEW, global: { components: { RouterLink } } })

  const fill = async (wrapper: Awaited<ReturnType<typeof mountNew>>) => {
    await wrapper.get('[data-cy="edition-form-year"] input').setValue('2027')
    await wrapper.get('[data-cy="edition-form-name"] input').setValue('Championnat de Caps 2027')
    await wrapper.get('form').trigger('submit')
    await settle(wrapper)
  }

  it('crée l’édition puis affiche le code attribué par le serveur et l’adresse publique', async () => {
    const seen = vi.fn()
    registerEndpoint('/api/v1/editions', defineEventHandler(async (event) => {
      if (event.method === 'POST') {
        seen(await readBody(event))
        setResponseStatus(event, 201)
        return summary({ id: 'n', code: '2027b', year: 2027, name: 'Championnat de Caps 2027' })
      }
      return []
    }))
    const wrapper = await mountNew()
    await fill(wrapper)
    expect(seen).toHaveBeenCalledWith({ year: 2027, name: 'Championnat de Caps 2027' })
    expect(wrapper.find('[data-cy="edition-form"]').exists()).toBe(false)
    expect(wrapper.get('[data-cy="edition-created-title"]').text()).toContain('2027b')
    expect(wrapper.get('[data-cy="edition-created-address"]').text()).toBe('/editions/2027b')
    expect(wrapper.get('[data-cy="edition-created-edit"]').attributes('href')).toBe('/admin/editions/2027b')
  })

  it('409 EDITION_CODE_EXHAUSTED : message traduit, formulaire conservé', async () => {
    registerEndpoint('/api/v1/editions', defineEventHandler((event) => {
      if (event.method === 'POST') {
        setResponseStatus(event, 409)
        return apiError(409, API_ERROR_CODE.EDITION_CODE_EXHAUSTED)
      }
      return []
    }))
    const wrapper = await mountNew()
    await fill(wrapper)
    expect(wrapper.get('[data-cy="edition-form-error"]').text()).toContain('Plus aucun code disponible pour cette année.')
    expect((wrapper.get('[data-cy="edition-form-year"] input').element as HTMLInputElement).value).toBe('2027')
  })

  it('400 de validation : alerte d’erreur', async () => {
    registerEndpoint('/api/v1/editions', defineEventHandler((event) => {
      if (event.method === 'POST') {
        setResponseStatus(event, 400)
        return apiError(400, API_ERROR_CODE.VALIDATION_FAILED)
      }
      return []
    }))
    const wrapper = await mountNew()
    await fill(wrapper)
    expect(wrapper.get('[data-cy="edition-form-error"]').text()).toContain('Le formulaire contient une erreur.')
  })

  it('erreur serveur 500 : message générique, formulaire conservé', async () => {
    registerEndpoint('/api/v1/editions', defineEventHandler(async (event) => {
      if (event.method === 'POST') {
        throw new TypeError('Failed to fetch')
      }
      return []
    }))
    const wrapper = await mountNew()
    await fill(wrapper)
    expect(wrapper.get('[data-cy="edition-form-error"]').text()).toContain('Une erreur est survenue.')
    expect(wrapper.find('[data-cy="edition-form"]').exists()).toBe(true)
  })
})

describe('page de modification', () => {
  const route = (code: string) => `/admin/editions/${code}`
  const mountEdit = (code = '2026') => mountSuspended(EditionPage, { route: route(code), global: { components: { RouterLink } } })

  it('édition ouverte : formulaire pré-rempli, enregistrement en PATCH, confirmation', async () => {
    const seen = vi.fn()
    let name = 'Ancien nom'
    registerEndpoint('/api/v1/editions/2026', defineEventHandler(() => detail({ name })))
    registerEndpoint(`/api/v1/editions/${EDITION_ID}`, defineEventHandler(async (event) => {
      if (event.method === 'PATCH') {
        const body = await readBody(event)
        seen(body)
        name = body.name
        return summary({ name })
      }
      return detail({ name })
    }))
    const wrapper = await mountEdit()
    await flushPromises()
    const input = wrapper.get('[data-cy="edition-form-name"] input')
    expect((input.element as HTMLInputElement).value).toBe('Ancien nom')
    await input.setValue('Nouveau nom')
    await wrapper.get('form').trigger('submit')
    await settle(wrapper)
    expect(seen).toHaveBeenCalledWith({ name: 'Nouveau nom', heldOn: null, location: null, description: null })
    expect(savedSnackbar(wrapper).props('modelValue')).toBe(true)
  })

  it('édition clôturée : lecture seule par défaut, aucun formulaire', async () => {
    registerEndpoint('/api/v1/editions/2025', defineEventHandler(() => detail({ code: '2025', year: 2025, status: EDITION_STATUS.CLOSED })))
    const wrapper = await mountEdit('2025')
    await flushPromises()
    expect(wrapper.find('[data-cy="edition-closed"]').exists()).toBe(true)
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('409 EDITION_CLOSED à l’enregistrement : message traduit et fiche rechargée en lecture seule', async () => {
    let closed = false
    registerEndpoint('/api/v1/editions/2026', defineEventHandler(() => detail(closed ? { status: EDITION_STATUS.CLOSED } : {})))
    registerEndpoint(`/api/v1/editions/${EDITION_ID}`, defineEventHandler((event) => {
      if (event.method === 'PATCH') {
        closed = true
        setResponseStatus(event, 409)
        return apiError(409, API_ERROR_CODE.EDITION_CLOSED)
      }
      return detail()
    }))
    const wrapper = await mountEdit()
    await flushPromises()
    await wrapper.get('[data-cy="edition-form-name"] input').setValue('x')
    await wrapper.get('form').trigger('submit')
    await settle(wrapper)
    expect(wrapper.find('[data-cy="edition-closed"]').exists()).toBe(true)
    expect(wrapper.get('[data-cy="edition-closed-error"]').text()).toContain('Modification refusée.')
  })

  it('édition inconnue : état d’erreur', async () => {
    registerEndpoint('/api/v1/editions/9999', defineEventHandler((event) => {
      setResponseStatus(event, 404)
      return apiError(404, API_ERROR_CODE.NOT_FOUND)
    }))
    const wrapper = await mountEdit('9999')
    await flushPromises()
    expect(wrapper.find('[data-cy="async-state-error"]').exists()).toBe(true)
    expect(wrapper.find('form').exists()).toBe(false)
  })
})
