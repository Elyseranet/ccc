import { EMPHASIS_PLACEHOLDER } from '../consts/emphasis.const.js'
import type { IEmphasisPart } from '../interfaces/emphasis.interface.js'

/**
 * Découpe une phrase traduite autour de `{strong}` : le texte avant, le mot en emphase, le texte après. Sans marqueur, une seule partie ordinaire.
 */
export const splitEmphasis = (sentence: string, strong: string): IEmphasisPart[] => {
  const [before = '', ...rest] = sentence.split(EMPHASIS_PLACEHOLDER)
  if (rest.length === 0) {
    return [{ text: before, strong: false }]
  }
  return [
    { text: before, strong: false },
    { text: strong, strong: true },
    { text: rest.join(EMPHASIS_PLACEHOLDER), strong: false }
  ].filter(part => part.text !== '')
}
