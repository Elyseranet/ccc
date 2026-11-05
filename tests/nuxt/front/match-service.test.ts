import { registerEndpoint } from '@nuxt/test-utils/runtime'
import { defineEventHandler, getHeader, getMethod, readRawBody } from 'h3'
import { describe, expect, it, vi } from 'vitest'
import { MatchService } from '../../../src/services/match.service'
import { API_JSON_BODY_MAX_BYTES } from '../../../src/consts/request.const'
import { buildAdminMatch } from '../../helpers/admin-match'

const submission = { scores: [{ participationId: 'p1', score: 5 }, { participationId: 'p2', score: 1 }] }

describe('MatchService : écritures versionnées (F-08, SEC-Q)', () => {
  it('« Enregistrer » envoie PUT /matchs/{id}/score avec If-Match: "<version>" et un corps JSON', async () => {
    const seen = vi.fn()
    registerEndpoint('/api/v1/matchs/m1/score', { method: 'PUT', handler: defineEventHandler(async (event) => {
      seen(getMethod(event), getHeader(event, 'if-match'), getHeader(event, 'content-type'), await readRawBody(event))
      return buildAdminMatch({ version: 4 })
    }) })
    const result = await new MatchService().record('m1', submission, 3)
    expect(seen).toHaveBeenCalledTimes(1)
    const [method, ifMatch, contentType, body] = seen.mock.calls[0]!
    expect(method).toBe('PUT')
    expect(ifMatch).toBe('"3"')
    expect(contentType).toMatch(/^application\/json/)
    expect(JSON.parse(body as string)).toEqual(submission)
    expect(result.version).toBe(4)
  })

  it('« Valider » envoie POST /matchs/{id}/validation avec If-Match: "<version>"', async () => {
    const seen = vi.fn()
    registerEndpoint('/api/v1/matchs/m1/validation', { method: 'POST', handler: defineEventHandler(async (event) => {
      seen(getMethod(event), getHeader(event, 'if-match'), getHeader(event, 'content-type'), await readRawBody(event))
      return { match: buildAdminMatch({ version: 5 }), pool: null, round: {}, advancingParticipationIds: [] }
    }) })
    const result = await new MatchService().validate('m1', submission, 4)
    const [method, ifMatch, contentType, body] = seen.mock.calls[0]!
    expect(method).toBe('POST')
    expect(ifMatch).toBe('"4"')
    expect(contentType).toMatch(/^application\/json/)
    expect(JSON.parse(body as string)).toEqual(submission)
    expect(result.match.version).toBe(5)
  })

  it('chaque écriture du service porte If-Match : aucune méthode n’écrit sans version', async () => {
    const { readFileSync } = await import('node:fs')
    const source = readFileSync('src/services/match.service.ts', 'utf8').split('/*********************************************************\n * MatchService')[1]!.split('/** Verrouille la ligne')[0]!
    const writes = source.match(/method: '(PUT|POST|PATCH|DELETE)'/g) ?? []
    const headers = source.match(/headers: toIfMatchHeaders\(version\)/g) ?? []
    expect(writes).toHaveLength(2)
    expect(headers).toHaveLength(writes.length)
  })

  it('le corps d’une saisie reste très en dessous de la limite de 16 Ko', () => {
    expect(JSON.stringify(submission).length).toBeLessThan(API_JSON_BODY_MAX_BYTES / 50)
  })
})
