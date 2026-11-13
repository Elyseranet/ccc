import { describe, expect, it } from 'vitest'
import { QUALIFICATION_BLOCKER, QUALIFICATION_PARAMETER_ERROR, QUALIFICATION_RANK_STATUS, QUALIFICATION_ROUTE, QUALIFICATION_STEP } from '../../src/enums/qualification.enum'
import { MATCH_STATUS } from '../../src/enums/match.enum'
import { POOL_DRAW_STEP_STATE } from '../../src/enums/pool-draw.enum'
import { ApiRequestError } from '../../src/utils/api-request-error.util'
import { API_ERROR_CODE } from '../../src/enums/api-error-code.enum'
import { toQualificationFailure } from '../../src/utils/qualification-failure.util'
import { QUALIFICATION_FAILURE } from '../../src/enums/qualification.enum'
import { blockerOf, boundsOf, checkInputs, initialInputs, pendingRegularCount, previewCount, prerequisitesOf, qualifiedRowsOf, rankTablesOf, stepsOf, tieViewsOf } from '../../src/utils/qualification-view.util'
import { boundaryTie, buildQualificationStatus, member, pairTie, qualifiedEntry, tiebreakMatch } from '../helpers/qualification'

const status = buildQualificationStatus()
const bounds = boundsOf(status)

describe('contrôle des paramètres (RG18, c9790abd (6))', () => {
  it('lit n et m quand ils sont entiers et dans les bornes de l’édition, sans contrôle de puissance de 2', () => {
    expect(bounds).toEqual({ largestPool: 4, poolCount: 2 })
    expect(checkInputs({ topPerPool: '3', bestNextCount: '1', withPlayoff: true }, bounds).parameters).toEqual({ topPerPool: 3, bestNextCount: 1, withPlayoff: true })
  })

  it('refuse un champ vide, non entier, trop bas ou trop haut, avec l’erreur du bon champ, sans rien corriger', () => {
    const check = checkInputs({ topPerPool: '0', bestNextCount: '3', withPlayoff: false }, bounds)
    expect(check.parameters).toBeNull()
    expect(check.topPerPoolError).toBe(QUALIFICATION_PARAMETER_ERROR.TOO_LOW)
    expect(check.bestNextCountError).toBe(QUALIFICATION_PARAMETER_ERROR.TOO_HIGH)
    expect(checkInputs({ topPerPool: '', bestNextCount: '1.5', withPlayoff: false }, bounds)).toMatchObject({
      topPerPoolError: QUALIFICATION_PARAMETER_ERROR.NOT_INTEGER, bestNextCountError: QUALIFICATION_PARAMETER_ERROR.NOT_INTEGER
    })
    expect(checkInputs({ topPerPool: '5', bestNextCount: '0', withPlayoff: false }, bounds).topPerPoolError).toBe(QUALIFICATION_PARAMETER_ERROR.TOO_HIGH)
  })

  it('part de la configuration enregistrée, sinon de 2 premiers et aucun meilleur (n+1)e ; l’aperçu vaut n × poules + m', () => {
    expect(initialInputs(status)).toEqual({ topPerPool: '2', bestNextCount: '0', withPlayoff: false })
    expect(initialInputs(buildQualificationStatus({ parameters: { topPerPool: 1, bestNextCount: 2, withPlayoff: true } }))).toEqual({ topPerPool: '1', bestNextCount: '2', withPlayoff: true })
    expect(previewCount({ topPerPool: 2, bestNextCount: 0 }, 8)).toBe(16)
    expect(previewCount({ topPerPool: 1, bestNextCount: 2 }, 3)).toBe(5)
  })
})

describe('poules à jour', () => {
  it('décompte les matchs validés (2 joués par match) et ceux qui restent, sans compter les départages ouverts', () => {
    const open = buildQualificationStatus({ pendingMatchCount: 4, tiebreakMatches: [tiebreakMatch(MATCH_STATUS.SCHEDULED, ['b', 'c'])] })
    expect(pendingRegularCount(open)).toBe(3)
    expect(prerequisitesOf(open)).toMatchObject({ validated: 12, pending: 3, total: 15, percent: 80 })
    expect(prerequisitesOf(status)).toMatchObject({ validated: 12, pending: 0, percent: 100 })
  })
})

