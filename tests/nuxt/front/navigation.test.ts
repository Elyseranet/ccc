import { describe, expect, it } from 'vitest'
import { ADMIN_BOTTOM_NAVIGATION, ADMIN_NAVIGATION } from '../../../src/consts/admin-navigation.const'
import { FOOTER_NAVIGATION, PUBLIC_NAVIGATION } from '../../../src/consts/public-navigation.const'

describe('navigation publique (A5, E-d)', () => {
  it('4 entrées : Éditions, Joueurs, Palmarès, Règles', () => {
    expect(PUBLIC_NAVIGATION.map(item => item.to)).toEqual(['/editions', '/joueurs', '/palmares', '/regles'])
  })

  it('le pied de page porte Règles, Palmarès et l’unique lien Connexion', () => {
    expect(FOOTER_NAVIGATION.map(item => item.to)).toEqual(['/regles', '/palmares', '/connexion'])
    expect(PUBLIC_NAVIGATION.some(item => item.to === '/connexion')).toBe(false)
  })
})

describe('navigation admin (A7, FA-05, FA-09)', () => {
  const items = ADMIN_NAVIGATION.flatMap(group => group.items)

  it('masque Bracket tant qu’aucun ticket ne le porte, et porte Éditions et Compétiteurs (F-13) dans le Référentiel', () => {
    const paths = items.map(item => item.to)
    expect(paths).toEqual(['/admin', '/admin/participants', '/admin/tirages', '/admin/matchs', '/admin/editions', '/admin/competiteurs'])
    expect(paths).not.toContain('/admin/bracket')
  })

  it('la barre basse a 4 entrées : Tableau, Matchs, Tirages, Plus', () => {
    expect(ADMIN_BOTTOM_NAVIGATION).toHaveLength(4)
    expect(ADMIN_BOTTOM_NAVIGATION.map(item => item.key)).toEqual([
      'layout.admin.bottom_dashboard',
      'layout.admin.bottom_matches',
      'layout.admin.bottom_draws',
      'layout.admin.bottom_more'
    ])
    expect(ADMIN_BOTTOM_NAVIGATION[3]!.to).toBe('/admin/plus')
  })
})
