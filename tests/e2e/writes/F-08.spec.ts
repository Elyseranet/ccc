import { expect, test } from '@playwright/test'
import type { Page, Request } from '@playwright/test'
import { createDrawnEdition, selectAdminEdition } from '../helpers/edition-write'
import type { IWriteEdition } from '../helpers/edition-write'
import { signIn } from '../helpers/session'

/*********************************************************
 * F-08 : admin, poules et matchs, saisie de score, parcours d'ÉCRITURE (QA-3)
 *
 * @description
 * Chaque test crée SA propre édition par l'API réelle (inscrits, puis tirage des poules par les routes B-11 : aucun match
 * d'archive ni de 2026 n'est touché), la choisit dans le sélecteur de l'admin, puis passe par l'écran. Les requêtes
 * d'écriture sont comptées côté navigateur : un double clic ne doit en envoyer qu'une, et chaque écriture porte `If-Match`.
 ********************************************************/
interface IApiMatch { id: string, status: string, version: number, sides: Array<{ participationId: string, displayName: string, score: number | null, recordedScore: number | null }> }

const hydrated = async (page: Page) => {
  await page.waitForFunction(() => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false)
}

const openMatches = async (page: Page) => {
  await page.goto('/admin/matchs')
  await hydrated(page)
  await expect(page.getByTestId('admin-matches-queue')).toBeVisible()
}

const adminMatches = async (page: Page, edition: IWriteEdition): Promise<IApiMatch[]> =>
  (await (await page.request.get(`/api/v1/admin/editions/${edition.id}/matchs`)).json()) as IApiMatch[]

const writes = (page: Page): Request[] => {
  const seen: Request[] = []
  page.on('request', (request) => {
    if (request.url().includes('/api/v1/matchs/') && request.method() !== 'GET') {
      seen.push(request)
    }
  })
  return seen
}

const typeScore = async (page: Page, index: number, value: string) => {
  await page.getByTestId(`admin-score-input-${index}`).locator('input').fill(value)
}

const publicScores = async (page: Page, edition: IWriteEdition) =>
  ((await (await page.request.get(`/api/v1/editions/${edition.id}`)).json()) as { matches: Array<{ id: string, status: string, sides: Array<{ score: number | null }> }> }).matches

