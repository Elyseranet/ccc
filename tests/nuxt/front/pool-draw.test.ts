import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { defineEventHandler, getHeader, getQuery, readBody, readRawBody, setResponseStatus } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { useAdminEditionStore } from '../../../src/composables/useAdminEditionStore'
import { usePoolDraw } from '../../../src/composables/usePoolDraw'
import { API_ERROR_CODE } from '../../../src/enums/api-error-code.enum'
import { DRAW_KIND, DRAW_STATUS } from '../../../src/enums/draw.enum'
import { EDITION_ORIGIN, EDITION_STATUS } from '../../../src/enums/edition.enum'
import { POOL_DRAW_SAVE_STATE, POOL_DRAW_STEP } from '../../../src/enums/pool-draw.enum'
import { DrawService } from '../../../src/services/draw.service'

/*********************************************************
 * Tirage des poules (F-11) : service, composable et règles de l'écran
 *
 * @description
 * Les appels partent vers de vrais endpoints enregistrés (jamais une fixture dans l'application, ARCH-8) : on compte les requêtes et on
 * vérifie les corps. Le corps JSON part avec le `Content-Type` posé par `$fetch` et reste sous 16 Ko (contrat M2 de B-11).
 ********************************************************/
const person = (id: string, displayName: string) => ({ id, displayName, firstName: null, lastName: null, nickname: null, avatarUrl: null })
const participants = ['a', 'b', 'c', 'd', 'e'].map(letter => ({
  participationId: `p-${letter}`, competitor: person(`c-${letter}`, `Joueur ${letter.toUpperCase()}`), poolId: null, isSeed: false, seedRank: null, status: 'REGISTERED', finalStage: null, points: null, poolRank: null
}))
const edition = { id: 'ed1', code: '2027', year: 2027, status: EDITION_STATUS.REGISTRATION, origin: EDITION_ORIGIN.APP, participantCount: 5 }
const detail = { ...edition, participants }

const draftOf = (status: DRAW_STATUS, assignments: Array<{ participationId: string, poolNumber: number | null, drawnOrder: number }>) => ({
  id: 'd1',
  kind: DRAW_KIND.POOLS,
  roundKind: null,
  status,
  parameters: { poolCount: 2, seedCount: 2 },
  createdAt: '2026-11-04T10:00:00.000Z',
  validatedAt: status === DRAW_STATUS.VALIDATED ? '2026-11-04T11:00:00.000Z' : null,
  createdBy: null,
  validatedBy: null,
  assignments: assignments.map(entry => ({ ...entry, competitorId: `c-${entry.participationId.slice(2)}`, displayName: entry.participationId, poolId: null, pairingIndex: null, sidePosition: null, assignedAt: '' }))
})
const proposal = {
  seeds: [
    { participationId: 'p-a', competitor: person('c-a', 'Joueur A'), rank: 1, acp: 20 },
    { participationId: 'p-b', competitor: person('c-b', 'Joueur B'), rank: 2, acp: 10 }
  ],
  unresolvedTies: []
}

let drafts: unknown[] = []
const putCalls = vi.fn()
const postCalls = vi.fn()
const seedCalls = vi.fn()
const validateCalls = vi.fn()
let putFails = false

const registerAll = () => {
  registerEndpoint('/api/v1/editions', () => [edition])
  registerEndpoint('/api/v1/editions/ed1', () => detail)
  registerEndpoint('/api/v1/admin/editions/ed1/tirages', () => drafts)
  registerEndpoint('/api/v1/editions/ed1/tetes-de-serie', defineEventHandler((event) => {
    seedCalls(getQuery(event))
    return proposal
  }))
  registerEndpoint('/api/v1/editions/ed1/tirages/poules', { method: 'POST', handler: defineEventHandler(async (event) => {
    postCalls(await readBody(event), getHeader(event, 'content-type'))
    return draftOf(DRAW_STATUS.DRAFT, [{ participationId: 'p-a', poolNumber: null, drawnOrder: 1 }, { participationId: 'p-b', poolNumber: null, drawnOrder: 2 }])
  }) })
  registerEndpoint('/api/v1/tirages/d1/affectations', { method: 'PUT', handler: defineEventHandler(async (event) => {
    const body = await readBody<{ assignments: Array<{ participationId: string, poolNumber: number, drawnOrder: number }> }>(event)
    putCalls(body)
    if (putFails) {
      setResponseStatus(event, 409)
      return { statusCode: 409, code: API_ERROR_CODE.DRAW_INCONSISTENT, message: 'x' }
    }
    return draftOf(DRAW_STATUS.DRAFT, body.assignments)
  }) })
  registerEndpoint('/api/v1/tirages/d1/validation', { method: 'POST', handler: defineEventHandler(() => {
    validateCalls()
    return draftOf(DRAW_STATUS.VALIDATED, [])
  }) })
}

