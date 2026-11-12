import { LEGAL_MARKER_PATTERN } from '../consts/legal.const.js'
import type { ILegalTextPart } from '../interfaces/legal.interface.js'

/** Découpe un texte en segments, en isolant chaque marqueur `[À FOURNIR : …]` pour pouvoir le mettre en évidence. */
export const splitLegalMarkers = (text: string): ILegalTextPart[] =>
  text.split(LEGAL_MARKER_PATTERN)
    .filter(part => part !== '')
    .map(part => ({ text: part, marker: LEGAL_MARKER_PATTERN.test(part) }))
