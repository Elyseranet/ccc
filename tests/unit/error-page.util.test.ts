import { describe, expect, it } from 'vitest'
import { ERROR_PAGE_KIND } from '../../src/enums/error-page-kind.enum'
import { isKnownStatusCode, resolveErrorPageKind } from '../../src/utils/error-page.util'

describe('resolveErrorPageKind', () => {
  it('un 404 a son propre texte', () => {
    expect(resolveErrorPageKind(404)).toBe(ERROR_PAGE_KIND.NOT_FOUND)
  })

  it('toute autre erreur, code inconnu compris, reçoit le texte générique', () => {
    for (const status of [400, 403, 500, 503, 0, undefined]) {
      expect(resolveErrorPageKind(status)).toBe(ERROR_PAGE_KIND.GENERIC)
    }
  })
})

describe('isKnownStatusCode', () => {
  it('accepte un code HTTP de 100 à 599', () => {
    for (const status of [100, 404, 500, 599]) {
      expect(isKnownStatusCode(status)).toBe(true)
    }
  })

  it('refuse l’absence de code, 0 (erreur réseau), NaN, un décimal et une valeur hors plage', () => {
    for (const status of [undefined, 0, Number.NaN, 404.5, 99, 600, -1]) {
      expect(isKnownStatusCode(status)).toBe(false)
    }
  })
})
