import { describe, expect, it } from 'vitest'
import { SCORE_ERROR_CODE } from '../../../src/enums/domain.enum'
import { targetScore, validateScore } from '../../../src/server/utils/match/score-rules.util'
import { MATCH_PURPOSE } from '../../../src/enums/match.enum'
import { ROUND_KIND } from '../../../src/enums/round.enum'
import { sheetRows } from './workbook.fixture'

const pool = (...scores: number[]) => validateScore(ROUND_KIND.POOLS, MATCH_PURPOSE.REGULAR, scores)
const final = (...scores: number[]) => validateScore(ROUND_KIND.FINAL, MATCH_PURPOSE.REGULAR, scores)
const triple = (...scores: number[]) => validateScore(ROUND_KIND.POOLS, MATCH_PURPOSE.TIEBREAK, scores)

describe('RG21, RG22 : validation d un score', () => {
  it('poule : 5-4 valide, dans les deux sens', () => {
    expect(pool(5, 4)).toEqual({ valid: true })
    expect(pool(0, 5)).toEqual({ valid: true })
  })

  it.each([
    ['5-5', [5, 5]],
    ['4-3', [4, 3]],
    ['6-2', [6, 2]],
    ['6-5 (le vainqueur dépasse la cible)', [6, 5]],
    ['-1/5', [-1, 5]],
    ['2,5/5', [2.5, 5]],
    ['un seul score', [5]],
    ['trois côtés hors départage', [5, 1, 0]],
  ])('poule : %s refusé (SCORE_INCONSISTENT)', (_label, scores) => {
    const result = pool(...scores)
    expect(result.valid).toBe(false)
    expect(result.code).toBe(SCORE_ERROR_CODE.SCORE_INCONSISTENT)
    expect(result.reason).toBeTruthy()
  })

  it('phase finale : 10-9 valide, 5-3 refusé', () => {
    expect(final(10, 9)).toEqual({ valid: true })
    expect(final(5, 3).valid).toBe(false)
    expect(validateScore(ROUND_KIND.PLAYOFF, MATCH_PURPOSE.REGULAR, [10, 0])).toEqual({ valid: true })
  })

  it('départage à deux : à 5 quel que soit le tour', () => {
    expect(validateScore(ROUND_KIND.FINAL, MATCH_PURPOSE.TIEBREAK, [5, 2])).toEqual({ valid: true })
    expect(validateScore(ROUND_KIND.FINAL, MATCH_PURPOSE.TIEBREAK, [10, 2]).valid).toBe(false)
  })

  it('A11 : départage à trois côtés, premier à 3', () => {
    expect(triple(3, 2, 1)).toEqual({ valid: true })
    expect(triple(0, 0, 3)).toEqual({ valid: true })
    expect(triple(3, 3, 0).valid).toBe(false)
    expect(triple(2, 2, 1).valid).toBe(false)
    expect(triple(4, 1, 0).valid).toBe(false)
  })

  it('R-1 : départage à N côtés (N >= 3), premier à 3', () => {
    expect(triple(3, 2, 1, 0)).toEqual({ valid: true })
    expect(triple(0, 0, 0, 0, 3)).toEqual({ valid: true })
    expect(triple(3, 3, 0, 0).valid).toBe(false)
    expect(triple(2, 2, 1, 0).valid).toBe(false)
    expect(targetScore(ROUND_KIND.POOLS, MATCH_PURPOSE.TIEBREAK, 5)).toBe(3)
    // hors départage, jamais plus de deux côtés
    expect(pool(5, 1, 0, 0).valid).toBe(false)
  })

  it('cible par contexte', () => {
    expect(targetScore(ROUND_KIND.POOLS, MATCH_PURPOSE.REGULAR, 2)).toBe(5)
    expect(targetScore(ROUND_KIND.QUARTER, MATCH_PURPOSE.REGULAR, 2)).toBe(10)
    expect(targetScore(ROUND_KIND.POOLS, MATCH_PURPOSE.TIEBREAK, 3)).toBe(3)
  })

  it('constat du classeur : les 554 scores renseignés sont tous valides', () => {
    const KNOCKOUT_LABELS = new Set(['1/16', 'Huitième', 'Quart', 'Demi', 'Finale'])
    let checked = 0
    for (const { values } of sheetRows('scores')) {
      const [, label, , scoreA, , scoreB] = values
      if (typeof scoreA !== 'number' || typeof scoreB !== 'number') continue
      const kind = KNOCKOUT_LABELS.has(String(label)) ? ROUND_KIND.FINAL : ROUND_KIND.POOLS
      expect(validateScore(kind, MATCH_PURPOSE.REGULAR, [scoreA, scoreB]), `${values[0]}`).toEqual({ valid: true })
      checked += 1
    }
    expect(checked).toBe(554)
  })
})