describe('classement provisoire', () => {
  it('marque l’égalité, qualifie selon le rang tant que la liste est vide, sinon selon la liste calculée', () => {
    const tied = buildQualificationStatus({ ties: [pairTie()] })
    const [first] = rankTablesOf(tied, 1)
    expect(first!.rows.map(row => row.status)).toEqual([QUALIFICATION_RANK_STATUS.QUALIFIED, QUALIFICATION_RANK_STATUS.TIE, QUALIFICATION_RANK_STATUS.TIE, QUALIFICATION_RANK_STATUS.ELIMINATED])
    const computed = buildQualificationStatus({ qualified: [qualifiedEntry('a', 'Maya Legrand', 'pool-1', 1), qualifiedEntry('i', 'Paul Dupont', 'pool-2', 2, QUALIFICATION_ROUTE.BEST_NEXT)] })
    const tables = rankTablesOf(computed, 1)
    expect(tables[0]!.rows[0]!.status).toBe(QUALIFICATION_RANK_STATUS.QUALIFIED)
    expect(tables[0]!.rows[1]!.status).toBe(QUALIFICATION_RANK_STATUS.ELIMINATED)
    expect(tables[1]!.rows[1]!.status).toBe(QUALIFICATION_RANK_STATUS.QUALIFIED)
  })

  it('écrit la différence avec son signe', () => {
    expect(rankTablesOf(status, 2)[0]!.rows.map(row => row.difference)).toEqual(['+2', '+1', '0', '-1'])
  })
})

describe('égalités à départager (A11, R-1, R-7)', () => {
  it('rend une carte par égalité, dans l’ordre du serveur, avec le rang de la poule', () => {
    const views = tieViewsOf(buildQualificationStatus({ ties: [pairTie('pool-2'), boundaryTie()] }), false)
    expect(views.map(view => [view.poolRank, view.placeRank, view.members.length, view.slots])).toEqual([[2, 2, 2, 0], [null, 3, 3, 2]])
    expect(views.every(view => view.blocker === null)).toBe(true)
  })

  it('bloque la création tant qu’un match de poule reste (sans compter les départages ouverts), si l’édition est clôturée, ou si le départage du groupe est ouvert', () => {
    const pending = tieViewsOf(buildQualificationStatus({ pendingMatchCount: 2, ties: [pairTie()] }), false)
    expect(pending[0]!.blocker).toBe(QUALIFICATION_BLOCKER.PENDING_MATCHES)
    const open = tieViewsOf(buildQualificationStatus({ pendingMatchCount: 1, ties: [pairTie()], tiebreakMatches: [tiebreakMatch(MATCH_STATUS.SCHEDULED, ['b', 'c'])] }), false)
    expect(open[0]).toMatchObject({ blocker: QUALIFICATION_BLOCKER.TIEBREAK_OPEN, hasOpenTiebreak: true })
    expect(tieViewsOf(buildQualificationStatus({ ties: [pairTie()] }), true)[0]!.blocker).toBe(QUALIFICATION_BLOCKER.CLOSED)
  })

  it('reconnaît le départage suivant : un départage validé contenait plus de joueurs que le groupe restant', () => {
    const rest = { ...boundaryTie(), members: [member('e', 'Paul Girard'), member('f', 'Eva Michel')], slots: 1 }
    const views = tieViewsOf(buildQualificationStatus({ ties: [rest], tiebreakMatches: [tiebreakMatch(MATCH_STATUS.VALIDATED, ['d', 'e', 'f'])] }), false)
    expect(views[0]).toMatchObject({ isFollowUp: true, hasOpenTiebreak: false })
    expect(tieViewsOf(buildQualificationStatus({ ties: [boundaryTie()] }), false)[0]!.isFollowUp).toBe(false)
  })
})

