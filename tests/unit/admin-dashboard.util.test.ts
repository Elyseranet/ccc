import { describe, expect, it } from 'vitest'
import { ADMIN_ACTIVITY_KIND, ADMIN_ACTIVITY_TARGET } from '../../src/enums/admin-activity.enum.js'
import { ADMIN_DASHBOARD_ERROR, ADMIN_DASHBOARD_STEP, ADMIN_DASHBOARD_STEP_STATUS, ADMIN_DASHBOARD_TODO } from '../../src/enums/admin-dashboard.enum.js'
import { API_ERROR_CODE } from '../../src/enums/api-error-code.enum.js'
import { DRAW_KIND, DRAW_STATUS } from '../../src/enums/draw.enum.js'
import { EDITION_STATUS } from '../../src/enums/edition.enum.js'
import { MATCH_PURPOSE, MATCH_STATUS } from '../../src/enums/match.enum.js'
import { ROUND_KIND, ROUND_STATUS } from '../../src/enums/round.enum.js'
import type { IAdminActivityItem } from '../../src/interfaces/admin-activity.interface.js'
import type { IAdminMatch } from '../../src/interfaces/admin-match.interface.js'
import type { IAdminDashboardData } from '../../src/interfaces/admin-dashboard.interface.js'
import type { IAdminDraw } from '../../src/interfaces/draw.interface.js'
import type { IRound } from '../../src/interfaces/round.interface.js'
import type { TTranslate } from '../../src/types/translate.type.js'
import { ADMIN_MATCH_FILTER_QUERY_PARAM } from '../../src/consts/admin-match-filters.const.js'
import { ADMIN_MATCH_FILTER } from '../../src/enums/admin-match-filter.enum.js'
import {
  buildActivityRows, buildDashboardView, buildStepItems, stepRoute, buildTodoItems, classifyError, computeCounters, recordedQueueLink,
  resolveActiveStep, resolveStepStatus
} from '../../src/utils/admin-dashboard.util.js'

const t: TTranslate = (_key, fallback, params = {}) =>
  Object.entries(params).reduce((message, [name, value]) => message.replaceAll(`{${name}}`, String(value)), fallback)

const round = (kind: ROUND_KIND, sequence: number, status: ROUND_STATUS, matchCount = 4, validatedMatchCount = 0): IRound =>
  ({ id: `r${sequence}`, kind, sequence, status, matchCount, validatedMatchCount })
const pools = (validated: number, total = 105) => round(ROUND_KIND.POOLS, 1, ROUND_STATUS.PLAYING, total, validated)
const completed = (kind: ROUND_KIND, sequence: number) => round(kind, sequence, ROUND_STATUS.COMPLETED, 4, 4)

