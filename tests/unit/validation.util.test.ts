import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { API_ERROR_CODE } from '../../shared/enums/api-error-code.enum'
import { toApiError } from '../../server/utils/http/api-error.util'
import { parseWithSchema } from '../../server/utils/http/validation.util'

const idSchema = z.object({ id: z.coerce.number().int().positive() })

describe('parseWithSchema', () => {
  it('returns the parsed value', () => {
    expect(parseWithSchema(idSchema, { id: '12' })).toEqual({ id: 12 })
  })

  it('turns an invalid identifier into a 400 VALIDATION_FAILED with field paths', () => {
    try {
      parseWithSchema(idSchema, { id: 'abc' })
      expect.unreachable()
    } catch (error) {
      const apiError = toApiError(error)
      expect(apiError.statusCode).toBe(400)
      expect(apiError.code).toBe(API_ERROR_CODE.VALIDATION_FAILED)
      expect(apiError.details).toEqual([{ path: 'id', message: expect.any(String) }])
    }
  })

  it('does not echo the rejected input back', () => {
    try {
      parseWithSchema(idSchema, { id: 'SECRET-VALUE' })
      expect.unreachable()
    } catch (error) {
      expect(JSON.stringify(toApiError(error))).not.toContain('SECRET-VALUE')
    }
  })
})
