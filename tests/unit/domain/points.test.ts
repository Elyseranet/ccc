import { describe, expect, it } from 'vitest'
import { DOMAIN_ERROR_CODE } from '../../../src/enums/domain.enum'
import {
  computeParticipationPoints,
  computeParticipationPointsCents,
} from '../../../src/utils/points.util'
import { DomainRuleError } from '../../../src/utils/domain-rule-error.util'
import { FINAL_STAGE } from '../../../src/enums/participation.enum'

describe('RG1, RG2 : points d une participation', () => {
  it('applique le barème de référence à 50 participants (RG1)', () => {
    expect(computeParticipationPoints(FINAL_STAGE.CHAMPION, 50)).toBe(18)
    expect(computeParticipationPoints(FINAL_STAGE.FINALIST, 50)).toBe(13)
    expect(computeParticipationPoints(FINAL_STAGE.SEMI, 50)).toBe(9)
    expect(computeParticipationPoints(FINAL_STAGE.QUARTER, 50)).toBe(6)
    expect(computeParticipationPoints(FINAL_STAGE.ROUND_OF_16, 50)).toBe(3)
    expect(computeParticipationPoints(FINAL_STAGE.PLAYOFF, 50)).toBe(1)
    expect(computeParticipationPoints(FINAL_STAGE.POOL_ELIMINATED, 50)).toBe(0)
  })

  it('2017, N = 36, champion : 12,96 (cas de la spec)', () => {
    expect(computeParticipationPoints(FINAL_STAGE.CHAMPION, 36)).toBe(12.96)
  })

  it('cas de l onglet Data : 2024 N = 40 barragiste 0,80 ; 2015 N = 25 huitième 1,50', () => {
    expect(computeParticipationPoints(FINAL_STAGE.PLAYOFF, 40)).toBe(0.8)
    expect(computeParticipationPoints(FINAL_STAGE.ROUND_OF_16, 25)).toBe(1.5)
  })

  it('calcule en centièmes entiers, sans flottant', () => {
    expect(computeParticipationPointsCents(FINAL_STAGE.CHAMPION, 36)).toBe(1296)
    expect(Number.isInteger(computeParticipationPointsCents(FINAL_STAGE.QUARTER, 37))).toBe(true)
  })

  it('refuse un effectif invalide', () => {
    for (const participants of [0, -3, 1.5, Number.NaN]) {
      expect(() => computeParticipationPoints(FINAL_STAGE.CHAMPION, participants)).toThrow(
        DomainRuleError,
      )
    }
  })

  it('RG3 : garde-fou, un tour non disputé ne rapporte rien', () => {
    const withoutRoundOf16 = [FINAL_STAGE.CHAMPION, FINAL_STAGE.QUARTER]
    expect(() =>
      computeParticipationPoints(FINAL_STAGE.ROUND_OF_16, 18, withoutRoundOf16),
    ).toThrowError(expect.objectContaining({ code: DOMAIN_ERROR_CODE.STAGE_NOT_PLAYED }))
    expect(computeParticipationPoints(FINAL_STAGE.QUARTER, 18, withoutRoundOf16)).toBe(2.16)
    // l élimination en poule est toujours possible
    expect(computeParticipationPoints(FINAL_STAGE.POOL_ELIMINATED, 18, withoutRoundOf16)).toBe(0)
  })
})
