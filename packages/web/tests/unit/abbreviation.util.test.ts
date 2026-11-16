import { describe, expect, it } from 'vitest'
import { ABBREVIATION_KIND } from '../../src/enums/abbreviation.enum'
import { splitAbbreviations } from '../../src/utils/abbreviation.util'

describe('splitAbbreviations', () => {
  it('isole « ACP » et les codes de règle, et garde le texte autour', () => {
    expect(splitAbbreviations('au classement ACP (RG9), une par poule')).toEqual([
      { text: 'au classement ', kind: null, number: null },
      { text: 'ACP', kind: ABBREVIATION_KIND.ACP, number: null },
      { text: ' (', kind: null, number: null },
      { text: 'RG9', kind: ABBREVIATION_KIND.RULE, number: 9 },
      { text: '), une par poule', kind: null, number: null }
    ])
  })

  it('une plage « RG21-RG22 » donne deux codes ; un texte sans abréviation reste entier', () => {
    expect(splitAbbreviations('RG21-RG22').map(segment => segment.number)).toEqual([21, null, 22])
    expect(splitAbbreviations('Poules')).toEqual([{ text: 'Poules', kind: null, number: null }])
  })

  it('ne coupe pas un mot qui contient ces lettres', () => {
    expect(splitAbbreviations('ACPX ARG19')).toEqual([{ text: 'ACPX ARG19', kind: null, number: null }])
  })
})
