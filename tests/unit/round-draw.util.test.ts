import { describe, expect, it } from 'vitest'
import { API_ERROR_CODE } from '../../src/enums/api-error-code.enum'
import { POOL_DRAW_SAVE_STATE, POOL_DRAW_STEP_STATE } from '../../src/enums/pool-draw.enum'
import { ROUND_DRAW_BLOCKER, ROUND_DRAW_MENTION, ROUND_DRAW_VIEW } from '../../src/enums/round-draw.enum'
import { ROUND_KIND, ROUND_STATUS } from '../../src/enums/round.enum'
import { ApiRequestError } from '../../src/utils/api-request-error.util'
import {
  buildEmptyPairings,
  buildPairingsFromDraft,
  buildRoundAssignments,
  clearPairing,
  currentPairingIndex,
  currentRoundKind,
  defaultRoundKind,
  drawablePlayers,
  isRoundDrawComplete,
  leaderIdsOf,
  pairingTotal,
  placePlayer,
  recapRows,
  roundDrawProgress,
  roundSteps,
  toRoundDrawError,
  toRoundPlayers,
  unplacedPlayers,
  validationBlocker,
  viewOf
} from '../../src/utils/round-draw.util'
import { blocked, candidates, draftOf, preview, round } from '../helpers/round-draw'
import { standingRow } from '../helpers/qualification'

const players = toRoundPlayers(candidates(8), new Set(['part-p1', 'part-p2']))
const place = (pairings: ReturnType<typeof buildEmptyPairings>, ...ids: string[]) => ids.reduce((current, id) => placePlayer(current, currentPairingIndex(current) ?? 0, `part-${id}`), pairings)

describe('affiches saisies une à une (c9790abd (5))', () => {
  it('l’affiche en cours est la première incomplète ; les côtés se remplissent 1 puis 2 ; l’ordre du tirage suit la saisie', () => {
    const start = buildEmptyPairings(4)
    expect(currentPairingIndex(start)).toBe(1)
    const one = place(start, 'p3')
    expect(one[0]).toMatchObject({ first: { participationId: 'part-p3', order: 1 }, second: null })
    const two = place(one, 'p5', 'p4')
    expect(two[0]!.second).toEqual({ participationId: 'part-p5', order: 2 })
    expect(two[1]!.first).toEqual({ participationId: 'part-p4', order: 3 })
    expect(currentPairingIndex(two)).toBe(2)
  })

  it('refuse un joueur déjà placé, une affiche pleine ou inconnue', () => {
    const two = place(buildEmptyPairings(2), 'p1', 'p2')
    expect(placePlayer(two, 1, 'part-p3')).toBe(two)
    expect(placePlayer(two, 2, 'part-p1')).toBe(two)
    expect(placePlayer(two, 9, 'part-p3')).toBe(two)
  })

  it('« Changer » vide l’affiche : elle redevient l’affiche en cours et ses joueurs reviennent dans « À placer »', () => {
    const three = place(buildEmptyPairings(3), 'p1', 'p2', 'p3', 'p4')
    const cleared = clearPairing(three, 1)
    expect(currentPairingIndex(cleared)).toBe(1)
    expect(unplacedPlayers(players, cleared).map(player => player.participationId)).toEqual(expect.arrayContaining(['part-p1', 'part-p2']))
    expect(unplacedPlayers(players, three).map(player => player.participationId)).not.toContain('part-p1')
  })

  it('le corps du PUT renumérote l’ordre de 1 à N dans l’ordre de saisie, et garde l’affiche et le côté', () => {
    const three = place(buildEmptyPairings(3), 'p1', 'p2', 'p3', 'p4')
    const after = placePlayer(clearPairing(three, 1), 1, 'part-p6')
    expect(buildRoundAssignments(after)).toEqual([
      { participationId: 'part-p3', pairingIndex: 2, sidePosition: 1, drawnOrder: 1 },
      { participationId: 'part-p4', pairingIndex: 2, sidePosition: 2, drawnOrder: 2 },
      { participationId: 'part-p6', pairingIndex: 1, sidePosition: 1, drawnOrder: 3 }
    ])
  })

  it('reprend un brouillon du serveur : affiche, côté et ordre de chaque affectation', () => {
    const pairings = buildPairingsFromDraft(draftOf([['p2', 1, 1, 1], ['p5', 1, 2, 2], ['p1', 2, 1, 3]]), 4)
    expect(pairings[0]).toMatchObject({ first: { participationId: 'part-p2', order: 1 }, second: { participationId: 'part-p5', order: 2 } })
    expect(pairings[1]).toMatchObject({ first: { participationId: 'part-p1', order: 3 }, second: null })
    expect(pairings).toHaveLength(4)
  })

  it('progression et récapitulatif : affiches complètes, joueurs restants, lignes dans l’ordre des affiches', () => {
    const two = place(buildEmptyPairings(4), 'p1', 'p2', 'p3')
    expect(roundDrawProgress(two, 8)).toEqual({ pairings: 1, total: 4, placed: 3, remaining: 5, percent: 25 })
    expect(recapRows(two, players).map(row => [row.number, row.first.displayName, row.second.displayName])).toEqual([[1, 'Joueur 01', 'Joueur 02']])
  })
})

