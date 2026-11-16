import { expect, test } from '@playwright/test'
import { REDIRECTS } from './pages.const'

test.describe('redirections permanentes', () => {
  for (const redirect of REDIRECTS) {
    test(`${redirect.from} répond 301 vers ${redirect.to}`, async ({ request }) => {
      const response = await request.get(redirect.from, { maxRedirects: 0 })
      expect(response.status()).toBe(301)
      expect(response.headers().location).toBe(redirect.to)
    })
  }
})