describe('étape active du centre de contrôle (table du ticket F-07)', () => {
  it('CREATED : l’étape 2 (participants) est active, la 1 est faite', () => {
    expect(resolveActiveStep(EDITION_STATUS.CREATED, [])).toBe(ADMIN_DASHBOARD_STEP.PARTICIPANTS)
    expect(resolveStepStatus(ADMIN_DASHBOARD_STEP.CREATION, ADMIN_DASHBOARD_STEP.PARTICIPANTS)).toBe(ADMIN_DASHBOARD_STEP_STATUS.DONE)
  })

  it('REGISTRATION : l’étape 2', () => {
    expect(resolveActiveStep(EDITION_STATUS.REGISTRATION, [])).toBe(ADMIN_DASHBOARD_STEP.PARTICIPANTS)
  })

  it('POOLS_DRAWN : l’étape 4', () => {
    expect(resolveActiveStep(EDITION_STATUS.POOLS_DRAWN, [pools(0)])).toBe(ADMIN_DASHBOARD_STEP.POOL_MATCHES)
  })

  it('POOLS_PLAYING : l’étape 4 tant qu’un match de poule n’est pas validé', () => {
    expect(resolveActiveStep(EDITION_STATUS.POOLS_PLAYING, [pools(68)])).toBe(ADMIN_DASHBOARD_STEP.POOL_MATCHES)
  })

  it('POOLS_PLAYING : l’étape 5 quand tous les matchs de poule sont validés', () => {
    expect(resolveActiveStep(EDITION_STATUS.POOLS_PLAYING, [pools(105)])).toBe(ADMIN_DASHBOARD_STEP.QUALIFIED_VALIDATION)
  })

  it('POOLS_PLAYING : sans tour de poules lisible, l’étape 4 (jamais 5 par défaut)', () => {
    expect(resolveActiveStep(EDITION_STATUS.POOLS_PLAYING, [])).toBe(ADMIN_DASHBOARD_STEP.POOL_MATCHES)
    expect(resolveActiveStep(EDITION_STATUS.POOLS_PLAYING, [pools(0, 0)])).toBe(ADMIN_DASHBOARD_STEP.POOL_MATCHES)
  })

  it('QUALIFIED : l’étape 6', () => {
    expect(resolveActiveStep(EDITION_STATUS.QUALIFIED, [pools(105)])).toBe(ADMIN_DASHBOARD_STEP.BRACKET_DRAW)
  })

  it('PLAYOFFS : 6 si le premier tour non terminé est PENDING', () => {
    const rounds = [completed(ROUND_KIND.POOLS, 1), round(ROUND_KIND.ROUND_OF_16, 2, ROUND_STATUS.PENDING)]
    expect(resolveActiveStep(EDITION_STATUS.PLAYOFFS, rounds)).toBe(ADMIN_DASHBOARD_STEP.BRACKET_DRAW)
  })

  it('PLAYOFFS : 7 si le premier tour non terminé est DRAWN ou PLAYING', () => {
    const drawn = [completed(ROUND_KIND.POOLS, 1), round(ROUND_KIND.ROUND_OF_16, 2, ROUND_STATUS.DRAWN)]
    const playing = [completed(ROUND_KIND.POOLS, 1), round(ROUND_KIND.ROUND_OF_16, 2, ROUND_STATUS.PLAYING)]
    expect(resolveActiveStep(EDITION_STATUS.PLAYOFFS, drawn)).toBe(ADMIN_DASHBOARD_STEP.BRACKET_MATCHES)
    expect(resolveActiveStep(EDITION_STATUS.PLAYOFFS, playing)).toBe(ADMIN_DASHBOARD_STEP.BRACKET_MATCHES)
  })

  it('PLAYOFFS : 8 si c’est la finale, en DRAWN ou PLAYING', () => {
    const base = [completed(ROUND_KIND.POOLS, 1), completed(ROUND_KIND.ROUND_OF_16, 2), completed(ROUND_KIND.QUARTER, 3), completed(ROUND_KIND.SEMI, 4)]
    expect(resolveActiveStep(EDITION_STATUS.PLAYOFFS, [...base, round(ROUND_KIND.FINAL, 5, ROUND_STATUS.DRAWN)])).toBe(ADMIN_DASHBOARD_STEP.FINAL)
    expect(resolveActiveStep(EDITION_STATUS.PLAYOFFS, [...base, round(ROUND_KIND.FINAL, 5, ROUND_STATUS.PLAYING)])).toBe(ADMIN_DASHBOARD_STEP.FINAL)
  })

  it('PLAYOFFS : 9 si la finale est terminée et l’édition non clôturée', () => {
    const rounds = [completed(ROUND_KIND.POOLS, 1), completed(ROUND_KIND.SEMI, 2), completed(ROUND_KIND.FINAL, 3)]
    expect(resolveActiveStep(EDITION_STATUS.PLAYOFFS, rounds)).toBe(ADMIN_DASHBOARD_STEP.CLOSING)
  })

  it('CLOSED : aucune étape active, toutes les étapes sont faites', () => {
    expect(resolveActiveStep(EDITION_STATUS.CLOSED, [])).toBeNull()
    for (const step of Object.values(ADMIN_DASHBOARD_STEP).filter(value => typeof value === 'number') as ADMIN_DASHBOARD_STEP[]) {
      expect(resolveStepStatus(step, null)).toBe(ADMIN_DASHBOARD_STEP_STATUS.DONE)
    }
  })

  it('une étape active est « active », les suivantes « pending »', () => {
    expect(resolveStepStatus(ADMIN_DASHBOARD_STEP.POOL_MATCHES, ADMIN_DASHBOARD_STEP.POOL_MATCHES)).toBe(ADMIN_DASHBOARD_STEP_STATUS.ACTIVE)
    expect(resolveStepStatus(ADMIN_DASHBOARD_STEP.FINAL, ADMIN_DASHBOARD_STEP.POOL_MATCHES)).toBe(ADMIN_DASHBOARD_STEP_STATUS.PENDING)
  })
})

