import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useRandomDraw } from '../../../src/composables/useRandomDraw'
import { API_ERROR_CODE } from '../../../src/enums/api-error-code.enum'
import { DRAW_KIND, DRAW_STATUS } from '../../../src/enums/draw.enum'
import type { IAdminDraw, IDrawAssignment } from '../../../src/interfaces/draw.interface'
import type { IRandomDrawOptions } from '../../../src/interfaces/random-draw-screen.interface'
import type { IRandomDrawResult } from '../../../src/interfaces/random-draw.interface'
import { ApiRequestError } from '../../../src/utils/api-request-error.util'

const assignment = (overrides: Partial<IDrawAssignment>): IDrawAssignment => ({
  participationId: 'p', competitorId: 'c', displayName: 'Nom', poolId: null, poolNumber: null, pairingIndex: null, sidePosition: null, drawnOrder: 1, assignedAt: '', ...overrides
})
const draftOf = (kind: DRAW_KIND, assignments: IDrawAssignment[], seedCount = 0): IAdminDraw => ({
  id: 'd1', kind, roundKind: null, status: DRAW_STATUS.DRAFT, parameters: { poolCount: 2, seedCount }, createdAt: '', validatedAt: null, assignments, createdBy: null, validatedBy: null
})
const apiError = (code: API_ERROR_CODE) => new ApiRequestError({ code, message: code } as never)

const setup = (kind: DRAW_KIND, overrides: Partial<IRandomDrawOptions> = {}) => {
  const draft = ref<IAdminDraw | null>(draftOf(kind, [assignment({ participationId: 'seed', drawnOrder: 1, poolNumber: 1 })], kind === DRAW_KIND.POOLS ? 1 : 0))
  const drawn = assignment({ participationId: 'p2', displayName: 'Lina', poolNumber: 1, drawnOrder: 2, pairingIndex: kind === DRAW_KIND.ROUND ? 1 : null, sidePosition: kind === DRAW_KIND.ROUND ? 1 : null })
  const result: IRandomDrawResult = { draw: draftOf(kind, [drawn], 1), step: { assignments: [drawn], remaining: 3 } }
  const options = {
    kind,
    draft,
    total: ref(10),
    readOnly: ref(false),
    ensureDraft: vi.fn(async () => draft.value),
    flush: vi.fn(async () => undefined),
    apply: vi.fn((draw: IAdminDraw) => { draft.value = draw }),
    refresh: vi.fn(async () => undefined),
    fail: vi.fn(),
    notifyError: vi.fn(),
    randomDraw: vi.fn(async () => result),
    saveAssignments: vi.fn(async (_id: string, body: { assignments: unknown[] }) => draftOf(kind, body.assignments as IDrawAssignment[])),
    ...overrides
  } as unknown as IRandomDrawOptions
  return { random: useRandomDraw(options), options, result }
}

