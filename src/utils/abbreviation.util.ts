import { ABBREVIATION_RULE_CODE, ABBREVIATION_TOKEN } from '../consts/abbreviation.const.js'
import { ABBREVIATION_KIND } from '../enums/abbreviation.enum.js'
import type { IAbbreviationSegment } from '../interfaces/abbreviation.interface.js'

/** Découpe un texte en segments : du texte simple, et les abréviations (« ACP », « RG19 ») à envelopper dans `<abbr>`. */
export const splitAbbreviations = (text: string): IAbbreviationSegment[] =>
  text.split(ABBREVIATION_TOKEN).filter(part => part !== '').map((part) => {
    if (part === 'ACP') {
      return { text: part, kind: ABBREVIATION_KIND.ACP, number: null }
    }
    const rule = ABBREVIATION_RULE_CODE.exec(part)
    return rule ? { text: part, kind: ABBREVIATION_KIND.RULE, number: Number(rule[1]) } : { text: part, kind: null, number: null }
  })