const side = (id: string, score: number | null, recorded: number | null = null) =>
  ({ participationId: id, competitorId: `c-${id}`, displayName: `Joueur ${id}`, score, recordedScore: recorded })
const adminMatch = (id: string, status: MATCH_STATUS, roundKind = ROUND_KIND.POOLS): IAdminMatch => ({
  id, sequence: 1, roundKind, poolRank: 1, purpose: MATCH_PURPOSE.REGULAR, targetScore: 5, status,
  sides: [side('a', null), side('b', null)], winnerParticipationId: null, comment: null, version: 1, recordedAt: null, validatedAt: null, validatedBy: null
})
const adminDraw = (status: DRAW_STATUS, kind = DRAW_KIND.POOLS): IAdminDraw => ({
  id: `d-${status}`, kind, roundKind: null, status, parameters: { poolCount: 8, seedCount: 8 }, createdAt: '2026-11-01T10:00:00Z',
  validatedAt: null, assignments: [], createdBy: null, validatedBy: null
})
const data = (overrides: Partial<IAdminDashboardData> & { status?: EDITION_STATUS, rounds?: IRound[] } = {}): IAdminDashboardData => ({
  edition: {
    id: 'e1', code: '2026-1', year: 2026, status: overrides.status ?? EDITION_STATUS.POOLS_PLAYING, rounds: overrides.rounds ?? [pools(68)],
    participants: Array.from({ length: 45 }), pools: Array.from({ length: 8 })
  } as unknown as IAdminDashboardData['edition'],
  adminMatches: overrides.adminMatches ?? [],
  draws: overrides.draws ?? []
})

describe('compteurs du tableau de bord', () => {
  it('compte les saisis (toutes phases), les sans-score de poule et les brouillons de tirage', () => {
    const counters = computeCounters(data({
      adminMatches: [
        adminMatch('1', MATCH_STATUS.RECORDED), adminMatch('2', MATCH_STATUS.RECORDED, ROUND_KIND.QUARTER),
        adminMatch('3', MATCH_STATUS.SCHEDULED), adminMatch('4', MATCH_STATUS.SCHEDULED, ROUND_KIND.QUARTER),
        adminMatch('5', MATCH_STATUS.VALIDATED), adminMatch('6', MATCH_STATUS.RESULT_UNKNOWN)
      ],
      draws: [adminDraw(DRAW_STATUS.DRAFT), adminDraw(DRAW_STATUS.VALIDATED)]
    }))
    expect(counters).toEqual({ poolMatchCount: 105, poolValidatedCount: 68, recordedCount: 2, scheduledCount: 1, pendingDrawCount: 1 })
  })

  it('sans tour de poules, les compteurs de poule valent 0', () => {
    expect(computeCounters(data({ rounds: [] }))).toMatchObject({ poolMatchCount: 0, poolValidatedCount: 0 })
  })
})

