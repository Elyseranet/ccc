import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { signIn } from '../helpers/session'

/*********************************************************
 * F-13 : admin, éditions et compétiteurs, lectures et accessibilité (aucune écriture)
 *
 * @description
 * Données réelles de la base de test : 2026 en phase de poules (QA-2) et les archives clôturées. Rien n'est modifié. Les parcours
 * qui écrivent sont dans `writes/F-13.spec.ts`. Chaque page admin : un seul h1, 0 violation axe WCAG 2.2 AA, état clos en lecture seule.
 ********************************************************/
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

interface IEditionRow { id: string, code: string, status: string }
interface ICompetitorItem { id: string, displayName: string }

const violationsOf = async (page: Page) => {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
  return results.violations.map(violation => `${violation.id}: ${violation.nodes.map(node => node.target.join(' ')).join(', ')}`)
}

const open = async (page: Page, path: string) => {
  await page.goto(path)
  await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('page-title')).toBeVisible()
}

test.describe('admin éditions et compétiteurs : lecture et accessibilité', () => {
  test.beforeEach(async ({ context }) => {
    await signIn(context, 'admin')
  })

  test('liste des éditions : un seul h1, table nommée, action nommée par édition, 0 violation axe', async ({ page }) => {
    const all = await (await page.request.get('/api/v1/editions')).json() as IEditionRow[]
    await open(page, '/admin/editions')
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.getByTestId('editions-table').locator('caption')).toHaveCount(1)
    await expect(page.getByTestId('editions-table').locator('tbody tr')).toHaveCount(all.length)
    await expect(page.getByTestId('editions-action-2026')).toHaveAttribute('aria-label', 'Modifier l’édition 2026')
    await expect(page.getByTestId('editions-action-2025')).toHaveText('Consulter')
    await expect(page.getByTestId('editions-create')).toHaveAttribute('href', '/admin/editions/nouvelle')
    expect(await violationsOf(page)).toEqual([])
  })

  test('création : formulaire sans champ Code, alerte info Code, 0 violation axe', async ({ page }) => {
    await open(page, '/admin/editions/nouvelle')
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.getByTestId('edition-form-year').locator('input')).toHaveAttribute('inputmode', 'numeric')
    await expect(page.getByTestId('edition-form-year').locator('input')).toHaveAttribute('maxlength', '4')
    await expect(page.getByTestId('edition-form-code-info')).toHaveAttribute('role', 'status')
    expect(await violationsOf(page)).toEqual([])
  })

  test('édition en cours : année et code en lecture seule, formulaire modifiable, 0 violation axe', async ({ page }) => {
    await open(page, '/admin/editions/2026')
    await expect(page.getByTestId('edition-readonly-code')).toContainText('2026')
    await expect(page.getByTestId('edition-form-year')).toHaveCount(0)
    await expect(page.getByTestId('edition-form')).toBeVisible()
    expect(await violationsOf(page)).toEqual([])
  })

  test('édition clôturée : lecture seule, bandeau info role=status, aucun formulaire, 0 violation axe', async ({ page }) => {
    await open(page, '/admin/editions/2025')
    await expect(page.getByTestId('edition-closed-notice')).toContainText('Édition clôturée')
    await expect(page.getByTestId('edition-closed-notice')).toHaveAttribute('role', 'status')
    await expect(page.locator('form')).toHaveCount(0)
    expect(await violationsOf(page)).toEqual([])
  })

  test('annuaire et fiche d’un compétiteur : table nommée, ligne marquée, photo nommée, 0 violation axe', async ({ page }) => {
    const list = await (await page.request.get('/api/v1/competiteurs?pageSize=10&sort=displayName')).json() as { items: ICompetitorItem[], total: number }
    await open(page, '/admin/competiteurs')
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.getByTestId('competitors-table').locator('caption')).toHaveCount(1)
    await expect(page.getByTestId('competitors-count')).toHaveText(`${list.total} compétiteurs`)
    expect(await violationsOf(page)).toEqual([])

    const first = list.items[0]!
    await open(page, `/admin/competiteurs/${first.id}`)
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.getByTestId('competitor-form-title')).toHaveText(first.displayName)
    await expect(page.getByTestId(`competitors-action-${first.id}`)).toBeVisible()
    await expect(page.getByTestId('competitor-photo-avatar')).toHaveAttribute('role', 'img')
    expect(await violationsOf(page)).toEqual([])
  })

  test('recherche d’un compétiteur : une saisie d’un caractère ne casse pas la liste, deux la filtrent', async ({ page }) => {
    await open(page, '/admin/competiteurs')
    const search = page.getByTestId('competitors-search').locator('input')
    await search.fill('a')
    await expect(page.getByTestId('competitors-table')).toBeVisible()
    await search.fill('zzzzzzqq')
    await expect(page.getByTestId('async-state-empty')).toBeVisible()
  })
})
