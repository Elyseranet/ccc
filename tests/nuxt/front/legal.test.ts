import { describe, expect, it } from 'vitest'
import { LEGAL_ACCESSIBILITY_CONTENT } from '../../../src/consts/legal-accessibility.const'
import { LEGAL_NOTICE_CONTENT } from '../../../src/consts/legal-notice.const'
import { LEGAL_PRIVACY_CONTENT } from '../../../src/consts/legal-privacy.const'
import { LEGAL_TERMS_CONTENT } from '../../../src/consts/legal-terms.const'
import { PAGE_DELIVERY } from '../../../src/consts/page-delivery.const'
import { LEGAL_NAVIGATION } from '../../../src/consts/public-navigation.const'
import { ROUTES } from '../../../src/consts/routes.const'
import type { ILegalPageContent } from '../../../src/interfaces/legal.interface'
import { filterDeliveredItems } from '../../../src/utils/page-delivery.util'

const PAGES: ILegalPageContent[] = [LEGAL_NOTICE_CONTENT, LEGAL_PRIVACY_CONTENT, LEGAL_TERMS_CONTENT, LEGAL_ACCESSIBILITY_CONTENT]
const LEGAL_ROUTES = [ROUTES.LEGAL_NOTICE, ROUTES.PRIVACY, ROUTES.TERMS, ROUTES.ACCESSIBILITY]

describe('pages légales (F-19)', () => {
  it('les quatre routes sont /mentions-legales, /confidentialite, /cgu et /accessibilite', () => {
    expect(LEGAL_ROUTES).toEqual(['/mentions-legales', '/confidentialite', '/cgu', '/accessibilite'])
  })

  it('les quatre pages restent non livrées tant que le ticket n’est pas complet', () => {
    for (const route of LEGAL_ROUTES) {
      expect(PAGE_DELIVERY[route]?.delivered).toBe(false)
    }
  })

  it('le pied de page lie les quatre pages, filtrées par la règle de livraison', () => {
    expect(LEGAL_NAVIGATION.map(item => item.to)).toEqual(LEGAL_ROUTES)
    expect(filterDeliveredItems(LEGAL_NAVIGATION, false)).toEqual([])
    expect(filterDeliveredItems(LEGAL_NAVIGATION, true)).toHaveLength(4)
  })

  it('chaque page a sa route, des ancres uniques, et renvoie vers les trois autres', () => {
    for (const page of PAGES) {
      const ids = page.sections.map(section => section.id)
      expect(new Set(ids).size).toBe(ids.length)
      expect(page.related.map(link => link.to).sort()).toEqual(LEGAL_ROUTES.filter(route => route !== page.path).sort())
    }
    expect(PAGES.map(page => page.path)).toEqual(LEGAL_ROUTES)
  })

  it('le sommaire de la politique de confidentialité couvre les sections du ticket', () => {
    expect(LEGAL_PRIVACY_CONTENT.sections.map(section => section.id)).toEqual([
      'responsable', 'donnees', 'finalites', 'durees', 'destinataires', 'droits', 'cookies', 'majeurs'
    ])
  })

  it('la politique liste les trois cookies', () => {
    const cookies = LEGAL_PRIVACY_CONTENT.sections.find(section => section.id === 'cookies')
    const names = cookies?.blocks.flatMap(block => block.table?.rows.map(row => row[0]?.code) ?? [])
    expect(names).toEqual(['ccc_session', 'ccc_device', 'ccc_admin_edition'])
  })

  it('la déclaration d’accessibilité n’affirme jamais être conforme', () => {
    const statement = LEGAL_ACCESSIBILITY_CONTENT.sections[0]!.blocks[0]!.text!.fallback
    expect(statement).toContain('pas déclaré')
  })
})
