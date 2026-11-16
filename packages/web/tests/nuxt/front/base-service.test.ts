import { registerEndpoint } from '@nuxt/test-utils/runtime'
import { defineEventHandler, getHeader, readRawBody } from 'h3'
import { describe, expect, it, vi } from 'vitest'
import { BaseService } from '../../../src/services/base.service'

class ProbeService extends BaseService {
  constructor () {
    super()
  }

  send (body: Record<string, unknown> | FormData, headers?: Record<string, string>) {
    return this.request<{ ok: boolean }>('/probe', { method: 'PUT', body, headers })
  }
}

describe('BaseService : corps de requête', () => {
  it('un objet part en application/json', async () => {
    const seen = vi.fn()
    registerEndpoint('/api/v1/probe', { method: 'PUT', handler: defineEventHandler(async (event) => {
      seen(getHeader(event, 'content-type'), await readRawBody(event))
      return { ok: true }
    }) })
    await new ProbeService().send({ nom: 'avatar' })
    expect(seen.mock.calls[0]![0]).toMatch(/^application\/json/)
    expect(seen.mock.calls[0]![1]).toBe('{"nom":"avatar"}')
  })

  it('un FormData part en multipart avec le boundary du navigateur, sans Content-Type forcé', async () => {
    const seen = vi.fn()
    registerEndpoint('/api/v1/probe', { method: 'PUT', handler: defineEventHandler((event) => {
      seen(getHeader(event, 'content-type'))
      return { ok: true }
    }) })
    const form = new FormData()
    form.append('file', new Blob(['x'], { type: 'image/png' }), 'avatar.png')
    await new ProbeService().send(form)
    expect(seen.mock.calls[0]![0]).toMatch(/^multipart\/form-data; boundary=/)
    expect(seen.mock.calls[0]![0]).not.toMatch(/application\/json/)
  })

  it('transmet les en-têtes de l\'appel (If-Match) sans toucher au Content-Type', async () => {
    const seen = vi.fn()
    registerEndpoint('/api/v1/probe', { method: 'PUT', handler: defineEventHandler((event) => {
      seen(getHeader(event, 'if-match'), getHeader(event, 'content-type'))
      return { ok: true }
    }) })
    await new ProbeService().send({ nom: 'x' }, { 'if-match': '"3"' })
    expect(seen.mock.calls[0]![0]).toBe('"3"')
    expect(seen.mock.calls[0]![1]).toMatch(/^application\/json/)
  })

  it('ne pose aucun en-tête Content-Type à la main', async () => {
    const { readFileSync } = await import('node:fs')
    const code = readFileSync('src/services/base.service.ts', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
    expect(code).not.toMatch(/Content-Type/i)
  })
})
