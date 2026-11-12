import 'reflect-metadata'
import { fileURLToPath } from 'node:url'
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { afterAll, describe, expect, it } from 'vitest'
import { requireTestDatabaseEnv } from './helpers/test-database'
import { API_TEST_SETUP_TIMEOUT_MS } from './helpers/nuxt-setup'
import { seedPublicEditions } from './helpers/seed-public-editions'

const SITE_URL = 'https://caps.example'

describe('SEO routes, indexable site (T-SEO-01)', async () => {
  const env = requireTestDatabaseEnv()
  Object.assign(process.env, env)
  const { default: dataSource } = await import('../../src/server/db/typeorm/data-source')
  await dataSource.initialize()
  await dataSource.dropDatabase()
  await dataSource.runMigrations()
  const { editions } = await seedPublicEditions(dataSource)
  const players = await dataSource.query('SELECT id FROM competitors') as Array<{ id: string }>

  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    setupTimeout: API_TEST_SETUP_TIMEOUT_MS,
    server: true,
    env: { ...env, NUXT_PUBLIC_SITE_INDEXABLE: 'true', NUXT_PUBLIC_SITE_URL: SITE_URL }
  })

  afterAll(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  })

  it('serves robots.txt with the private disallows and the sitemap', async () => {
    const response = await fetch('/robots.txt')
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/plain')
    const text = await response.text()
    expect(text).toContain('Disallow: /admin')
    expect(text).toContain('Disallow: /api/')
    expect(text).not.toMatch(/^Disallow: \/$/m)
    expect(text).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`)
  })

  it('does not set X-Robots-Tag on a public page', async () => {
    expect((await fetch('/regles')).headers.get('x-robots-tag')).toBeNull()
  })

  it('sets X-Robots-Tag noindex on a legal page even when indexable', async () => {
    const response = await fetch('/mentions-legales')
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow')
  })

  it('serves a sitemap with public pages, editions and players, and no private or legal page', async () => {
    const response = await fetch('/sitemap.xml')
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('application/xml')
    const locs = [...(await response.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]!)
    expect(locs).toContain(SITE_URL)
    expect(locs).toContain(`${SITE_URL}/editions`)
    for (const { code } of Object.values(editions)) {
      expect(locs).toContain(`${SITE_URL}/editions/${code}`)
    }
    expect(players.length).toBeGreaterThan(0)
    for (const { id } of players) {
      expect(locs).toContain(`${SITE_URL}/joueurs/${id}`)
    }
    for (const loc of locs) {
      expect(loc.startsWith(SITE_URL)).toBe(true)
      expect(loc).not.toMatch(/\/(admin|connexion|profil|invitation|mentions-legales|confidentialite|cgu|accessibilite)(\/|$)/)
    }
  })
})
