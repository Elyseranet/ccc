import { describe, expect, it } from 'vitest'
import { API_ERROR_CODE } from '../../src/enums/api-error-code.enum'
import { toApiError, versionConflict } from '../../src/utils/api-error.util'
import { parseRequiredIfMatchVersion } from '../../src/utils/if-match.util'

describe('parseRequiredIfMatchVersion', () => {
  it('reads a quoted, bare or weak version', () => {
    expect(parseRequiredIfMatchVersion('"3"')).toBe(3)
    expect(parseRequiredIfMatchVersion('3')).toBe(3)
    expect(parseRequiredIfMatchVersion('W/"12"')).toBe(12)
    expect(parseRequiredIfMatchVersion('  "7" ')).toBe(7)
  })

  it('answers 428 PRECONDITION_REQUIRED without the header', () => {
    try {
      parseRequiredIfMatchVersion(undefined)
      expect.unreachable()
    } catch (error) {
      expect(toApiError(error)).toMatchObject({ statusCode: 428, code: API_ERROR_CODE.PRECONDITION_REQUIRED })
    }
  })

  it.each(['', 'abc', '-1', '1.5', '*', '"1","2"'])('answers 400 for the malformed value %j', (bad) => {
    try {
      parseRequiredIfMatchVersion(bad)
      expect.unreachable()
    } catch (error) {
      expect(toApiError(error).statusCode).toBe(400)
    }
  })
})

describe('versionConflict', () => {
  it('is a 412 VERSION_CONFLICT carrying the current version', () => {
    expect(toApiError(versionConflict(5))).toMatchObject({
      statusCode: 412,
      code: API_ERROR_CODE.VERSION_CONFLICT,
      details: { currentVersion: 5 }
    })
  })
})