describe('étapes, cartes et vue', () => {
  it('produit neuf étapes avec le sous-titre de l’étape 4 tiré des compteurs', () => {
    const source = data({ adminMatches: [adminMatch('1', MATCH_STATUS.RECORDED), adminMatch('2', MATCH_STATUS.SCHEDULED)] })
    const steps = buildStepItems(source, computeCounters(source), ADMIN_DASHBOARD_STEP.POOL_MATCHES, t)
    expect(steps).toHaveLength(9)
    expect(steps[3]).toMatchObject({ title: 'Matchs de poules', status: ADMIN_DASHBOARD_STEP_STATUS.ACTIVE, subtitle: 'En cours · 68 / 105 validés · 1 saisis · 1 sans score' })
    expect(steps[0]).toMatchObject({ status: ADMIN_DASHBOARD_STEP_STATUS.DONE, subtitle: 'Fait' })
    expect(steps[1]).toMatchObject({ status: ADMIN_DASHBOARD_STEP_STATUS.DONE, subtitle: 'Fait · 45 participants inscrits' })
    expect(steps[8]).toMatchObject({ status: ADMIN_DASHBOARD_STEP_STATUS.PENDING, subtitle: 'À venir · calcul du barème et des classements' })
  })

  it('chaque étape mène à sa page (table F39-STEPS) : la création à la fiche de l’édition active, les matchs de poules au tour POOLS, la finale au tour FINAL, la clôture sans page', () => {
    const source = data()
    const steps = buildStepItems(source, computeCounters(source), ADMIN_DASHBOARD_STEP.POOL_MATCHES, t)
    expect(steps.map(step => step.to)).toEqual([
      '/admin/editions/2026-1', '/admin/participants', '/admin/tirages', '/admin/matchs?tour=POOLS', '/admin/phase-finale/qualification',
      '/admin/phase-finale/tirage', '/admin/matchs', '/admin/matchs?tour=FINAL', '/admin/phase-finale/cloture'
    ])
    expect(stepRoute(ADMIN_DASHBOARD_STEP.CREATION, 'a b/c')).toBe('/admin/editions/a%20b%2Fc')
  })

  it('le tirage des poules est « brouillon » tant que l’édition est en inscription et que le tirage n’est pas validé', () => {
    const source = data({ status: EDITION_STATUS.REGISTRATION, draws: [adminDraw(DRAW_STATUS.DRAFT)], rounds: [] })
    const steps = buildStepItems(source, computeCounters(source), ADMIN_DASHBOARD_STEP.PARTICIPANTS, t)
    expect(steps[2]!.subtitle).toBe('À venir · 8 poules · brouillon')
  })

  it('trois cartes ; la carte « saisis » est chaude et pointe la file filtrée de F-08, celle du tirage est inerte sans brouillon', () => {
    const todo = buildTodoItems({ poolMatchCount: 105, poolValidatedCount: 68, recordedCount: 7, scheduledCount: 30, pendingDrawCount: 0 }, EDITION_STATUS.POOLS_PLAYING, t)
    expect(todo.map(item => item.id)).toEqual([ADMIN_DASHBOARD_TODO.RECORDED, ADMIN_DASHBOARD_TODO.SCHEDULED, ADMIN_DASHBOARD_TODO.DRAWS])
    expect(todo[0]).toMatchObject({ count: 7, hot: true, to: `/admin/matchs?${ADMIN_MATCH_FILTER_QUERY_PARAM}=${ADMIN_MATCH_FILTER.RECORDED}` })
    expect(todo[0]!.to).toBe(recordedQueueLink())
    expect(todo[1]).toMatchObject({ count: 30, hot: false, to: '/admin/matchs' })
    expect(todo[2]).toMatchObject({ count: 0, to: null })
  })

  it('une carte « saisis » à zéro n’est pas chaude, un brouillon de tirage devient un lien', () => {
    const todo = buildTodoItems({ poolMatchCount: 0, poolValidatedCount: 0, recordedCount: 0, scheduledCount: 0, pendingDrawCount: 1 }, EDITION_STATUS.QUALIFIED, t)
    expect(todo[0]!.hot).toBe(false)
    expect(todo[2]!.to).toBe('/admin/tirages')
  })

  it('une édition clôturée est en lecture seule : le bouton de validation est inactif et toutes les étapes sont faites', () => {
    const view = buildDashboardView(data({ status: EDITION_STATUS.CLOSED, adminMatches: [adminMatch('1', MATCH_STATUS.RECORDED)] }), t)
    expect(view.readOnly).toBe(true)
    expect(view.canValidate).toBe(false)
    expect(view.progress).toBe('Édition clôturée')
    expect(view.steps.every(step => step.status === ADMIN_DASHBOARD_STEP_STATUS.DONE)).toBe(true)
  })

  it('en cours, le bouton de validation est actif s’il y a un score saisi, et la progression dit « Étape 4 sur 9 »', () => {
    const view = buildDashboardView(data({ adminMatches: [adminMatch('1', MATCH_STATUS.RECORDED)] }), t)
    expect(view).toMatchObject({ year: 2026, readOnly: false, canValidate: true, recordedCount: 1, progress: 'Étape 4 sur 9' })
    expect(buildDashboardView(data(), t).canValidate).toBe(false)
  })
})

