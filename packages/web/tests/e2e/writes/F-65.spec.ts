import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import { API_ROUTES } from '../../../src/consts/api-routes.const'
import { API_ENDPOINT } from '../../../src/enums/api-endpoint.enum'
import { signIn } from '../helpers/session'

/*********************************************************
 * F-65 : admin, export Excel d'une édition
 *
 * @description
 * Le téléchargement dépend de la route B-30 : `test.fixme` tant qu'elle porte un `pendingTicket`, il se réactive seul à son merge.
 * Une édition en cours et une archive (2012a) : fichier `ccc-<code>.xlsx` non vide.
 ********************************************************/
const AWAITING = API_ROUTES[API_ENDPOINT.ADMIN_EDITION_EXPORT].pendingTicket

test.describe('admin fiche d’édition : export Excel', () => {
  test.beforeEach(async ({ context }) => {
    test.fixme(Boolean(AWAITING), `en attente de ${AWAITING} : GET /admin/editions/{id}/export.xlsx`)
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
