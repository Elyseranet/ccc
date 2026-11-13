import { describe, expect, it } from 'vitest'
import { API_ERROR_CODE } from '../../../src/enums/api-error-code.enum'
import { MATCH_PURPOSE, MATCH_STATUS } from '../../../src/enums/match.enum'
import { FINAL_STAGE } from '../../../src/enums/participation.enum'
import { ROUND_KIND, ROUND_STATUS } from '../../../src/enums/round.enum'
import type { IMatch } from '../../../src/interfaces/match.interface'
import type { IRound } from '../../../src/interfaces/round.interface'
import type { TClosingInput } from '../../../src/types/edition-closing.type'
import { computeClosingPreview } from '../../../src/utils/edition-closing.util'

const ids = Array.from({ length: 36 }, (_unused, index) => `p${index + 1}`)
const participants = ids.map((participationId) => ({ participationId })) as TClosingInput['participants']

/** `winner` bat `loser` en phase finale (ou en poule avec ROUND_KIND.POOLS). `winner: null` = match non joué. */
const match = (roundKind: ROUND_KIND, winner: string | null, loser: string, extra: Partial<IMatch> = {}): IMatch => ({
  id: `${roundKind}-${loser}`, sequence: 1, roundKind, poolRank: null, purpose: MATCH_PURPOSE.REGULAR, targetScore: 10,
  status: winner === null ? MATCH_STATUS.SCHEDULED : MATCH_STATUS.VALIDATED,
  sides: [winner ?? 'p1', loser].map((participationId) => ({ participationId, competitorId: participationId, displayName: participationId, score: null })),
  winnerParticipationId: winner,
  ...extra
})
const rounds = (...kinds: ROUND_KIND[]): IRound[] =>
  kinds.map((kind, index) => ({ id: kind, kind, sequence: index + 1, status: ROUND_STATUS.COMPLETED, matchCount: 1, validatedMatchCount: 1 }))
const edition = (matches: IMatch[], kinds: ROUND_KIND[]): TClosingInput => ({ participants, rounds: rounds(...kinds), matches })

/** p1 champion, p2 finaliste, p3 et p4 demi-finalistes, p5 à p8 quarts. */
const knockout = [
  match(ROUND_KIND.QUARTER, 'p1', 'p5'), match(ROUND_KIND.QUARTER, 'p2', 'p6'),
  match(ROUND_KIND.QUARTER, 'p3', 'p7'), match(ROUND_KIND.QUARTER, 'p4', 'p8'),
  match(ROUND_KIND.SEMI, 'p1', 'p3'), match(ROUND_KIND.SEMI, 'p2', 'p4'),
  match(ROUND_KIND.FINAL, 'p1', 'p2')
]
const pointsOf = (preview: ReturnType<typeof computeClosingPreview>, id: string) => preview.results.find((result) => result.participationId === id)!

