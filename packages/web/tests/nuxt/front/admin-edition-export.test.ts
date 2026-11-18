import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { defineEventHandler } from 'h3'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { RouterLink } from 'vue-router'
import { useAdminEditionStore } from '../../../src/composables/useAdminEditionStore'
import { useAuthStore } from '../../../src/composables/useAuthStore'
import { EDITION_ORIGIN, EDITION_STATUS } from '../../../src/enums/edition.enum'
import { USER_ROLE } from '../../../src/enums/user.enum'
import type { IEditionDetail } from '../../../src/interfaces/edition.interface'
import { buildMe } from '../../helpers/me'
import { buildEditionExportUrl } from '../../../src/utils/admin-editions.util'
import EditionPage from '~/pages/admin/editions/[code].vue'

/*********************************************************
 * F-65 : admin, bouton « Exporter (Excel) » de la fiche d'édition
 *
 * @description
 * Lien natif vers `GET /admin/editions/{id}/export.xlsx` (B-30) avec `download` : aucun appel JS. Le téléchargement réel est dans
 * `tests/e2e/writes/F-65.spec.ts`.
 ********************************************************/
const EDITION_ID = '00000000-0000-4000-8000-0000000000e1'

const detail = (overrides: Partial<IEditionDetail> = {}): IEditionDetail => ({
  id: EDITION_ID,
  code: '2060',
  year: 2060,
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

const mountEdit = async (overrides: Partial<IEditionDetail>) => {
  const code = overrides.code ?? '2060'
  registerEndpoint(`/api/v1/editions/${code}`, defineEventHandler(() => detail(overrides)))
  const wrapper = await mountSuspended(EditionPage, { route: `/admin/editions/${code}`, global: { components: { RouterLink } } })
  await flushPromises()
  return wrapper
}

describe('buildEditionExportUrl', () => {
  it('construit la route de B-30 depuis l’id de l’édition', () => {
    expect(buildEditionExportUrl(EDITION_ID)).toBe(`/api/v1/admin/editions/${EDITION_ID}/export.xlsx`)
  })
})

describe('page de modification : bouton d’export', () => {
  it.each([
    ['en cours', {}],
    ['clôturée', { status: EDITION_STATUS.CLOSED }],
    ['archive', { code: '2012a', year: 2012, status: EDITION_STATUS.CLOSED, origin: EDITION_ORIGIN.LEGACY_IMPORT }]
  ] as Array<[string, Partial<IEditionDetail>]>)('édition %s : lien de téléchargement natif vers la route', async (_label, overrides) => {
    const wrapper = await mountEdit(overrides)
    const link = wrapper.get('[data-cy="edition-export"]')
    expect(link.element.tagName).toBe('A')
    expect(link.attributes('href')).toBe(buildEditionExportUrl(EDITION_ID))
    expect(link.attributes('download')).toBeDefined()
    expect(link.text()).toContain('Exporter (Excel)')
  })
})
