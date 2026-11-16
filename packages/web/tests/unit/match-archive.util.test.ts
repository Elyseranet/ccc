import { describe, expect, it } from 'vitest'
import { MATCH_PURPOSE, MATCH_STATUS } from '../../src/enums/match.enum'
import { ROUND_KIND } from '../../src/enums/round.enum'
import type { IMatch } from '../../src/interfaces/match.interface'
import { isArchivedWinnerWithoutScore } from '../../src/utils/match-archive.util'

/** Quart de finale de 2012a tel que le contrat B-21 le renvoie (exemple du back, toPublicMatch). */
const ARCHIVE_WITHOUT_SCORE: IMatch = {
  id: 'dc478be7-9c99-42f2-8efd-1c7c6f2302f5',
  sequence: 25,
  roundKind: ROUND_KIND.QUARTER,
  poolRank: null,
  purpose: MATCH_PURPOSE.REGULAR,
  targetScore: 10,
  status: MATCH_STATUS.VALIDATED,
  sides: [
    { participationId: 'b7d89914-9b18-4b24-96c8-4dc903b08184', competitorId: '99d948ab-2778-4edd-92f0-1d29557eb319', displayName: 'Simon Vaur', score: null },
    { participationId: '0c9d351e-3b31-462d-bfd9-65c95266b39c', competitorId: 'b2d114c6-9b85-4c77-a89e-42ad2cfeeb54', displayName: 'Kevin Mercurio', score: null }
  ],
  winnerParticipationId: 'b7d89914-9b18-4b24-96c8-4dc903b08184'
}

describe('match d’archive sans score (B-21, F-34)', () => {
  it('un match validé sans aucun score et avec un vainqueur est reconnu', () => {
    expect(isArchivedWinnerWithoutScore(ARCHIVE_WITHOUT_SCORE)).toBe(true)
  })

  it('un match avec score, ou à un seul score, n’est pas reconnu', () => {
    const scored = { ...ARCHIVE_WITHOUT_SCORE, sides: ARCHIVE_WITHOUT_SCORE.sides.map((side, index) => ({ ...side, score: index === 0 ? 10 : 6 })) }
    expect(isArchivedWinnerWithoutScore(scored)).toBe(false)
    expect(isArchivedWinnerWithoutScore({ ...ARCHIVE_WITHOUT_SCORE, sides: [{ ...ARCHIVE_WITHOUT_SCORE.sides[0]!, score: 10 }, ARCHIVE_WITHOUT_SCORE.sides[1]!] })).toBe(false)
  })

  it('un match non validé n’est jamais reconnu, même sans score', () => {
    for (const status of [MATCH_STATUS.SCHEDULED, MATCH_STATUS.RECORDED, MATCH_STATUS.RESULT_UNKNOWN]) {
      expect(isArchivedWinnerWithoutScore({ ...ARCHIVE_WITHOUT_SCORE, status, winnerParticipationId: null })).toBe(false)
    }
  })

  it('sans vainqueur, ou sans le champ du contrat B-21 : faux, aucun effet avant B-21', () => {
    expect(isArchivedWinnerWithoutScore({ ...ARCHIVE_WITHOUT_SCORE, winnerParticipationId: null })).toBe(false)
    const { winnerParticipationId: _omitted, ...withoutField } = ARCHIVE_WITHOUT_SCORE
    expect(isArchivedWinnerWithoutScore(withoutField as unknown as IMatch)).toBe(false)
  })
})