describe('validation du tirage', () => {
  const full = place(buildEmptyPairings(2), 'p1', 'p2', 'p3', 'p4')

  it('hors barrages, tout le vivier doit être tiré : aucune affiche vide ni incomplète', () => {
    expect(isRoundDrawComplete(full, ROUND_KIND.SEMI)).toBe(true)
    expect(isRoundDrawComplete(place(buildEmptyPairings(2), 'p1', 'p2'), ROUND_KIND.SEMI)).toBe(false)
    expect(validationBlocker(place(buildEmptyPairings(2), 'p1', 'p2'), ROUND_KIND.SEMI, POOL_DRAW_SAVE_STATE.SAVED)).toBe(ROUND_DRAW_BLOCKER.PAIRINGS_LEFT)
    expect(validationBlocker(buildEmptyPairings(2), ROUND_KIND.SEMI, POOL_DRAW_SAVE_STATE.IDLE)).toBe(ROUND_DRAW_BLOCKER.NOTHING_PLACED)
    expect(validationBlocker(full, ROUND_KIND.SEMI, POOL_DRAW_SAVE_STATE.SAVED)).toBeNull()
  })

  it('barrages : les affiches vides à la fin sont ignorées, une affiche entamée bloque, il en faut au moins une', () => {
    expect(isRoundDrawComplete(place(buildEmptyPairings(4), 'p3', 'p4'), ROUND_KIND.PLAYOFF)).toBe(true)
    expect(isRoundDrawComplete(place(buildEmptyPairings(4), 'p3', 'p4', 'p5'), ROUND_KIND.PLAYOFF)).toBe(false)
    expect(isRoundDrawComplete(buildEmptyPairings(4), ROUND_KIND.PLAYOFF)).toBe(false)
  })

  it('un enregistrement en cours ou échoué bloque, avec sa raison', () => {
    expect(validationBlocker(full, ROUND_KIND.SEMI, POOL_DRAW_SAVE_STATE.SAVING)).toBe(ROUND_DRAW_BLOCKER.SAVING)
    expect(validationBlocker(full, ROUND_KIND.SEMI, POOL_DRAW_SAVE_STATE.FAILED)).toBe(ROUND_DRAW_BLOCKER.SAVE_FAILED)
  })
})

describe('barrages (RG14, PLAYOFF-DRAW)', () => {
  it('les premiers de poule (rang 1) ne sont pas tirables ; la moitié des joueurs tirables donne le nombre d’affiches proposé', () => {
    const leaders = leaderIdsOf([{ id: 'x', rank: 1, standing: [standingRow('p1', 'A', 1, 3), standingRow('p2', 'B', 2, 1)] }])
    expect([...leaders]).toEqual(['part-p1'])
    const all = toRoundPlayers(candidates(7), leaders)
    expect(drawablePlayers(all, ROUND_KIND.PLAYOFF)).toHaveLength(6)
    expect(drawablePlayers(all, ROUND_KIND.QUARTER)).toHaveLength(7)
    expect(pairingTotal(6)).toBe(3)
    expect(pairingTotal(5)).toBe(2)
  })
})