const mountDraw = async () => {
  clearNuxtData()
  useAdminEditionStore().editionId = 'ed1'
  const Harness = defineComponent({
    async setup () {
      const draw = await usePoolDraw()
      return { draw }
    },
    render () {
      return h('div')
    }
  })
  const wrapper = await mountSuspended(Harness)
  return (wrapper.vm as unknown as { draw: Awaited<ReturnType<typeof usePoolDraw>> }).draw
}

beforeEach(() => {
  drafts = []
  putFails = false
  putCalls.mockClear()
  postCalls.mockClear()
  seedCalls.mockClear()
  validateCalls.mockClear()
  registerAll()
})

describe('DrawService : écritures', () => {
  it('le corps JSON part avec le Content-Type posé par $fetch et reste sous 16 Ko, même pour 60 affectations', async () => {
    const seen = vi.fn()
    registerEndpoint('/api/v1/tirages/d9/affectations', { method: 'PUT', handler: defineEventHandler(async (event) => {
      seen(getHeader(event, 'content-type'), (await readRawBody(event))?.length)
      return {}
    }) })
    const assignments = Array.from({ length: 60 }, (_, index) => ({ participationId: '3b0c9a52-8f3e-4d51-9a7a-0b6f2a1d6c11', poolNumber: (index % 20) + 1, drawnOrder: index + 1 }))
    await new DrawService().saveAssignments('d9', { assignments })
    expect(seen.mock.calls[0]![0]).toMatch(/^application\/json/)
    expect(seen.mock.calls[0]![1]).toBeLessThan(16 * 1024)
  })

  it('la validation part sans corps, et le code ne force aucun en-tête', async () => {
    await new DrawService().validate('d1')
    expect(validateCalls).toHaveBeenCalledTimes(1)
    const { readFileSync } = await import('node:fs')
    const code = readFileSync('src/services/draw.service.ts', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
    expect(code).not.toMatch(/Content-Type/i)
  })
})

describe('usePoolDraw : du paramétrage à la validation', () => {
  it('sans brouillon : étape des paramètres, aucun nombre de poules proposé hors de la table « Config poules » (5 inscrits)', async () => {
    const draw = await mountDraw()
    expect(draw.step.value).toBe(POOL_DRAW_STEP.PARAMETERS)
    expect(draw.total.value).toBe(5)
    expect(draw.poolCount.value).toBe(0)
    expect(draw.parametersIssue.value).not.toBeNull()
    expect(draw.isReadOnly.value).toBe(false)
  })

  it('les têtes de série sont demandées pour le nombre de poules, puis le brouillon est créé avec elles (RG9)', async () => {
    const draw = await mountDraw()
    draw.poolCount.value = 2
    expect(await draw.loadSeeds()).toBe(true)
    expect(seedCalls.mock.calls[0]![0]).toMatchObject({ poules: '2' })
    expect(draw.step.value).toBe(POOL_DRAW_STEP.SEEDS)
    expect(draw.canConfirmSeeds.value).toBe(true)
    expect(await draw.confirmSeeds()).toBe(true)
    expect(postCalls.mock.calls[0]![0]).toEqual({ poolCount: 2, seedCount: 2, seeds: ['p-a', 'p-b'] })
    expect(postCalls.mock.calls[0]![1]).toMatch(/^application\/json/)
    expect(draw.step.value).toBe(POOL_DRAW_STEP.ENTRY)
    expect(draw.pools.value.map(pool => pool.members.length)).toEqual([1, 1])
  })

  it('un nombre de poules hors bornes n’appelle pas l’API', async () => {
    const draw = await mountDraw()
    draw.poolCount.value = 9
    expect(await draw.loadSeeds()).toBe(false)
    expect(seedCalls).not.toHaveBeenCalled()
  })

  it('chaque affectation déclenche exactement un PUT, et le joueur placé n’est plus proposé ailleurs', async () => {
    const draw = await mountDraw()
    draw.poolCount.value = 2
    await draw.loadSeeds()
    await draw.confirmSeeds()
    expect(draw.unplaced.value.map(player => player.participationId)).toEqual(['p-c', 'p-d', 'p-e'])
    await draw.assign(1, 'p-c')
    expect(putCalls).toHaveBeenCalledTimes(1)
    expect(putCalls.mock.calls[0]![0].assignments).toEqual([
      { participationId: 'p-a', poolNumber: 1, drawnOrder: 1 },
      { participationId: 'p-b', poolNumber: 2, drawnOrder: 2 },
      { participationId: 'p-c', poolNumber: 1, drawnOrder: 3 }
    ])
    expect(draw.unplaced.value.map(player => player.participationId)).toEqual(['p-d', 'p-e'])
    await draw.assign(2, 'p-c')
    expect(putCalls).toHaveBeenCalledTimes(1)
    expect(draw.saveState.value).toBe(POOL_DRAW_SAVE_STATE.SAVED)
    expect(draw.lastSaved.value).toMatchObject({ poolNumber: 1, place: 2, placed: 3, total: 5 })
  })

  it('deux affectations rapprochées partent à la suite, chacune avec la saisie de son moment', async () => {
    const draw = await mountDraw()
    draw.poolCount.value = 2
    await draw.loadSeeds()
    await draw.confirmSeeds()
    const first = draw.assign(1, 'p-c')
    const second = draw.assign(2, 'p-d')
    await Promise.all([first, second])
    expect(putCalls).toHaveBeenCalledTimes(2)
    expect(putCalls.mock.calls[0]![0].assignments).toHaveLength(3)
    expect(putCalls.mock.calls[1]![0].assignments).toHaveLength(4)
  })

  it('une affectation non enregistrée est signalée, gardée en local et se renvoie', async () => {
    const draw = await mountDraw()
    draw.poolCount.value = 2
    await draw.loadSeeds()
    await draw.confirmSeeds()
    putFails = true
    await draw.assign(1, 'p-c')
    expect(draw.saveState.value).toBe(POOL_DRAW_SAVE_STATE.FAILED)
    expect(draw.feedback.value?.message.key).toBe('admin.draws.errors.draw_inconsistent')
    expect(draw.pools.value[0]?.members).toHaveLength(2)
    expect(draw.canValidate.value).toBe(false)
    putFails = false
    await draw.retrySave()
    expect(draw.saveState.value).toBe(POOL_DRAW_SAVE_STATE.SAVED)
    expect(putCalls).toHaveBeenCalledTimes(2)
  })

  it('le récapitulatif et la validation ne s’ouvrent qu’avec tous les inscrits placés ; la validation fige le tirage', async () => {
    const draw = await mountDraw()
    draw.poolCount.value = 2
    await draw.loadSeeds()
    await draw.confirmSeeds()
    draw.goToRecap()
    expect(draw.step.value).toBe(POOL_DRAW_STEP.ENTRY)
    await draw.assign(1, 'p-c')
    await draw.assign(2, 'p-d')
    await draw.assign(1, 'p-e')
    expect(draw.isComplete.value).toBe(true)
    draw.goToRecap()
    expect(draw.step.value).toBe(POOL_DRAW_STEP.RECAP)
    draw.goToValidation()
    expect(draw.step.value).toBe(POOL_DRAW_STEP.VALIDATION)
    drafts = [draftOf(DRAW_STATUS.VALIDATED, [])]
    expect(await draw.validate()).toBe(true)
    expect(validateCalls).toHaveBeenCalledTimes(1)
    expect(draw.isValidated.value).toBe(true)
    expect(draw.isReadOnly.value).toBe(true)
  })

  it('recommencer revient aux paramètres sans rien envoyer', async () => {
    const draw = await mountDraw()
    draw.poolCount.value = 2
    await draw.loadSeeds()
    await draw.confirmSeeds()
    draw.restart()
    expect(draw.step.value).toBe(POOL_DRAW_STEP.PARAMETERS)
    expect(draw.pools.value).toEqual([])
    expect(putCalls).not.toHaveBeenCalled()
  })
})

describe('usePoolDraw : états du serveur', () => {
  it('un brouillon rouvre la saisie : le travail n’est pas perdu au rechargement', async () => {
    drafts = [draftOf(DRAW_STATUS.DRAFT, [{ participationId: 'p-a', poolNumber: null, drawnOrder: 1 }, { participationId: 'p-b', poolNumber: null, drawnOrder: 2 }, { participationId: 'p-c', poolNumber: 1, drawnOrder: 3 }])]
    const draw = await mountDraw()
    expect(draw.step.value).toBe(POOL_DRAW_STEP.ENTRY)
    expect(draw.poolCount.value).toBe(2)
    expect(draw.pools.value.map(pool => pool.members.map(member => member.participationId))).toEqual([['p-a', 'p-c'], ['p-b']])
    expect(draw.progress.value).toMatchObject({ placed: 3, total: 5 })
  })

  it('un tirage validé est en lecture seule : aucune affectation ne part', async () => {
    drafts = [draftOf(DRAW_STATUS.VALIDATED, [{ participationId: 'p-a', poolNumber: 1, drawnOrder: 1 }, { participationId: 'p-b', poolNumber: 2, drawnOrder: 2 }])]
    const draw = await mountDraw()
    expect(draw.isValidated.value).toBe(true)
    expect(draw.isReadOnly.value).toBe(true)
    expect(draw.step.value).toBe(POOL_DRAW_STEP.VALIDATION)
    await draw.assign(1, 'p-c')
    expect(putCalls).not.toHaveBeenCalled()
  })
})