describe('raison d’une action inactive, étapes et aperçu des qualifiés', () => {
  it('dit ce qui manque : clôture, matchs et égalités, matchs seuls, égalités seules', () => {
    expect(blockerOf(0, 0, false)).toBeNull()
    expect(blockerOf(3, 2, false)).toBe(QUALIFICATION_BLOCKER.PENDING_AND_TIES)
    expect(blockerOf(3, 0, false)).toBe(QUALIFICATION_BLOCKER.PENDING_MATCHES)
    expect(blockerOf(0, 2, false)).toBe(QUALIFICATION_BLOCKER.TIES_LEFT)
    expect(blockerOf(0, 0, true)).toBe(QUALIFICATION_BLOCKER.CLOSED)
  })

  it('active la première étape qui n’est pas faite ; liste arrêtée, tout est fait', () => {
    const valid = checkInputs({ topPerPool: '2', bestNextCount: '0', withPlayoff: false }, bounds)
    const states = (value: ReturnType<typeof stepsOf>) => value.map(entry => entry.state)
    expect(states(stepsOf(buildQualificationStatus({ pendingMatchCount: 1 }), valid))[0]).toBe(POOL_DRAW_STEP_STATE.ACTIVE)
    expect(states(stepsOf(buildQualificationStatus({ ties: [pairTie()] }), valid))).toEqual([POOL_DRAW_STEP_STATE.DONE, POOL_DRAW_STEP_STATE.ACTIVE, POOL_DRAW_STEP_STATE.PENDING, POOL_DRAW_STEP_STATE.PENDING])
    expect(stepsOf(status, valid).find(entry => entry.state === POOL_DRAW_STEP_STATE.ACTIVE)!.step).toBe(QUALIFICATION_STEP.FINALIZE)
    expect(states(stepsOf(buildQualificationStatus({ listFinalized: true }), valid)).every(state => state === POOL_DRAW_STEP_STATE.DONE)).toBe(true)
  })

  it('range les qualifiés avec leur voie, « Après départage » pour ceux d’un départage validé', () => {
    const rows = qualifiedRowsOf(buildQualificationStatus({
      qualified: [qualifiedEntry('a', 'Maya Legrand', 'pool-1', 1), qualifiedEntry('b', 'Maya Bonnet', 'pool-1', 2)],
      tiebreakMatches: [tiebreakMatch(MATCH_STATUS.VALIDATED, ['b', 'c'])]
    }))
    expect(rows.map(row => [row.poolRank, row.rank, row.afterTiebreak])).toEqual([[1, 1, false], [1, 2, true]])
    expect(qualifiedRowsOf(buildQualificationStatus({ qualified: null }))).toEqual([])
  })
})

describe('échec d’écriture (B-13)', () => {
  const apiError = (statusCode: number, code: API_ERROR_CODE) => new ApiRequestError({ statusCode, code, message: 'x' })

  it('traduit le code du contrat, puis le statut, puis l’absence de réponse', () => {
    expect(toQualificationFailure(apiError(409, API_ERROR_CODE.QUALIFICATION_NOT_READY))).toBe(QUALIFICATION_FAILURE.NOT_READY)
    expect(toQualificationFailure(apiError(409, API_ERROR_CODE.TIEBREAK_NOT_REQUIRED))).toBe(QUALIFICATION_FAILURE.TIEBREAK_NOT_REQUIRED)
    expect(toQualificationFailure(apiError(409, API_ERROR_CODE.EDITION_CLOSED))).toBe(QUALIFICATION_FAILURE.CLOSED)
    expect(toQualificationFailure(apiError(422, API_ERROR_CODE.UNPROCESSABLE))).toBe(QUALIFICATION_FAILURE.INVALID)
    expect(toQualificationFailure(apiError(403, API_ERROR_CODE.FORBIDDEN))).toBe(QUALIFICATION_FAILURE.FORBIDDEN)
    expect(toQualificationFailure(apiError(500, API_ERROR_CODE.INTERNAL_ERROR))).toBe(QUALIFICATION_FAILURE.UNKNOWN)
    expect(toQualificationFailure(new ApiRequestError({ statusCode: 0, code: API_ERROR_CODE.INTERNAL_ERROR, message: 'x' }, true))).toBe(QUALIFICATION_FAILURE.OFFLINE)
  })
})
