import { test } from '@playwright/test'
import { createFinalValidatedEdition, selectAdminEdition } from '../helpers/edition-write'
import { signIn } from '../helpers/session'
import { MOCKUP_DIR, settle } from '../visual.util'

const read = (selector: string) => {
  const element = document.querySelector(selector) as HTMLElement
  const style = getComputedStyle(element)
  const rect = element.getBoundingClientRect()
  const label = element.querySelector('.origam-btn__content, .origam-btn__text') as HTMLElement | null
  return {
    width: rect.width, height: rect.height, paddingLeft: style.paddingLeft, paddingRight: style.paddingRight, fontSize: style.fontSize, fontWeight: style.fontWeight, letterSpacing: style.letterSpacing,
    labelWidth: label ? label.getBoundingClientRect().width : null, text: element.textContent?.trim()
  }
}

test('probe bouton clôture', async ({ page, browser, context }) => {
  await signIn(context, 'admin')
  const edition = await createFinalValidatedEdition(context.request, 'f26 probe')
  await selectAdminEdition(context, edition)
  const mockContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const mockup = await mockContext.newPage()
  await mockup.goto(`file://${MOCKUP_DIR}/admin-cloture.html`)
  await settle(mockup)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/admin/phase-finale/cloture')
  await page.getByTestId('closing-open').waitFor()
  await settle(page)
  console.log('PROBE mockup', JSON.stringify(await mockup.evaluate(read, '.q-sec .q-act .btn')))
  console.log('PROBE app', JSON.stringify(await page.evaluate(read, '[data-cy="closing-open"]')))
  await page.setViewportSize({ width: 1440, height: 900 })
  await mockup.setViewportSize({ width: 1440, height: 900 })
  await settle(page)
  const rows = ([selectorRow, selectorKey, selectorValue, selectorRoot]: string[]) => {
    const box = (element: Element | null) => element ? Math.round((element as HTMLElement).getBoundingClientRect().height * 100) / 100 : null
    const root = document.querySelector(selectorRoot) as HTMLElement
    return { root: box(root), rows: [...root.querySelectorAll(selectorRow)].map(row => ({ row: box(row), key: box(row.querySelector(selectorKey)), value: box(row.querySelector(selectorValue)), valueLine: getComputedStyle(row.querySelector(selectorValue)!).lineHeight, valueFont: getComputedStyle(row.querySelector(selectorValue)!).fontSize })) }
  }
  console.log('PROBE facts mockup', JSON.stringify(await mockup.evaluate(rows, ['.c-facts > div', 'dt', 'dd', '.c-facts'])))
  console.log('PROBE facts app', JSON.stringify(await page.evaluate(rows, ['.origam-data-list__kv-row', '.origam-data-list__kv-key', '.origam-data-list__kv-value', '[data-cy="closing-facts"]'])))
  await mockContext.close()
})
