import { chromium } from '@playwright/test'

/*********************************************************
 * perf-baseline
 *
 * @description
 * Mesure de référence du lot 0 (§12 de F-00), à lancer sur le build de production (`node .output/server/index.mjs`).
 * Par route : poids JS et CSS initial transférés (même origine), et LCP en throttling mobile
 * (CPU x4, réseau « Fast 4G » 1,6 Mbit/s descendant, 150 ms de latence, viewport 390 x 844).
 * Aucun budget n'est fixé ici : ces chiffres deviennent le budget des tickets suivants.
 ********************************************************/
const BASE = process.env.PERF_BASE_URL ?? 'http://localhost:3100'
const ROUTES = ['/', '/editions/00000000-0000-4000-0002-000000000002']
const RUNS = Number(process.env.PERF_RUNS ?? 5)

const browser = await chromium.launch()
const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]

for (const route of ROUTES) {
  const lcps = []
  let js = 0
  let css = 0
  for (let run = 0; run < RUNS; run++) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 2 })
    const page = await context.newPage()
    const client = await context.newCDPSession(page)
    await client.send('Network.enable')
    await client.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 })
    await client.send('Emulation.setCPUThrottlingRate', { rate: 4 })
    const sizes = new Map()
    client.on('Network.responseReceived', (event) => { sizes.set(event.requestId, { url: event.response.url, type: event.type }) })
    client.on('Network.loadingFinished', (event) => {
      const entry = sizes.get(event.requestId)
      if (entry) {
        entry.bytes = event.encodedDataLength
      }
    })
    await page.addInitScript(() => {
      window.__lcp = 0
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          window.__lcp = entry.startTime
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true })
    })
    await page.goto(`${BASE}${route}`, { waitUntil: 'load', timeout: 120000 })
    await page.waitForTimeout(3000)
    lcps.push(await page.evaluate(() => window.__lcp))
    if (run === 0) {
      for (const entry of sizes.values()) {
        if (!entry.url.startsWith(BASE) || entry.bytes === undefined) {
          continue
        }
        if (entry.type === 'Script') {
          js += entry.bytes
        }
        if (entry.type === 'Stylesheet') {
          css += entry.bytes
        }
      }
    }
    await context.close()
  }
  console.log(JSON.stringify({ route, runs: RUNS, jsKB: Math.round(js / 102.4) / 10, cssKB: Math.round(css / 102.4) / 10, lcpMsMedian: Math.round(median(lcps)), lcpMsAll: lcps.map(Math.round) }))
}
await browser.close()