describe('computeClosingPreview (B-14, RG1 à RG3)', () => {
  const preview = computeClosingPreview(edition(knockout, [ROUND_KIND.POOLS, ROUND_KIND.QUARTER, ROUND_KIND.SEMI, ROUND_KIND.FINAL]))

  it('36 participants : le champion reçoit 12,96, N = 36, rien ne bloque', () => {
    expect(preview).toMatchObject({ participantCount: 36, blockedBy: null })
    expect(pointsOf(preview, 'p1')).toEqual({ participationId: 'p1', finalStage: FINAL_STAGE.CHAMPION, points: 12.96 })
  })

  it('chaque stade donne base x 36 / 50, un joueur sans match de phase finale reste éliminé en poule à 0', () => {
    expect(pointsOf(preview, 'p2')).toMatchObject({ finalStage: FINAL_STAGE.FINALIST, points: 9.36 })
    expect(pointsOf(preview, 'p3')).toMatchObject({ finalStage: FINAL_STAGE.SEMI, points: 6.48 })
    expect(pointsOf(preview, 'p4')).toMatchObject({ finalStage: FINAL_STAGE.SEMI, points: 6.48 })
    expect(pointsOf(preview, 'p5')).toMatchObject({ finalStage: FINAL_STAGE.QUARTER, points: 4.32 })
    expect(pointsOf(preview, 'p20')).toMatchObject({ finalStage: FINAL_STAGE.POOL_ELIMINATED, points: 0 })
    expect(preview.results).toHaveLength(36)
  })

  it('huitièmes et barrages : 2,16 et 0,72 (RG3 : seulement quand le tour est disputé)', () => {
    const matches = [match(ROUND_KIND.PLAYOFF, 'p9', 'p10'), match(ROUND_KIND.ROUND_OF_16, 'p5', 'p11'), ...knockout]
    const withRounds = computeClosingPreview(edition(matches, [ROUND_KIND.PLAYOFF, ROUND_KIND.ROUND_OF_16, ROUND_KIND.QUARTER, ROUND_KIND.SEMI, ROUND_KIND.FINAL]))
    expect(pointsOf(withRounds, 'p10')).toMatchObject({ finalStage: FINAL_STAGE.PLAYOFF, points: 0.72 })
    expect(pointsOf(withRounds, 'p11')).toMatchObject({ finalStage: FINAL_STAGE.ROUND_OF_16, points: 2.16 })
    expect(pointsOf(withRounds, 'p5')).toMatchObject({ finalStage: FINAL_STAGE.QUARTER, points: 4.32 })
  })

  it('sans barrages ni huitièmes dans l\'édition, aucun joueur ne reçoit ces stades', () => {
    expect(preview.results.some((result) => [FINAL_STAGE.PLAYOFF, FINAL_STAGE.ROUND_OF_16].includes(result.finalStage))).toBe(false)
  })

  it('bloque avec FINAL_NOT_VALIDATED tant que la finale est absente ou non validée, sans résultat', () => {
    const noFinal = computeClosingPreview(edition(knockout.slice(0, 6), [ROUND_KIND.QUARTER, ROUND_KIND.SEMI]))
    expect(noFinal).toEqual({ participantCount: 36, blockedBy: API_ERROR_CODE.FINAL_NOT_VALIDATED, results: [], playedStages: [] })
    const unplayed = computeClosingPreview(edition([...knockout.slice(0, 6), match(ROUND_KIND.FINAL, null, 'p2')], [ROUND_KIND.FINAL]))
    expect(unplayed.blockedBy).toBe(API_ERROR_CODE.FINAL_NOT_VALIDATED)
  })

  it('ignore les départages et les matchs de poule', () => {
    const noise = [match(ROUND_KIND.POOLS, 'p20', 'p21'), match(ROUND_KIND.POOLS, 'p22', 'p23', { purpose: MATCH_PURPOSE.TIEBREAK })]
    const noisy = computeClosingPreview(edition([...noise, ...knockout], [ROUND_KIND.POOLS, ROUND_KIND.QUARTER, ROUND_KIND.SEMI, ROUND_KIND.FINAL]))
    expect(noisy.results).toEqual(preview.results)
  })

  it('barrages : les perdants sont PLAYOFF, les premiers de poule exemptés (qui entrent en quarts) ne le sont pas', () => {
    const matches = [match(ROUND_KIND.PLAYOFF, 'p9', 'p10'), match(ROUND_KIND.QUARTER, 'p1', 'p9'), ...knockout.filter((candidate) => candidate.id !== 'QUARTER-p5')]
    const withPlayoff = computeClosingPreview(edition(matches, [ROUND_KIND.PLAYOFF, ROUND_KIND.QUARTER, ROUND_KIND.SEMI, ROUND_KIND.FINAL]))
    expect(pointsOf(withPlayoff, 'p10')).toMatchObject({ finalStage: FINAL_STAGE.PLAYOFF, points: 0.72 })
    expect(pointsOf(withPlayoff, 'p9')).toMatchObject({ finalStage: FINAL_STAGE.QUARTER })
    expect(pointsOf(withPlayoff, 'p1')).toMatchObject({ finalStage: FINAL_STAGE.CHAMPION })
  })

  it('édition sans poule : seule la phase finale compte, aucune donnée de poule n\'est lue', () => {
    expect(Object.keys(edition(knockout, [])).sort()).toEqual(['matches', 'participants', 'rounds'])
    expect(computeClosingPreview(edition(knockout, [])).results).toEqual(preview.results)
  })

  it('un départage à 3 côtés est ignoré, sans plantage', () => {
    const threeSides = match(ROUND_KIND.POOLS, 'p20', 'p21', { purpose: MATCH_PURPOSE.TIEBREAK })
    threeSides.sides.push({ participationId: 'p22', competitorId: 'p22', displayName: 'p22', score: 0 })
    const noisy = computeClosingPreview(edition([threeSides, ...knockout], [ROUND_KIND.POOLS, ROUND_KIND.QUARTER, ROUND_KIND.SEMI, ROUND_KIND.FINAL]))
    expect(noisy.results).toEqual(preview.results)
  })
})
