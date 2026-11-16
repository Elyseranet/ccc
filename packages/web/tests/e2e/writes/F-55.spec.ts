import { expect, test } from '@playwright/test'
import { createQualifiedEdition, selectAdminEdition } from '../helpers/edition-write'
import { signIn } from '../helpers/session'

/*********************************************************
 * F-55 : l'entrée « Phase finale » ouvre l'étape en cours (édition créée par le test, jamais 2026)
 *
 * @description
 * Une édition QUALIFIED (liste arrêtée) atterrit sur le tirage de tour et non sur la qualification.
 ********************************************************/
test('édition qualifiée : /admin/phase-finale ouvre le tirage de tour', async ({ page, context }) => {
  await signIn(context, 'admin')
  const edition = await createQualifiedEdition(context.request, 'f55 qualifiee', 2)
  await selectAdminEdition(context, edition)
  await page.goto('/admin/phase-finale')
  await expect(page).toHaveURL(/\/admin\/phase-finale\/tirage$/)
})
