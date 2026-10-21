import type { SCORE_ERROR_CODE } from '../enums/domain.enum.js'

export interface IScoreValidation {
  valid: boolean
  code?: SCORE_ERROR_CODE
  reason?: string
}
