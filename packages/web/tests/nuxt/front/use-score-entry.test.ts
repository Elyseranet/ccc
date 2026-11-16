import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useScoreEntry } from '../../../src/composables/useScoreEntry'
import { API_ERROR_CODE } from '../../../src/enums/api-error-code.enum'
import { MATCH_STATUS } from '../../../src/enums/match.enum'
import { ROUND_KIND } from '../../../src/enums/round.enum'
import { SCORE_ENTRY_PHASE, SCORE_ENTRY_SUCCESS, SCORE_FAILURE } from '../../../src/enums/score-entry.enum'
import type { IAdminMatch } from '../../../src/interfaces/admin-match.interface'
import type { IScoreWriter } from '../../../src/interfaces/score-entry.interface'
import { ApiRequestError } from '../../../src/utils/api-request-error.util'
import { buildAdminMatch } from '../../helpers/admin-match'

const wire = (initial: IAdminMatch, service: Partial<IScoreWriter>) => {
  const match = ref<IAdminMatch | null>(initial)
  const written = vi.fn((updated: IAdminMatch) => {
    match.value = updated
  })
  const stale = vi.fn()
  const entry = useScoreEntry(match, { service: service as IScoreWriter, onWritten: written, onStale: stale })
  return { match, written, stale, entry }
}

const result = (match: IAdminMatch) => ({ match, pool: null, round: {} as never, advancingParticipationIds: [] })

