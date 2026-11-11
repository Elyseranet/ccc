import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/*********************************************************
 * Budget public en lecture : relevé pour le seul serveur e2e (T-QA-09)
 *
 * @description
 * Les e2e partagent une seule IP : `playwright.config.ts` relève le budget public en passant
 * `NUXT_RATE_LIMIT_PUBLIC_READ_MAX_REQUESTS` à la commande de SON serveur (`nuxt dev`). Le défaut du runtimeConfig,
 * celui du build de production, reste 300 requêtes par minute (M3), et aucune autre configuration du dépôt ne le relève.
 ********************************************************/
const read = (file: string): string => readFileSync(file, 'utf8')

describe('budget public en lecture (M3, T-QA-09)', () => {
  it('le runtimeConfig garde 300 requêtes par minute', () => {
    expect(read('nuxt.config.ts')).toMatch(/publicRead:\s*\{\s*windowMs:\s*60000,\s*maxRequests:\s*300\s*\}/)
  })

  it('le relèvement ne vit que dans la commande du serveur Playwright', () => {
    const config = read('playwright.config.ts')
    const command = config.match(/command:\s*`([^`]*)`/)?.[1] ?? ''
    expect(command).toContain('NUXT_RATE_LIMIT_PUBLIC_READ_MAX_REQUESTS=')
    expect(config.split('NUXT_RATE_LIMIT_PUBLIC_READ_MAX_REQUESTS').length - 1).toBe(1)
    expect(read('.env.example')).toContain('NUXT_RATE_LIMIT_PUBLIC_READ_MAX_REQUESTS=300')
  })
})
