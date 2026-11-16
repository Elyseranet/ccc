import { fileURLToPath } from 'node:url'
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'
import { requireTestDatabaseEnv } from './helpers/test-database'
import { API_TEST_SETUP_TIMEOUT_MS } from './helpers/nuxt-setup'

describe('SEO routes, non-indexable site (T-SEO-01)', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    setupTimeout: API_TEST_SETUP_TIMEOUT_MS,
    server: true,
    env: requireTestDatabaseEnv()
  })

  it('serves a robots.txt that disallows everything', async () => {
    const response = await fetch('/robots.txt')
    expect(response.status).toBe(200)
    expect(await response.text()).toBe('User-agent: *\nDisallow: /\n')
  })

  it('sets X-Robots-Tag noindex on a public page, on robots.txt and on an API response', async () => {
    for (const path of ['/regles', '/robots.txt', '/api/v1/health']) {
      expect((await fetch(path)).headers.get('x-robots-tag'), path).toBe('noindex, nofollow')
    }
  })

  it('answers 404 on sitemap.xml', async () => {
    expect((await fetch('/sitemap.xml')).status).toBe(404)
  })
})
