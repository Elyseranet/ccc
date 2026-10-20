import type { API_ERROR_CODE } from '../../enums/api-error-code.enum'

export interface IApiErrorDetail {
  path: string
  message: string
}

export interface IApiError {
  statusCode: number
  code: API_ERROR_CODE
  message: string
  details?: IApiErrorDetail[] | Record<string, unknown>
}
