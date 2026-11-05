import { describe, expect, it } from 'vitest'
import { splitLegalMarkers } from '../../src/utils/legal-text.util'

describe('splitLegalMarkers', () => {
  it('renvoie un seul segment sans marqueur', () => {
    expect(splitLegalMarkers('Accès gratuit.')).toEqual([{ text: 'Accès gratuit.', marker: false }])
  })

  it('isole chaque marqueur À FOURNIR et garde le texte autour', () => {
    expect(splitLegalMarkers('Elysera [À FOURNIR : dénomination] · [À FOURNIR : adresse email de contact RGPD]')).toEqual([
      { text: 'Elysera ', marker: false },
      { text: '[À FOURNIR : dénomination]', marker: true },
      { text: ' · ', marker: false },
      { text: '[À FOURNIR : adresse email de contact RGPD]', marker: true }
    ])
  })

  it('reconnaît aussi À CONFIRMER', () => {
    expect(splitLegalMarkers('(aucune durée fixée) [À CONFIRMER : décision utilisateur]').filter(part => part.marker))
      .toEqual([{ text: '[À CONFIRMER : décision utilisateur]', marker: true }])
  })

  it('ne prend pas pour un marqueur un texte entre crochets quelconque', () => {
    expect(splitLegalMarkers('[autre chose]').some(part => part.marker)).toBe(false)
  })

  it('renvoie une liste vide pour un texte vide', () => {
    expect(splitLegalMarkers('')).toEqual([])
  })
})
