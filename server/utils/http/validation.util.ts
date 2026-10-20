import { getValidatedQuery, getValidatedRouterParams, readValidatedBody } from 'h3'
import type { H3Event } from 'h3'
import { ZodError } from 'zod'
import type { ZodType, output } from 'zod'
import type { IApiErrorDetail } from '../../../shared/interfaces/api/error.interface'
import { validationFailed } from './api-error.util'

export const toValidationDetails = (error: ZodError): IApiErrorDetail[] =>
  error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }))

/** h3 enveloppe l'erreur du validateur dans une 400 : on retrouve l'erreur zod d'origine. */
const findZodError = (error: unknown): ZodError | undefined => {
  if (error instanceof ZodError) {
    return error
  }
  const data = (error as { data?: unknown } | null)?.data
  return data instanceof ZodError ? data : undefined
}

const toApiValidationError = (error: unknown): unknown => {
  const zodError = findZodError(error)
  return zodError ? validationFailed(toValidationDetails(zodError)) : error
}

/** Valide `input` avec un schéma zod ; lève une 400 VALIDATION_FAILED sinon. */
export const parseWithSchema = <TSchema extends ZodType>(schema: TSchema, input: unknown): output<TSchema> => {
  const result = schema.safeParse(input)
  if (!result.success) {
    throw validationFailed(toValidationDetails(result.error))
  }
  return result.data
}

export const readBodyWithSchema = async <TSchema extends ZodType>(
  event: H3Event,
  schema: TSchema
): Promise<output<TSchema>> => {
  try {
    return await readValidatedBody(event, (input) => schema.parse(input))
  } catch (error) {
    throw toApiValidationError(error)
  }
}

export const getQueryWithSchema = async <TSchema extends ZodType>(
  event: H3Event,
  schema: TSchema
): Promise<output<TSchema>> => {
  try {
    return await getValidatedQuery(event, (input) => schema.parse(input))
  } catch (error) {
    throw toApiValidationError(error)
  }
}

/** Un identifiant invalide dans l'URL renvoie 400, jamais 404 ni 500. */
export const getParamsWithSchema = async <TSchema extends ZodType>(
  event: H3Event,
  schema: TSchema
): Promise<output<TSchema>> => {
  try {
    return await getValidatedRouterParams(event, (input) => schema.parse(input))
  } catch (error) {
    throw toApiValidationError(error)
  }
}