test.describe('admin matchs : écritures sur une édition créée par le test', () => {
  test.beforeEach(async ({ context }) => {
    await signIn(context, 'admin')
  })

  test('RG22 : un score qui n’atteint pas 5 est refusé avant envoi, puis enregistré sans devenir public', async ({ page, context }) => {
    const { edition } = await createDrawnEdition(context.request, 'f08 enregistrer')
    await selectAdminEdition(context, edition)
    const sent = writes(page)
    await openMatches(page)
    const [first] = await adminMatches(page, edition)

    await page.getByTestId(`admin-match-enter-${first!.id}`).click()
    await typeScore(page, 0, '3')
    await typeScore(page, 1, '2')
    await page.getByTestId('admin-score-validate').click()
    await expect(page.getByTestId('admin-score-form-error')).toContainText('exactement 5')
    expect(sent).toHaveLength(0)

    await typeScore(page, 0, '5')
    await typeScore(page, 1, '1')
    await page.getByTestId('admin-score-save').click()
    await expect(page.getByTestId('admin-score-dialog')).toHaveCount(0)
    await expect(page.getByTestId(`admin-match-${first!.id}`)).toContainText('Saisi · à valider')
    expect(sent).toHaveLength(1)
    expect(sent[0]!.method()).toBe('PUT')
    expect(sent[0]!.headers()['if-match']).toBe(`"${first!.version}"`)
    expect(sent[0]!.headers()['content-type']).toMatch(/^application\/json/)

    const saved = (await adminMatches(page, edition)).find(match => match.id === first!.id)!
    expect(saved.status).toBe('RECORDED')
    expect(saved.sides.map(side => side.recordedScore)).toEqual([5, 1])
    const published = (await publicScores(page, edition)).find(match => match.id === first!.id)
    expect(published?.sides.every(side => side.score === null)).toBe(true)
  })

  test('double clic sur « Valider » : une seule validation, avec la version renvoyée par la saisie, score alors public', async ({ page, context }) => {
    const { edition } = await createDrawnEdition(context.request, 'f08 valider')
    await selectAdminEdition(context, edition)
    const sent = writes(page)
    await openMatches(page)
    const [first] = await adminMatches(page, edition)

    await page.getByTestId(`admin-match-enter-${first!.id}`).click()
    await typeScore(page, 0, '2')
    await typeScore(page, 1, '5')
    await page.getByTestId('admin-score-save').click()
    await expect(page.getByTestId(`admin-match-${first!.id}`)).toContainText('Saisi · à valider')

    const trigger = page.getByTestId(`admin-match-validate-${first!.id}`)
    await trigger.click()
    await expect(page.getByTestId('admin-validate-text')).toContainText('2 – 5')
    await expect(page.getByTestId('admin-validate-cancel')).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('admin-validate-dialog')).toHaveCount(0)
    await expect(trigger).toBeFocused()

    await trigger.click()
    await page.getByTestId('admin-validate-confirm').dblclick()
    await expect(page.getByTestId(`admin-match-${first!.id}`)).toHaveCount(0)
    const validations = sent.filter(request => request.url().endsWith('/validation'))
    expect(validations).toHaveLength(1)
    expect(validations[0]!.headers()['if-match']).toBe(`"${first!.version + 1}"`)

    const done = (await adminMatches(page, edition)).find(match => match.id === first!.id)!
    expect(done.status).toBe('VALIDATED')
    const published = (await publicScores(page, edition)).find(match => match.id === first!.id)!
    expect(published.sides.map(side => side.score)).toEqual([2, 5])
  })

  test('« Valider » dans le dialogue sur un match sans score : saisie puis validation chaînées, versions lue puis renvoyée', async ({ page, context }) => {
    const { edition } = await createDrawnEdition(context.request, 'f08 chainer')
    await selectAdminEdition(context, edition)
    const sent = writes(page)
    await openMatches(page)
    const [first] = await adminMatches(page, edition)

    await page.getByTestId(`admin-match-enter-${first!.id}`).click()
    await typeScore(page, 0, '5')
    await typeScore(page, 1, '4')
    await page.getByTestId('admin-score-validate').click()
    await expect(page.getByTestId('admin-score-dialog')).toHaveCount(0)
    expect(sent.map(request => request.method())).toEqual(['PUT', 'POST'])
    expect(sent.map(request => request.headers()['if-match'])).toEqual([`"${first!.version}"`, `"${first!.version + 1}"`])
    expect((await adminMatches(page, edition)).find(match => match.id === first!.id)!.status).toBe('VALIDATED')
  })

  test('412 : le match a changé entre-temps, message « modifié, rechargez » et la ligne est rechargée', async ({ page, context }) => {
    const { edition } = await createDrawnEdition(context.request, 'f08 conflit')
    await selectAdminEdition(context, edition)
    await openMatches(page)
    const [first] = await adminMatches(page, edition)

    await page.getByTestId(`admin-match-enter-${first!.id}`).click()
    const other = await page.request.put(`/api/v1/matchs/${first!.id}/score`, {
      headers: { 'if-match': `"${first!.version}"` },
      data: { scores: first!.sides.map((side, index) => ({ participationId: side.participationId, score: index === 0 ? 5 : 0 })) }
    })
    expect(other.status()).toBe(200)
    await typeScore(page, 0, '1')
    await typeScore(page, 1, '5')
    await page.getByTestId('admin-score-save').click()
    await expect(page.getByTestId('admin-score-failure')).toContainText('modifié')
    await expect(page.getByTestId('admin-score-dialog')).toBeVisible()
    const stored = (await adminMatches(page, edition)).find(match => match.id === first!.id)!
    expect(stored.sides.map(side => side.recordedScore)).toEqual([5, 0])
  })

  test('Échap ferme la saisie et rend le focus au déclencheur ; le focus reste piégé dans le dialogue', async ({ page, context }) => {
    const { edition } = await createDrawnEdition(context.request, 'f08 clavier')
    await selectAdminEdition(context, edition)
    await openMatches(page)
    const [first] = await adminMatches(page, edition)
    const trigger = page.getByTestId(`admin-match-enter-${first!.id}`)

    await trigger.click()
    await expect(page.getByTestId('admin-score-form')).toBeVisible()
    for (let press = 0; press < 12; press += 1) {
      await page.keyboard.press('Tab')
      const outside = await page.evaluate(() => {
        const active = document.activeElement
        return active !== document.body && !active?.closest('[role=dialog]')
      })
      expect(outside).toBe(false)
    }
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('admin-score-dialog')).toHaveCount(0)
    await expect(trigger).toBeFocused()
  })

  test('édition archivée : lecture seule, aucune action sur les cartes', async ({ page, context }) => {
    const editions = (await (await context.request.get('/api/v1/editions')).json()) as Array<{ id: string, code: string, status: string }>
    const archive = editions.find(edition => edition.status === 'CLOSED')!
    await selectAdminEdition(context, { id: archive.id, code: archive.code, year: 0, status: archive.status })
    await page.goto('/admin/matchs')
    await hydrated(page)
    await expect(page.getByTestId('admin-matches-readonly')).toBeVisible()
    await expect(page.locator('[data-cy^="admin-match-enter-"], [data-cy^="admin-match-validate-"]')).toHaveCount(0)
  })

  test('mobile 390 px : le dialogue est ancré en bas, cibles tactiles d’au moins 44 px', async ({ page, context }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    const { edition } = await createDrawnEdition(context.request, 'f08 mobile')
    await selectAdminEdition(context, edition)
    await openMatches(page)
    const [first] = await adminMatches(page, edition)

    await page.getByTestId(`admin-match-enter-${first!.id}`).click()
    await expect(page.getByTestId('admin-score-form')).toBeVisible()
    const dialog = (await page.locator('[role=dialog]').first().boundingBox())!
    expect(Math.round(dialog.x)).toBe(0)
    expect(Math.round(dialog.width)).toBe(390)
    expect(Math.round(dialog.y + dialog.height)).toBe(844)
    for (const testId of ['admin-score-save', 'admin-score-validate']) {
      const box = (await page.getByTestId(testId).boundingBox())!
      expect(box.height).toBeGreaterThanOrEqual(44)
    }
    const inputs = await page.locator('[role=dialog] input').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().height))
    for (const height of inputs) {
      expect(height).toBeGreaterThanOrEqual(44)
    }
  })
})
