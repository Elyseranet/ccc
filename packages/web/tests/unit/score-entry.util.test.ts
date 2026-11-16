import { describe, expect, it } from 'vitest'
import { MATCH_PURPOSE } from '../../src/enums/match.enum'
import { ROUND_KIND } from '../../src/enums/round.enum'
import { SCORE_FIELD_ERROR, SCORE_FORM_ERROR } from '../../src/enums/score-entry.enum'
import { validateScoreEntry } from '../../src/utils/score-entry.util'

const pool = { roundKind: ROUND_KIND.POOLS, purpose: MATCH_PURPOSE.REGULAR, targetScore: 5 }
const final = { roundKind: ROUND_KIND.FINAL, purpose: MATCH_PURPOSE.REGULAR, targetScore: 10 }

describe('contrôle RG22 avant envoi (F-08)', () => {
  it('en poule, le vainqueur atteint exactement 5', () => {
    expect(validateScoreEntry(pool, ['5', '1'])).toMatchObject({ valid: true, scores: [5, 1], formError: null })
    expect(validateScoreEntry(pool, ['0', '5']).valid).toBe(true)
    expect(validateScoreEntry(pool, ['5', '4']).valid).toBe(true)
  })

  it('en poule, aucun vainqueur : refusé avant envoi', () => {
    expect(validateScoreEntry(pool, ['3', '2'])).toMatchObject({ valid: false, formError: SCORE_FORM_ERROR.NO_WINNER })
    expect(validateScoreEntry(pool, ['4', '4']).formError).toBe(SCORE_FORM_ERROR.NO_WINNER)
  })

  it('en poule, deux joueurs à 5 : refusé', () => {
    expect(validateScoreEntry(pool, ['5', '5'])).toMatchObject({ valid: false, formError: SCORE_FORM_ERROR.SEVERAL_WINNERS })
  })

  it('en poule, un score au-dessus de la cible est refusé champ par champ', () => {
    expect(validateScoreEntry(pool, ['6', '1'])).toMatchObject({ valid: false, fieldErrors: [SCORE_FIELD_ERROR.ABOVE_TARGET, null] })
    expect(validateScoreEntry(pool, ['10', '1']).valid).toBe(false)
  })

  it('en phase finale, la cible est 10 : 10-7 passe, 5-1 est refusé', () => {
    expect(validateScoreEntry(final, ['10', '7'])).toMatchObject({ valid: true, scores: [10, 7] })
    expect(validateScoreEntry(final, ['5', '1'])).toMatchObject({ valid: false, formError: SCORE_FORM_ERROR.NO_WINNER })
    expect(validateScoreEntry(final, ['10', '10']).formError).toBe(SCORE_FORM_ERROR.SEVERAL_WINNERS)
    expect(validateScoreEntry(final, ['11', '2']).fieldErrors[0]).toBe(SCORE_FIELD_ERROR.ABOVE_TARGET)
  })

  it('un champ vide, négatif, décimal ou non numérique est une erreur de champ, sans score lu', () => {
    expect(validateScoreEntry(pool, ['', '1'])).toMatchObject({ valid: false, fieldErrors: [SCORE_FIELD_ERROR.MISSING, null], scores: [] })
    expect(validateScoreEntry(pool, ['-1', '5']).fieldErrors[0]).toBe(SCORE_FIELD_ERROR.NOT_INTEGER)
    expect(validateScoreEntry(pool, ['2.5', '5']).fieldErrors[0]).toBe(SCORE_FIELD_ERROR.NOT_INTEGER)
    expect(validateScoreEntry(pool, ['abc', '5']).fieldErrors[0]).toBe(SCORE_FIELD_ERROR.NOT_INTEGER)
    expect(validateScoreEntry(pool, [' 5 ', '1']).valid).toBe(true)
  })

  it('un départage à trois côtés a pour cible 3', () => {
    const tiebreak = { roundKind: ROUND_KIND.POOLS, purpose: MATCH_PURPOSE.TIEBREAK, targetScore: 3 }
    expect(validateScoreEntry(tiebreak, ['3', '1', '0']).valid).toBe(true)
    expect(validateScoreEntry(tiebreak, ['2', '1', '0']).formError).toBe(SCORE_FORM_ERROR.NO_WINNER)
  })
})
