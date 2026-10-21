import { getRequestHeader, getValidatedQuery, getValidatedRouterParams } from 'h3'
import type { H3Event } from 'h3'
import { ZodError } from 'zod'
import type { ZodType, output } from 'zod'
import type { IApiErrorDetail } from '../../../shared/interfaces/api/error.interface'
import { API_JSON_BODY_MAX_BYTES, JSON_CONTENT_TYPE_PATTERN } from '../../consts/request.const'
import { badRequest, payloadTooLarge, validationFailed } from './api-error.util'

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

/**
 * Lit le corps JSON en flux, avec un plafond de `API_JSON_BODY_MAX_BYTES` : 413 dès qu'un
 * `Content-Length` le dépasse (corps non lu), ou dès que les octets reçus le dépassent (envoi par morceaux).
 * Un corps qui n'est pas du JSON n'est pas lu : il vaut `undefined` et la validation répond 400.
 */
const readBoundedJsonBody = async (event: H3Event): Promise<unknown> => {
  const declaredLength = Number(getRequestHeader(event, 'content-length'))
  if (Number.isFinite(declaredLength) && declaredLength > API_JSON_BODY_MAX_BYTES) {
    throw payloadTooLarge()
  }
  if (!JSON_CONTENT_TYPE_PATTERN.test(getRequestHeader(event, 'content-type') ?? '')) {
    return undefined
  }

  const chunks: Buffer[] = []
  let received = 0
  for await (const chunk of event.node.req) {
    const buffer = Buffer.from(chunk as Uint8Array)
    received += buffer.length
    if (received > API_JSON_BODY_MAX_BYTES) {
      throw payloadTooLarge()
    }
    chunks.push(buffer)
  }
  if (received === 0) {
    return undefined
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw badRequest()
  }
}

export const readBodyWithSchema = async <TSchema extends ZodType>(
  event: H3Event,
  schema: TSchema
): Promise<output<TSchema>> => parseWithSchema(schema, await readBoundedJsonBody(event))

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