describe('useScoreEntry (F-08)', () => {
  it('refuse avant tout envoi un score qui n’atteint pas la cible (RG22) et n’appelle pas le service', async () => {
    const record = vi.fn()
    const { entry } = wire(buildAdminMatch(), { record })
    entry.setValue(0, '3')
    entry.setValue(1, '2')
    expect(await entry.save()).toBe(false)
    expect(record).not.toHaveBeenCalled()
    expect(entry.formError.value).not.toBeNull()
  })

  it('en phase finale la cible est 10 : 5-1 est refusé, 10-7 part', async () => {
    const record = vi.fn(async (_id: string, _s: unknown, _v: number) => buildAdminMatch({ status: MATCH_STATUS.RECORDED, version: 4 }))
    const { entry } = wire(buildAdminMatch({ roundKind: ROUND_KIND.FINAL, poolRank: null, targetScore: 10 }), { record })
    entry.setValue(0, '5')
    entry.setValue(1, '1')
    expect(await entry.save()).toBe(false)
    entry.setValue(0, '10')
    entry.setValue(1, '7')
    expect(await entry.save()).toBe(true)
    expect(record).toHaveBeenCalledTimes(1)
    expect(record.mock.calls[0]![1]).toEqual({ scores: [{ participationId: 'p1', score: 10 }, { participationId: 'p2', score: 7 }] })
  })

  it('« Enregistrer » envoie la version lue et rend la ligne mise à jour', async () => {
    const record = vi.fn(async () => buildAdminMatch({ status: MATCH_STATUS.RECORDED, version: 4 }))
    const { entry, written } = wire(buildAdminMatch({ version: 3 }), { record })
    entry.setValue(0, '5')
    entry.setValue(1, '1')
    await entry.save()
    expect(record).toHaveBeenCalledWith('m1', expect.anything(), 3)
    expect(written).toHaveBeenCalledWith(expect.objectContaining({ version: 4 }), SCORE_ENTRY_SUCCESS.SAVED)
  })

  it('double clic sur « Valider » : un seul appel part', async () => {
    let release: (value: unknown) => void = () => undefined
    const validate = vi.fn(() => new Promise(resolve => { release = resolve }))
    const { entry } = wire(buildAdminMatch({ status: MATCH_STATUS.RECORDED }), { validate: validate as never })
    const first = entry.validate()
    const second = entry.validate()
    expect(entry.phase.value).toBe(SCORE_ENTRY_PHASE.VALIDATING)
    expect(await second).toBe(false)
    expect(validate).toHaveBeenCalledTimes(1)
    release(result(buildAdminMatch({ status: MATCH_STATUS.VALIDATED, version: 4 })))
    expect(await first).toBe(true)
    expect(entry.phase.value).toBe(SCORE_ENTRY_PHASE.IDLE)
  })

  it('valider un score déjà saisi n’enregistre rien d’autre : validation seule, avec la version lue', async () => {
    const record = vi.fn()
    const validate = vi.fn(async () => result(buildAdminMatch({ status: MATCH_STATUS.VALIDATED, version: 4 })))
    const { entry, written } = wire(buildAdminMatch({ status: MATCH_STATUS.RECORDED, version: 3 }), { record, validate })
    await entry.validate()
    expect(record).not.toHaveBeenCalled()
    expect(validate).toHaveBeenCalledWith('m1', expect.anything(), 3)
    expect(written).toHaveBeenCalledWith(expect.objectContaining({ status: MATCH_STATUS.VALIDATED }), SCORE_ENTRY_SUCCESS.VALIDATED)
  })

  it('valider un match sans score enchaîne saisie puis validation avec la version de la réponse, sans relire', async () => {
    const record = vi.fn(async () => buildAdminMatch({ status: MATCH_STATUS.RECORDED, version: 4 }))
    const validate = vi.fn(async () => result(buildAdminMatch({ status: MATCH_STATUS.VALIDATED, version: 5 })))
    const { entry } = wire(buildAdminMatch({ version: 3 }), { record, validate })
    entry.setValue(0, '5')
    entry.setValue(1, '1')
    expect(await entry.validate()).toBe(true)
    expect(record).toHaveBeenCalledWith('m1', expect.anything(), 3)
    expect(validate).toHaveBeenCalledWith('m1', expect.anything(), 4)
  })

  it('un score modifié sur un match saisi est enregistré avant d’être validé', async () => {
    const record = vi.fn(async () => buildAdminMatch({ status: MATCH_STATUS.RECORDED, version: 4 }))
    const validate = vi.fn(async () => result(buildAdminMatch({ status: MATCH_STATUS.VALIDATED, version: 5 })))
    const { entry } = wire(buildAdminMatch({ status: MATCH_STATUS.RECORDED, version: 3 }), { record, validate })
    entry.setValue(1, '3')
    await entry.validate()
    expect(record).toHaveBeenCalledTimes(1)
    expect(validate).toHaveBeenCalledWith('m1', expect.anything(), 4)
  })

  it('412 VERSION_CONFLICT : message « modifié, rechargez » et la ligne est rechargée', async () => {
    const error = new ApiRequestError({ statusCode: 412, code: API_ERROR_CODE.VERSION_CONFLICT, message: 'stale', details: { currentVersion: 9 } })
    const validate = vi.fn(async () => { throw error })
    const { entry, stale } = wire(buildAdminMatch({ status: MATCH_STATUS.RECORDED }), { validate })
    expect(await entry.validate()).toBe(false)
    expect(entry.failure.value).toBe(SCORE_FAILURE.VERSION_CONFLICT)
    expect(stale).toHaveBeenCalledTimes(1)
    expect(entry.phase.value).toBe(SCORE_ENTRY_PHASE.IDLE)
  })

  it('412 : le message survit au rechargement de la file, qui change la version de la ligne (T-QA-10)', async () => {
    const error = new ApiRequestError({ statusCode: 412, code: API_ERROR_CODE.VERSION_CONFLICT, message: 'stale', details: { currentVersion: 9 } })
    const record = vi.fn(async () => { throw error })
    const { entry, match, stale } = wire(buildAdminMatch({ status: MATCH_STATUS.SCHEDULED, version: 1 }), { record })
    stale.mockImplementation(() => {
      match.value = buildAdminMatch({ status: MATCH_STATUS.RECORDED, version: 9 })
    })
    entry.setValue(0, '5')
    entry.setValue(1, '0')
    expect(await entry.save()).toBe(false)
    await flushPromises()
    expect(match.value!.version).toBe(9)
    expect(entry.failure.value).toBe(SCORE_FAILURE.VERSION_CONFLICT)
    entry.setValue(0, '5')
    expect(entry.failure.value).toBeNull()
  })

  it('428 et 409 SCORE_MISMATCH sont des défauts du front : message générique, pas de rechargement', async () => {
    for (const [statusCode, code] of [[428, API_ERROR_CODE.PRECONDITION_REQUIRED], [409, API_ERROR_CODE.SCORE_MISMATCH]] as const) {
      const validate = vi.fn(async () => { throw new ApiRequestError({ statusCode, code, message: 'x' }) })
      const { entry, stale } = wire(buildAdminMatch({ status: MATCH_STATUS.RECORDED }), { validate })
      await entry.validate()
      expect(entry.failure.value).toBe(SCORE_FAILURE.FRONT_DEFECT)
      expect(stale).not.toHaveBeenCalled()
    }
  })

  it('réseau coupé : « hors ligne », le formulaire garde la saisie et on peut réessayer', async () => {
    const record = vi.fn()
      .mockRejectedValueOnce(new ApiRequestError({ statusCode: 0, code: API_ERROR_CODE.INTERNAL_ERROR, message: 'offline' }, true))
      .mockResolvedValueOnce(buildAdminMatch({ status: MATCH_STATUS.RECORDED, version: 4 }))
    const { entry } = wire(buildAdminMatch(), { record })
    entry.setValue(0, '5')
    entry.setValue(1, '1')
    expect(await entry.save()).toBe(false)
    expect(entry.failure.value).toBe(SCORE_FAILURE.OFFLINE)
    expect(entry.values.value).toEqual(['5', '1'])
    expect(await entry.save()).toBe(true)
    expect(entry.failure.value).toBeNull()
  })

  it('un match validé ne peut plus être saisi ni validé', async () => {
    const record = vi.fn()
    const validate = vi.fn()
    const { entry } = wire(buildAdminMatch({ status: MATCH_STATUS.VALIDATED }), { record, validate })
    expect(entry.canValidate.value).toBe(false)
    expect(await entry.save()).toBe(false)
    expect(await entry.validate()).toBe(false)
    expect(record).not.toHaveBeenCalled()
    expect(validate).not.toHaveBeenCalled()
    await flushPromises()
  })
})
