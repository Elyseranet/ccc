import { SCORE_INPUT_PATTERN } from '../consts/score-entry.const.js'
import { SCORE_FIELD_ERROR, SCORE_FORM_ERROR } from '../enums/score-entry.enum.js'
import type { IScoreEntryRules, IScoreEntryValidation } from '../interfaces/score-entry.interface.js'
import { validateScore } from './score-rules.util.js'

/*********************************************************
 * Contrôle RG22 avant envoi
 *
 * @description
 * Le verdict est celui de `validateScore` (le même contrôle que le serveur, `score-rules.util`) : on ne réécrit pas la règle.
 * Ce module ne fait que lire les champs (texte saisi) et classer l'échec pour un message précis. Il évite un aller-retour réseau
 * sur une connexion incertaine ; le serveur reste l'autorité (422).
 ********************************************************/
export const classifyScoreField = (raw: string, target: number): SCORE_FIELD_ERROR | null => {
  const text = raw.trim()
  if (text === '') {
    return SCORE_FIELD_ERROR.MISSING
  }
  if (!SCORE_INPUT_PATTERN.test(text)) {
    return SCORE_FIELD_ERROR.NOT_INTEGER
  }
  return Number(text) > target ? SCORE_FIELD_ERROR.ABOVE_TARGET : null
}

export const validateScoreEntry = (rules: IScoreEntryRules, raw: readonly string[]): IScoreEntryValidation => {
  const fieldErrors = raw.map(value => classifyScoreField(value, rules.targetScore))
  if (fieldErrors.some(error => error !== null)) {
    return { valid: false, fieldErrors, formError: null, scores: [] }
  }
  const scores = raw.map(value => Number(value.trim()))
  if (validateScore(rules.roundKind, rules.purpose, scores).valid) {
    return { valid: true, fieldErrors, formError: null, scores }
  }
  const reaching = scores.filter(score => score === rules.targetScore).length
  let formError = SCORE_FORM_ERROR.INCONSISTENT
  if (reaching === 0) {
    formError = SCORE_FORM_ERROR.NO_WINNER
  } else if (reaching > 1) {
    formError = SCORE_FORM_ERROR.SEVERAL_WINNERS
  }
  return { valid: false, fieldErrors, formError, scores }
}
