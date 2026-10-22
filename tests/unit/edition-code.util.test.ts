import { describe, expect, it } from 'vitest'
import { buildEditionCode } from '../../src/utils/edition-code.util'

describe('buildEditionCode', () => {
  it('uses the bare year for the first edition of a year', () => {
    expect(buildEditionCode(2027, [])).toBe('2027')
    expect(buildEditionCode(2027, ['2026', '2026b', '2028'])).toBe('2027')
  })

  it('suffixes the second edition of a year with b, then c', () => {
    expect(buildEditionCode(2027, ['2027'])).toBe('2027b')
    expect(buildEditionCode(2027, ['2027', '2027b'])).toBe('2027c')
  })

  it('continues after the legacy 2012a / 2012b pair', () => {
    expect(buildEditionCode(2012, ['2012a', '2012b'])).toBe('2012c')
  })

  it('never reuses a code even when a suffix is missing in the series', () => {
    expect(buildEditionCode(2027, ['2027', '2027d'])).toBe('2027e')
  })

  it('ignores codes of other years that merely start with the same digits', () => {
    expect(buildEditionCode(202, ['2027'])).toBe('202')
  })

  it('returns null once the 25 suffixes of the year are used', () => {
    const all = ['2027', ...[...'bcdefghijklmnopqrstuvwxyz'].map((letter) => `2027${letter}`)]
    expect(buildEditionCode(2027, all)).toBeNull()
  })
})
