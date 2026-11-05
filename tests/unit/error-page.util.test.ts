import { describe, expect, it } from 'vitest'
import { ERROR_PAGE_KIND } from '../../src/enums/error-page-kind.enum'
import { resolveErrorPageKind } from '../../src/utils/error-page.util'

describe('resolveErrorPageKind', () => {
  it('un 404 a son propre texte', () => {
    expect(resolveErrorPageKind(404)).toBe(ERROR_PAGE_KIND.NOT_FOUND)
  })

  it('toute autre erreur reçoit le texte générique', () => {
    for (const status of [400, 403, 500, 503, 0]) {
      expect(resolveErrorPageKind(status)).toBe(ERROR_PAGE_KIND.GENERIC)
    }
  })
})
