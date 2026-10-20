import { defineConfig } from '@playwright/test'

/*********************************************************
 * e2e sur le BUILD de production (OPS-3)
 *
 * @description
 * Les e2e habituels tournent sur `nuxt dev`, où toutes les pages sont visibles : ils ne peuvent pas voir le
 * masquage des pages non livrées. Cette configuration vise un serveur de production :
 * - `E2E_BASE_URL` pointe vers un conteneur de l'image (voir README, « Déploiement Coolify »), ou
 * - sans `E2E_BASE_URL`, elle lance `node .output/server/index.mjs` après `npm run build` (variables
 *   `NUXT_DATABASE_*` à passer en ligne de commande, jamais depuis un `.env` copié).
 ********************************************************/
const PORT = Number(process.env.E2E_PORT ?? 3200)
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`

export default defineConfig({
  testDir: 'tests/e2e-release',
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: BASE_URL },
  ...(process.env.E2E_BASE_URL
    ? {}
    : {
        webServer: {
          command: `NODE_ENV=production PORT=${PORT} node .output/server/index.mjs`,
          url: `${BASE_URL}/api/v1/health`,
          reuseExistingServer: false,
          timeout: 60000
        }
      })
})
