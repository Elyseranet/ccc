import { describe, expect, it } from 'vitest'
import { splitEmphasis } from '../../src/utils/emphasis.util'

describe('splitEmphasis', () => {
  it('coupe la phrase autour de {strong}, l’ordre des mots reste celui de la traduction', () => {
    expect(splitEmphasis('Les points sont {strong} : barème × N.', 'figés')).toEqual([
      { text: 'Les points sont ', strong: false },
      { text: 'figés', strong: true },
      { text: ' : barème × N.', strong: false }
    ])
    expect(splitEmphasis('{strong} : tous les points.', 'Figés')).toEqual([
      { text: 'Figés', strong: true },
      { text: ' : tous les points.', strong: false }
    ])
  })

  it('sans marqueur : une seule partie ordinaire', () => {
    expect(splitEmphasis('Rien en emphase.', 'x')).toEqual([{ text: 'Rien en emphase.', strong: false }])
  })
})