describe('useRandomDraw', () => {
  it('flushes manual saves, draws, applies the draft and opens the projector view; closing hands the arrival back to the list', async () => {
    const { random, options } = setup(DRAW_KIND.POOLS)
    expect(await random.draw()).toBe(true)
    expect(options.flush).toHaveBeenCalledOnce()
    expect(options.randomDraw).toHaveBeenCalledWith('d1')
    expect(options.apply).toHaveBeenCalledOnce()
    expect(random.projectorOpen.value).toBe(true)
    expect(random.view.value).toMatchObject({ names: ['Lina'], poolNumber: 1, position: 1, total: 9 })
    expect(random.arrival.value).toBeNull()
    await random.close()
    expect(random.projectorOpen.value).toBe(false)
    expect(random.arrival.value).toEqual({ participationIds: ['p2'], poolNumber: 1, pairingIndex: null })
  })

  it('does not draw while read-only, while another draw is running, or while the projector is open', async () => {
    const { random, options } = setup(DRAW_KIND.ROUND)
    options.readOnly = ref(true)
    expect(await random.draw()).toBe(false)
    expect(options.randomDraw).not.toHaveBeenCalled()
    const second = setup(DRAW_KIND.ROUND)
    await second.random.draw()
    expect(await second.random.draw()).toBe(false)
    expect(second.options.randomDraw).toHaveBeenCalledOnce()
  })

  it('maps 409 DRAW_INCONSISTENT to the draw-specific message, resyncs on DRAW_DRAFT_COMPLETE, and reports other failures', async () => {
    const inconsistent = setup(DRAW_KIND.ROUND, { randomDraw: vi.fn(async () => { throw apiError(API_ERROR_CODE.DRAW_INCONSISTENT) }) })
    expect(await inconsistent.random.draw()).toBe(false)
    expect(inconsistent.options.notifyError).toHaveBeenCalledWith(expect.objectContaining({ key: 'admin.random_draw.errors.round_inconsistent' }))
    expect(inconsistent.random.projectorOpen.value).toBe(false)

    const complete = setup(DRAW_KIND.POOLS, { randomDraw: vi.fn(async () => { throw apiError(API_ERROR_CODE.DRAW_DRAFT_COMPLETE) }) })
    await complete.random.draw()
    expect(complete.options.refresh).toHaveBeenCalledOnce()
    expect(complete.options.fail).not.toHaveBeenCalled()

    const other = setup(DRAW_KIND.POOLS, { randomDraw: vi.fn(async () => { throw new Error('network') }) })
    await other.random.draw()
    expect(other.options.fail).toHaveBeenCalledOnce()
    expect(other.random.drawing.value).toBe(false)
  })

  it('restart asks first, then clears the draft through the assignments PUT (seeds only in pools, nothing in a round)', async () => {
    const pools = setup(DRAW_KIND.POOLS)
    pools.options.draft.value = draftOf(DRAW_KIND.POOLS, [assignment({ participationId: 'seed', drawnOrder: 1, poolNumber: 1 }), assignment({ participationId: 'x', drawnOrder: 2, poolNumber: 1 })], 1)
    pools.random.askRestart()
    expect(pools.random.restartOpen.value).toBe(true)
    expect(pools.options.saveAssignments).not.toHaveBeenCalled()
    expect(await pools.random.restart()).toBe(true)
    expect(pools.options.saveAssignments).toHaveBeenCalledWith('d1', { assignments: [{ participationId: 'seed', poolNumber: 1, drawnOrder: 1 }] })
    expect(pools.random.restartOpen.value).toBe(false)

    const round = setup(DRAW_KIND.ROUND)
    round.options.draft.value = draftOf(DRAW_KIND.ROUND, [assignment({ pairingIndex: 1, sidePosition: 1 })])
    round.random.askRestart()
    await round.random.restart()
    expect(round.options.saveAssignments).toHaveBeenCalledWith('d1', { assignments: [] })
  })

  it('does not ask to restart when nothing has been drawn', () => {
    const { random } = setup(DRAW_KIND.POOLS)
    random.askRestart()
    expect(random.restartOpen.value).toBe(false)
  })

  describe('launchFinal (F-56)', () => {
    const finalists = (): IAdminDraw => draftOf(DRAW_KIND.ROUND, [
      assignment({ participationId: 'b', displayName: 'Bob', pairingIndex: 1, sidePosition: 2, drawnOrder: 2 }),
      assignment({ participationId: 'a', displayName: 'Alice', pairingIndex: 1, sidePosition: 1, drawnOrder: 1 })
    ])

    it('draws the single pairing, validates, then opens the projector on the two finalists in the order draw -> validate -> view', async () => {
      const calls: string[] = []
      const draw = finalists()
      const { random, options } = setup(DRAW_KIND.ROUND, {
        randomDraw: vi.fn(async () => { calls.push('randomDraw'); return { draw, step: { assignments: draw.assignments, remaining: 0 } } as IRandomDrawResult }),
        validate: vi.fn(async () => { calls.push('validate'); return true })
      })
      expect(await random.launchFinal()).toBe(true)
      expect(calls).toEqual(['randomDraw', 'validate'])
      expect(options.apply).toHaveBeenCalledWith(draw)
      expect(random.view.value).toMatchObject({ names: ['Alice', 'Bob'], final: true, position: 1, total: 1 })
      expect(random.drawing.value).toBe(false)
    })

    it('skips the random draw when the draft already holds both finalists', async () => {
      const complete = finalists()
      const { random, options } = setup(DRAW_KIND.ROUND, { validate: vi.fn(async () => true) })
      options.draft.value = complete
      expect(await random.launchFinal()).toBe(true)
      expect(options.randomDraw).not.toHaveBeenCalled()
      expect(random.view.value?.names).toEqual(['Alice', 'Bob'])
    })

    it('keeps the projector closed and reports false when the validation fails, the draft staying applied', async () => {
      const draw = finalists()
      const { random, options } = setup(DRAW_KIND.ROUND, {
        randomDraw: vi.fn(async () => ({ draw, step: { assignments: draw.assignments, remaining: 0 } }) as IRandomDrawResult),
        validate: vi.fn(async () => false)
      })
      expect(await random.launchFinal()).toBe(false)
      expect(options.apply).toHaveBeenCalledWith(draw)
      expect(random.projectorOpen.value).toBe(false)
      expect(random.drawing.value).toBe(false)
    })

    it('reports a random-draw failure without validating', async () => {
      const validate = vi.fn(async () => true)
      const { random, options } = setup(DRAW_KIND.ROUND, { randomDraw: vi.fn(async () => { throw apiError(API_ERROR_CODE.DRAW_INCONSISTENT) }), validate })
      expect(await random.launchFinal()).toBe(false)
      expect(validate).not.toHaveBeenCalled()
      expect(options.notifyError).toHaveBeenCalledWith(expect.objectContaining({ key: 'admin.random_draw.errors.round_inconsistent' }))
    })
  })
})
