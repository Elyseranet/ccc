import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import { signIn } from '../helpers/session'

/*********************************************************
 * F-65 : admin, export Excel d'une édition
 *
 * @description
 * Téléchargement réel contre la route B-30.
 * Une édition en cours et une archive (2012a) : fichier `ccc-<code>.xlsx` non vide.
 ********************************************************/
test.describe('admin fiche d’édition : export Excel', () => {
  test.beforeEach(async ({ context }) => {
    await signIn(context, 'admin')
  })

  for (const code of ['2012a']) {
    test(`édition ${code} : le bouton télécharge ccc-${code}.xlsx, non vide`, async ({ page }) => {
      await page.goto(`/admin/editions/${code}`)
      await page.waitForLoadState('networkidle')
      const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('edition-export').click()])
      expect(download.suggestedFilename()).toBe(`ccc-${code}.xlsx`)
      const path = await download.path()
      expect((await readFile(path)).byteLength).toBeGreaterThan(0)
    })
  }
})
