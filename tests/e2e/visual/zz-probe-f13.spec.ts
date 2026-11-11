import { test } from '@playwright/test'
import { open } from '../visual.util'
import { signIn } from '../helpers/session'

for (const width of [1440, 390]) {
  test(`probe ${width}`, async ({ page, browser, context }) => {
    await signIn(context, 'admin')
    const { mockup } = await open(page, browser, { width, height: 900 }, 'admin-editions.html', '/admin')
    const out: Record<string, unknown> = {}
    for (const [anchor, selector] of [['ed-p-list', '#ed-p-list table'], ['ed-p-comp', '#ed-p-comp table']] as const) {
      await mockup.evaluate((hash) => {
        location.hash = hash
      }, `#${anchor}`)
      await mockup.waitForTimeout(200)
      out[anchor] = await mockup.evaluate((value) => {
        const table = document.querySelector(value) as HTMLElement
        const wrap = table.parentElement as HTMLElement
        return {
          table: table.getBoundingClientRect().width,
          wrap: wrap.getBoundingClientRect().width,
          scroll: wrap.scrollWidth,
          cols: [...table.querySelectorAll('thead th')].map(th => Math.round(th.getBoundingClientRect().width * 100) / 100)
        }
      }, selector)
    }
    console.log(`PROBE${width} ` + JSON.stringify(out))
  })
}