const actor = { id: 'u1', displayName: 'Administrateur' }
const matchActivity = (at: string, poolNumber: number | null, roundKind = ROUND_KIND.POOLS): IAdminActivityItem => ({
  kind: ADMIN_ACTIVITY_KIND.MATCH_VALIDATED, at, actor,
  target: {
    type: ADMIN_ACTIVITY_TARGET.MATCH, id: `m-${at}`, matchSequence: 1, roundKind, poolNumber,
    sides: [
      { participationId: 'a', competitorId: 'ca', displayName: 'Manon Faure', score: 4 },
      { participationId: 'b', competitorId: 'cb', displayName: 'Théo Gauthier', score: 5 }
    ]
  }
})
const drawActivity = (at: string, actorValue: typeof actor | null = actor): IAdminActivityItem => ({
  kind: ADMIN_ACTIVITY_KIND.DRAW_VALIDATED, at, actor: actorValue,
  target: { type: ADMIN_ACTIVITY_TARGET.DRAW, id: `d-${at}`, drawKind: DRAW_KIND.POOLS, roundKind: null, poolCount: 8, seedCount: 8 }
})

describe('activité récente (A17)', () => {
  it('trie du plus récent au plus ancien et borne au limit', () => {
    const rows = buildActivityRows([matchActivity('2026-11-01T10:00:00Z', 1), matchActivity('2026-11-03T10:00:00Z', 2), matchActivity('2026-11-02T10:00:00Z', 3)], 2, t)
    expect(rows.map(row => row.context)).toEqual(['Poule 2', 'Poule 3'])
  })

  it('un match se lit dans l’ordre des côtés, sans désigner de vainqueur, avec sa poule', () => {
    const [row] = buildActivityRows([matchActivity('2026-11-01T10:00:00Z', 4)], 5, t)
    expect(row).toMatchObject({ kind: ADMIN_ACTIVITY_KIND.MATCH_VALIDATED, head: 'Manon Faure', score: '4–5', tail: 'Théo Gauthier', context: 'Poule 4' })
  })

  it('un match de phase finale porte le nom de son tour', () => {
    const [row] = buildActivityRows([matchActivity('2026-11-01T10:00:00Z', null, ROUND_KIND.QUARTER)], 5, t)
    expect(row!.context).toBe('Quart de finale')
  })

  it('un tirage se lit avec ses poules, ses têtes de série et son auteur', () => {
    const [row] = buildActivityRows([drawActivity('2026-11-01T10:00:00Z')], 5, t)
    expect(row).toMatchObject({ head: 'Tirage des poules · 8 poules, 8 têtes de série', score: null, tail: null, context: 'Administrateur' })
  })

  it('un acteur null est accepté (contrat B-15)', () => {
    const [row] = buildActivityRows([drawActivity('2026-11-01T10:00:00Z', null)], 5, t)
    expect(row!.context).toBeNull()
  })

  it('un flux vide donne aucune ligne', () => {
    expect(buildActivityRows([], 5, t)).toEqual([])
  })
})

describe('classement des erreurs', () => {
  const error = (statusCode: number, code: API_ERROR_CODE = API_ERROR_CODE.INTERNAL_ERROR) => ({ statusCode, code, message: 'x' })

  it('401 session expirée, 403 permission refusée, 404 édition inexistante, le reste « autre »', () => {
    expect(classifyError(error(401, API_ERROR_CODE.UNAUTHORIZED))).toBe(ADMIN_DASHBOARD_ERROR.SESSION_EXPIRED)
    expect(classifyError(error(403, API_ERROR_CODE.FORBIDDEN))).toBe(ADMIN_DASHBOARD_ERROR.FORBIDDEN)
    expect(classifyError(error(404, API_ERROR_CODE.NOT_FOUND))).toBe(ADMIN_DASHBOARD_ERROR.NOT_FOUND)
    expect(classifyError(error(500))).toBe(ADMIN_DASHBOARD_ERROR.OTHER)
    expect(classifyError(error(0))).toBe(ADMIN_DASHBOARD_ERROR.OTHER)
    expect(classifyError(null)).toBeNull()
  })
})
