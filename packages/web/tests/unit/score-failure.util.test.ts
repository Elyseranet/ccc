import { describe, expect, it } from 'vitest'
import { API_ERROR_CODE } from '../../src/enums/api-error-code.enum'
import { SCORE_FAILURE } from '../../src/enums/score-entry.enum'
import { ApiRequestError } from '../../src/utils/api-request-error.util'
import { toScoreFailure } from '../../src/utils/score-failure.util'

const failure = (statusCode: number, code: API_ERROR_CODE, isOffline = false) =>
  new ApiRequestError({ statusCode, code, message: 'x' }, isOffline)

describe('échec d’écriture de score -> cas (F-08)', () => {
  it.each([
    [412, API_ERROR_CODE.VERSION_CONFLICT, SCORE_FAILURE.VERSION_CONFLICT],
    [409, API_ERROR_CODE.MATCH_ALREADY_VALIDATED, SCORE_FAILURE.ALREADY_VALIDATED],
    [409, API_ERROR_CODE.NEXT_ROUND_ENGAGED, SCORE_FAILURE.NEXT_ROUND_ENGAGED],
    [409, API_ERROR_CODE.CONFLICT, SCORE_FAILURE.CONFLICT],
    [422, API_ERROR_CODE.SCORE_INCONSISTENT, SCORE_FAILURE.INCONSISTENT],
    [428, API_ERROR_CODE.PRECONDITION_REQUIRED, SCORE_FAILURE.FRONT_DEFECT],
    [409, API_ERROR_CODE.SCORE_MISMATCH, SCORE_FAILURE.FRONT_DEFECT],
    [400, API_ERROR_CODE.BAD_REQUEST, SCORE_FAILURE.FRONT_DEFECT],
    [413, API_ERROR_CODE.PAYLOAD_TOO_LARGE, SCORE_FAILURE.PAYLOAD_TOO_LARGE],
    [403, API_ERROR_CODE.FORBIDDEN, SCORE_FAILURE.FORBIDDEN],
    [401, API_ERROR_CODE.UNAUTHORIZED, SCORE_FAILURE.UNAUTHORIZED],
    [500, API_ERROR_CODE.INTERNAL_ERROR, SCORE_FAILURE.UNKNOWN]
  ])('%i %s -> %s', (status, code, expected) => {
    expect(toScoreFailure(failure(status, code))).toBe(expected)
  })

  it('le code prime sur le statut (409 SCORE_MISMATCH n’est pas un conflit d’utilisateur)', () => {
    expect(toScoreFailure(failure(409, API_ERROR_CODE.SCORE_MISMATCH))).not.toBe(SCORE_FAILURE.CONFLICT)
  })

  it('une absence de réponse est « hors ligne »', () => {
    expect(toScoreFailure(failure(0, API_ERROR_CODE.INTERNAL_ERROR, true))).toBe(SCORE_FAILURE.OFFLINE)
  })
})
