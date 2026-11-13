import { describe, expect, it } from 'vitest'
import { CLOSING_STATE } from '../../src/enums/edition-closing-view.enum'
import { EDITION_STATUS } from '../../src/enums/edition.enum'
import { MATCH_PURPOSE, MATCH_STATUS } from '../../src/enums/match.enum'
import { FINAL_STAGE } from '../../src/enums/participation.enum'
import { ROUND_KIND } from '../../src/enums/round.enum'
import { API_ERROR_CODE } from '../../src/enums/api-error-code.enum'
import type { IMatch } from '../../src/interfaces/match.interface'
import { closingStateOf, finalistsOf, formatClosingMoment, isClosingCodeConfirmed, prerequisitesOf, previewRowsOf } from '../../src/utils/edition-closing-view.util'

const final = (winner: string | null): IMatch => ({
  id: 'f', sequence: 1, roundKind: ROUND_KIND.FINAL, poolRank: null, purpose: MATCH_PURPOSE.REGULAR, targetScore: 10,
  status: winner === null ? MATCH_STATUS.SCHEDULED : MATCH_STATUS.VALIDATED,
  sides: [
    { participationId: 'p1', competitorId: 'c1', displayName: 'Lou', score: null },
    { participationId: 'p2', competitorId: 'c2', displayName: 'Inès', score: null }
  ],
  winnerParticipationId: winner
})

describe('finalistsOf', () => {
  it('champion·ne = vainqueur de la finale, finaliste = l’autre côté', () => {
    expect(finalistsOf([final('p2')])).toEqual({ champion: { id: 'c2', displayName: 'Inès' }, finalist: { id: 'c1', displayName: 'Lou' } })
  })

  it('rien tant que la finale n’a pas de vainqueur, ou n’existe pas', () => {
    expect(finalistsOf([final(null)])).toEqual({ champion: null, finalist: null })
    expect(finalistsOf([])).toEqual({ champion: null, finalist: null })
  })
})

describe('closingStateOf', () => {
  const open = { participantCount: 4, blockedBy: null, results: [], playedStages: [] }
  const blocked = { participantCount: 4, blockedBy: API_ERROR_CODE.FINAL_NOT_VALIDATED as const, results: [], playedStages: [] }

  it('clôturée d’abord, sinon bloquée par la finale, sinon prête', () => {
    expect(closingStateOf(EDITION_STATUS.CLOSED, blocked)).toBe(CLOSING_STATE.CLOSED)
    expect(closingStateOf(EDITION_STATUS.PLAYOFFS, blocked)).toBe(CLOSING_STATE.BLOCKED)
    expect(closingStateOf(EDITION_STATUS.PLAYOFFS, open)).toBe(CLOSING_STATE.READY)
  })

  it('les deux conditions : la finale validée (ce que le serveur exige) et tous les matchs validés (information)', () => {
    const conditions = prerequisitesOf({ matches: [final('p1'), { ...final(null), id: 'g' }] }, open)
    expect(conditions.map(entry => [entry.id, entry.met])).toEqual([['final', true], ['matches', false]])
  })
})

describe('previewRowsOf', () => {
  const results = [
    { participationId: 'a', finalStage: FINAL_STAGE.POOL_ELIMINATED, points: 0 },
    { participationId: 'b', finalStage: FINAL_STAGE.CHAMPION, points: 16.2 },
    { participationId: 'c', finalStage: FINAL_STAGE.SEMI, points: 8.1 }
  ]
  const played = (...stages: FINAL_STAGE[]) => stages

  it('tout le barème, du plus haut au plus bas : les tours disputés portent base × N / 50, les autres « / » (RG3), ici sans barrages ni huitièmes', () => {
    const rows = previewRowsOf({ participantCount: 45, blockedBy: null, results, playedStages: played(FINAL_STAGE.QUARTER, FINAL_STAGE.SEMI, FINAL_STAGE.FINALIST, FINAL_STAGE.CHAMPION) })
    expect(rows.map(row => row.stage)).toEqual([
      FINAL_STAGE.CHAMPION, FINAL_STAGE.FINALIST, FINAL_STAGE.SEMI, FINAL_STAGE.QUARTER, FINAL_STAGE.ROUND_OF_16, FINAL_STAGE.PLAYOFF, FINAL_STAGE.POOL_ELIMINATED
    ])
    expect(rows.map(row => row.points)).toEqual([16.2, 11.7, 8.1, 5.4, null, null, 0])
    expect(rows.find(row => row.stage === FINAL_STAGE.PLAYOFF)).toEqual({ stage: FINAL_STAGE.PLAYOFF, base: 1, points: null })
  })

  it('avec des barrages, la ligne Barragiste porte ses points', () => {
    const rows = previewRowsOf({ participantCount: 45, blockedBy: null, results, playedStages: played(FINAL_STAGE.PLAYOFF, FINAL_STAGE.SEMI, FINAL_STAGE.FINALIST, FINAL_STAGE.CHAMPION) })
    expect(rows.find(row => row.stage === FINAL_STAGE.PLAYOFF)?.points).toBe(0.9)
  })

  it('aucune ligne quand la finale n’est pas validée', () => {
    expect(previewRowsOf({ participantCount: 4, blockedBy: API_ERROR_CODE.FINAL_NOT_VALIDATED, results: [], playedStages: [] })).toEqual([])
  })
})

describe('isClosingCodeConfirmed', () => {
  it('le code de l’édition, espaces autour ignorés', () => {
    expect(isClosingCodeConfirmed('2026', '2026')).toBe(true)
    expect(isClosingCodeConfirmed(' 2026 ', '2026')).toBe(true)
    expect(isClosingCodeConfirmed('2025', '2026')).toBe(false)
    expect(isClosingCodeConfirmed('', '2026')).toBe(false)
  })

  it('la casse compte (2012a ≠ 2012A)', () => {
    expect(isClosingCodeConfirmed('2012A', '2012a')).toBe(false)
  })
})

describe('formatClosingMoment', () => {
  it('le jour sur deux chiffres (jj/mm) et l’heure (hh:mm), comme la maquette', () => {
    const moment = formatClosingMoment('2026-06-16T00:20:00.000Z')
    expect(moment.date).toMatch(/^\d{2}\/\d{2}$/)
    expect(moment.time).toMatch(/^\d{2}:\d{2}$/)
  })
})
