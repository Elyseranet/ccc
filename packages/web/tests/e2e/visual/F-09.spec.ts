import { expect, test } from '@playwright/test'
import { signIn } from '../helpers/session'
import { open, verticalGap } from '../visual.util'

/*********************************************************
 * Participants de l'admin : espaces de la carte « Ajouter » (F-50, F-09, ARCH-9)
 *
 * @description
 * `origam-card` enveloppe son contenu dans `origam-card__content` : sans conteneur propre, le `gap` de la carte ne touchait pas
 * titre, intro et bandeau (0 px). Les espaces de l'application sont comparés à ceux de `admin-participants.html` (`.pa-add`),
 * à 1440 et à 390. L'édition 2026 n'accepte plus d'inscriptions : la carte ne porte que titre, intro et bandeau, jamais le
 * champ de recherche (le champ ouvert est mesuré dans `writes/F-09.spec.ts`).
 ********************************************************/
const VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '390', width: 390, height: 844 }
]

for (const viewport of VIEWPORTS) {
  test.describe(`admin participants, carte « Ajouter », ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    test('édition 2026 (inscriptions closes) : espaces titre, intro, bandeau égaux à la maquette, aucun champ de recherche', async ({ page, browser, context }) => {
      await signIn(context, 'admin')
      const { mockup, mockContext } = await open(page, browser, viewport, 'admin-participants.html', '/admin/participants')
      await expect(page.getByTestId('participant-read-only')).toBeVisible()
      await expect(page.getByTestId('participant-search')).toHaveCount(0)

      const card = '[data-cy="participant-add"]'
      const title = `${card} .admin-participants__card-title`
      const lead = `${card} .admin-participants__lead`
      const alert = '[data-cy="participant-read-only"]'
      const titleToLead = await verticalGap(page, title, lead)
      const leadToBlock = await verticalGap(page, lead, alert)
      expect(titleToLead).toBe(await verticalGap(mockup, '.pa-add .h-card', '.pa-add > p.muted'))
      expect(leadToBlock).toBe(await verticalGap(mockup, '.pa-add > p.muted', '.pa-add .combo'))
      expect(titleToLead).toBeGreaterThan(0)
      expect(leadToBlock).toBeGreaterThan(0)
      await mockContext.close()
    })
  })
}