describe('vue de la page selon le serveur', () => {
  const draw = (status: 'DRAFT' | 'VALIDATED') => draftOf([], { status: status as never })

  it('liste non arrêtée, tour précédent inachevé, vivier à choisir, tour déduit, rien de tirable, phase finale jouée', () => {
    expect(viewOf(preview(8, blocked(API_ERROR_CODE.QUALIFICATION_NOT_DONE)), null, [])).toBe(ROUND_DRAW_VIEW.QUALIFICATION_PENDING)
    expect(viewOf(preview(8, blocked(API_ERROR_CODE.ROUND_NOT_COMPLETED)), null, [round(ROUND_KIND.QUARTER, ROUND_STATUS.PLAYING)])).toBe(ROUND_DRAW_VIEW.PREVIOUS_INCOMPLETE)
    expect(viewOf(preview(8, blocked(API_ERROR_CODE.ROUND_NOT_COMPLETED)), draw('VALIDATED'), [round(ROUND_KIND.QUARTER, ROUND_STATUS.DRAWN)])).toBe(ROUND_DRAW_VIEW.DRAWN)
    expect(viewOf(preview(12), null, [])).toBe(ROUND_DRAW_VIEW.CHOICE)
    expect(viewOf(preview(16), null, [])).toBe(ROUND_DRAW_VIEW.ENTRY)
    expect(viewOf(preview(15, { allowedRoundKinds: [], roundKind: null }), null, [])).toBe(ROUND_DRAW_VIEW.UNDRAWABLE)
    expect(viewOf(preview(2, { allowedRoundKinds: [], roundKind: null }), null, [round(ROUND_KIND.FINAL, ROUND_STATUS.COMPLETED)])).toBe(ROUND_DRAW_VIEW.FINISHED)
    expect(viewOf(preview(2, { allowedRoundKinds: [], roundKind: null }), null, [round(ROUND_KIND.FINAL, ROUND_STATUS.PLAYING)])).toBe(ROUND_DRAW_VIEW.DRAWN)
  })

  it('un brouillon rouvre la saisie, avec son tour (celui choisi), même si l’aperçu n’en déduit pas', () => {
    const open = draftOf([], { roundKind: ROUND_KIND.SEMI })
    expect(viewOf(preview(12), open, [])).toBe(ROUND_DRAW_VIEW.ENTRY)
    expect(currentRoundKind(preview(12), open)).toBe(ROUND_KIND.SEMI)
    expect(currentRoundKind(preview(16), null)).toBe(ROUND_KIND.ROUND_OF_16)
  })
})

describe('tour proposé d’office', () => {
  it('le premier tour qui n’est pas les barrages (maquette : quarts cochés), sinon le premier', () => {
    expect(defaultRoundKind([ROUND_KIND.PLAYOFF, ROUND_KIND.QUARTER, ROUND_KIND.SEMI])).toBe(ROUND_KIND.QUARTER)
    expect(defaultRoundKind([ROUND_KIND.PLAYOFF])).toBe(ROUND_KIND.PLAYOFF)
    expect(defaultRoundKind([])).toBeNull()
  })
})

describe('stepper des tours (RG13 : aucune affiche d’avance)', () => {
  it('tours tirés, tour à tirer, puis les suivants jusqu’à la finale ; sans barrage ni prévu, il n’apparaît pas', () => {
    const steps = roundSteps([round(ROUND_KIND.PLAYOFF, ROUND_STATUS.COMPLETED)], ROUND_KIND.ROUND_OF_16)
    expect(steps.map(step => [step.kind, step.state, step.mention])).toEqual([
      [ROUND_KIND.PLAYOFF, POOL_DRAW_STEP_STATE.DONE, ROUND_DRAW_MENTION.NONE],
      [ROUND_KIND.ROUND_OF_16, POOL_DRAW_STEP_STATE.ACTIVE, ROUND_DRAW_MENTION.TO_DRAW],
      [ROUND_KIND.QUARTER, POOL_DRAW_STEP_STATE.PENDING, ROUND_DRAW_MENTION.NONE],
      [ROUND_KIND.SEMI, POOL_DRAW_STEP_STATE.PENDING, ROUND_DRAW_MENTION.NONE],
      [ROUND_KIND.FINAL, POOL_DRAW_STEP_STATE.PENDING, ROUND_DRAW_MENTION.NONE]
    ])
    expect(roundSteps([], ROUND_KIND.QUARTER).map(step => step.kind)).toEqual([ROUND_KIND.QUARTER, ROUND_KIND.SEMI, ROUND_KIND.FINAL])
    expect(roundSteps([round(ROUND_KIND.QUARTER, ROUND_STATUS.PLAYING)], null).find(step => step.kind === ROUND_KIND.QUARTER)).toMatchObject({ state: POOL_DRAW_STEP_STATE.ACTIVE, mention: ROUND_DRAW_MENTION.IN_PROGRESS })
    expect(roundSteps([], null)).toEqual([])
  })
})

describe('refus du serveur', () => {
  const error = (code: API_ERROR_CODE, offline = false) => new ApiRequestError({ statusCode: offline ? 0 : 409, code, message: 'x' }, offline)

  it('traduit par code, avec les refus du tour, puis l’absence de réponse et l’inconnu', () => {
    expect(toRoundDrawError(error(API_ERROR_CODE.ROUND_NOT_COMPLETED)).key).toBe('admin.round_draw.errors.round_not_completed')
    expect(toRoundDrawError(error(API_ERROR_CODE.DRAW_INCOMPLETE)).key).toBe('admin.round_draw.errors.draw_incomplete')
    expect(toRoundDrawError(error(API_ERROR_CODE.FORBIDDEN)).key).toBe('admin.draws.errors.forbidden')
    expect(toRoundDrawError(error(API_ERROR_CODE.INTERNAL_ERROR, true)).key).toBe('admin.draws.errors.offline')
    expect(toRoundDrawError(new Error('x')).key).toBe('admin.draws.errors.unknown')
  })
})
