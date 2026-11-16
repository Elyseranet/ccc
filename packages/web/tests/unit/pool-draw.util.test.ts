import { describe, expect, it } from 'vitest'
import { API_ERROR_CODE } from '../../src/enums/api-error-code.enum'
import { DRAW_KIND, DRAW_STATUS } from '../../src/enums/draw.enum'
import { POOL_DRAW_STEP, POOL_DRAW_STEP_STATE } from '../../src/enums/pool-draw.enum'
import type { IAdminDraw, ISeedProposal } from '../../src/interfaces/draw.interface'
import type { IPoolDrawPlayer, IPoolDrawPool } from '../../src/interfaces/pool-draw.interface'
import { ApiRequestError } from '../../src/utils/api-request-error.util'
import {
  buildAssignments,
  buildEmptyPools,
  buildPoolsFromDraft,
  buildSteps,
  canLeaveParameters,
  defaultTieChoices,
  drawProgress,
  findTieGroups,
  hasPoolDrawErrorCode,
  isDrawComplete,
  parameterIssue,
  placePlayer,
  poolMatchCount,
  poolSizes,
  poolSlots,
  replacePlayer,
  selectedSeedIds,
  suggestPoolCount,
  tieChoicesComplete,
  toPoolDrawError,
  unplacedPlayers
} from '../../src/utils/pool-draw.util'

const person = (id: string, displayName: string) => ({ id, displayName, firstName: null, lastName: null, nickname: null, avatarUrl: null })
const player = (id: string, displayName = `Joueur ${id}`): IPoolDrawPlayer => ({ participationId: id, competitor: { id: `c-${id}`, displayName }, initials: 'JJ' })
const allPlayers = (count: number) => Array.from({ length: count }, (_, index) => player(`p${index + 1}`))

describe('tailles de poules (RG16)', () => {
  it('45 joueurs en 8 poules : cinq poules de 6, trois de 5, les plus grandes d’abord', () => {
    expect(poolSizes(45, 8)).toEqual([6, 6, 6, 6, 6, 5, 5, 5])
  })

  it('une répartition exacte donne des poules égales ; les cas limites ne plantent pas', () => {
    expect(poolSizes(12, 4)).toEqual([3, 3, 3, 3])
    expect(poolSizes(5, 1)).toEqual([5])
    expect(poolSizes(5, 0)).toEqual([])
  })

  it('le nombre de matchs de poule est le round-robin intégral n(n−1)/2 (RG15) : 105 pour 45 joueurs en 8 poules', () => {
    const pools = poolSizes(45, 8).map((size, index) => ({ number: index + 1, size, members: [] }))
    expect(poolMatchCount(pools)).toBe(105)
  })
})

describe('paramètres : RG9, on ne passe pas l’étape sans autant de têtes de série que de poules', () => {
  it('têtes de série différentes du nombre de poules : bloqué', () => {
    expect(parameterIssue(8, 7, 45)).toMatchObject({ key: 'admin.draws.issue_seed_count' })
    expect(canLeaveParameters(8, 7, 45)).toBe(false)
    expect(canLeaveParameters(8, 9, 45)).toBe(false)
  })

  it('autant de têtes de série que de poules : on passe', () => {
    expect(parameterIssue(8, 8, 45)).toBeNull()
    expect(canLeaveParameters(8, 8, 45)).toBe(true)
  })

  it('le nombre de poules est borné : 1 à 20, entier, jamais plus que d’inscrits', () => {
    expect(parameterIssue(0, 0, 45)).toMatchObject({ key: 'admin.draws.issue_pool_count' })
    expect(parameterIssue(21, 21, 45)).toMatchObject({ key: 'admin.draws.issue_pool_count' })
    expect(parameterIssue(2.5, 2.5, 45)).toMatchObject({ key: 'admin.draws.issue_pool_count' })
    expect(parameterIssue(6, 6, 5)).toMatchObject({ key: 'admin.draws.issue_too_many_pools' })
  })

  it('propose le nombre de poules de la table « Config poules » (RG16), sans formule', () => {
    const table: Array<[number, number]> = [[20, 4], [25, 5], [30, 6], [35, 7], [40, 8], [45, 7], [50, 8], [55, 9], [60, 10], [65, 10], [70, 10]]
    for (const [count, pools] of table) {
      expect(suggestPoolCount(count)).toBe(pools)
    }
  })

  it('ne propose rien hors de la table', () => {
    for (const count of [0, 3, 19, 21, 44, 46, 75, 500]) {
      expect(suggestPoolCount(count)).toBe(0)
    }
  })
})

describe('égalités sur la frontière des têtes de série (RG10)', () => {
  const proposal: ISeedProposal = {
    seeds: [
      { participationId: 'a', competitor: person('ca', 'A'), rank: 1, acp: 20 },
      { participationId: 'b', competitor: person('cb', 'B'), rank: 2, acp: 10 },
      { participationId: 'c', competitor: person('cc', 'C'), rank: 2, acp: 10 }
    ],
    unresolvedTies: [['b', 'c', 'd']]
  }
  const players = [player('a', 'A'), player('b', 'B'), player('c', 'C'), player('d', 'D')]

  it('un groupe d’ex æquo : autant de places que de têtes de série dans le groupe, et le joueur hors liste est proposé', () => {
    const [group] = findTieGroups(proposal, players)
    expect(group?.needed).toBe(2)
    expect(group?.candidates.map(candidate => candidate.participationId)).toEqual(['b', 'c', 'd'])
    expect(group?.candidates.find(candidate => candidate.participationId === 'd')).toMatchObject({ rank: 2, acp: 10 })
  })

  it('par défaut, les joueurs déjà placés par la proposition ; l’application ne départage rien', () => {
    const groups = findTieGroups(proposal, players)
    const choices = defaultTieChoices(proposal, groups)
    expect(choices[0]).toEqual(['b', 'c'])
    expect(tieChoicesComplete(groups, choices)).toBe(true)
  })

  it('l’administrateur choisit : la tête de série prend la place du groupe, dans l’ordre du classement', () => {
    const groups = findTieGroups(proposal, players)
    expect(selectedSeedIds(proposal, groups, { 0: ['d', 'b'] })).toEqual(['a', 'd', 'b'])
    expect(tieChoicesComplete(groups, { 0: ['d'] })).toBe(false)
  })

  it('sans égalité, les têtes de série restent celles du classement', () => {
    const plain: ISeedProposal = { seeds: proposal.seeds, unresolvedTies: [] }
    expect(selectedSeedIds(plain, [], {})).toEqual(['a', 'b', 'c'])
  })
})

describe('saisie : poules, places, ordre du tirage', () => {
  const seeds = ['p1', 'p2']
  const start = (): IPoolDrawPool[] => buildEmptyPools(seeds, 5)

  it('chaque tête de série est la première de la poule de même rang (RG9, RG11)', () => {
    const pools = start()
    expect(pools.map(pool => pool.size)).toEqual([3, 2])
    expect(pools.map(pool => pool.members.map(member => [member.participationId, member.order, member.isSeed]))).toEqual([[['p1', 1, true]], [['p2', 2, true]]])
  })

  it('un joueur placé arrive en dernier dans sa poule, avec l’ordre de tirage suivant', () => {
    const pools = placePlayer(placePlayer(start(), 2, 'p3'), 1, 'p4')
    expect(pools[1]?.members.map(member => [member.participationId, member.order])).toEqual([['p2', 2], ['p3', 3]])
    expect(pools[0]?.members.map(member => [member.participationId, member.order])).toEqual([['p1', 1], ['p4', 4]])
  })

  it('un joueur déjà placé n’est plus proposé ailleurs, et une poule pleine n’accepte plus personne', () => {
    const placed = placePlayer(start(), 1, 'p3')
    expect(placePlayer(placed, 2, 'p3')).toBe(placed)
    const full = placePlayer(placePlayer(placePlayer(start(), 2, 'p3'), 1, 'p4'), 1, 'p5')
    expect(placePlayer(full, 1, 'p9')).toBe(full)
    expect(unplacedPlayers(allPlayers(6), placed).map(entry => entry.participationId)).toEqual(['p4', 'p5', 'p6'])
  })

  it('changer une place garde son ordre ; la tête de série n’est jamais remplacée', () => {
    const pools = placePlayer(start(), 1, 'p3')
    const changed = replacePlayer(pools, 1, 2, 'p4')
    expect(changed[0]?.members[1]).toMatchObject({ participationId: 'p4', order: 3, isSeed: false })
    expect(replacePlayer(pools, 1, 1, 'p4')).toBe(pools)
    expect(replacePlayer(pools, 1, 2, 'p1')).toBe(pools)
  })

  it('les places sont celles de la poule : remplies puis vides jusqu’à la taille', () => {
    const slots = poolSlots(placePlayer(start(), 1, 'p3')[0] as IPoolDrawPool)
    expect(slots.map(slot => [slot.place, slot.member?.participationId ?? null])).toEqual([[1, 'p1'], [2, 'p3'], [3, null]])
  })

  it('avancement et complétude', () => {
    const pools = placePlayer(start(), 1, 'p3')
    expect(drawProgress(pools, 5)).toEqual({ placed: 3, total: 5, percent: 60 })
    expect(isDrawComplete(pools, 5)).toBe(false)
    const complete = placePlayer(placePlayer(pools, 2, 'p4'), 1, 'p5')
    expect(isDrawComplete(complete, 5)).toBe(true)
    expect(drawProgress([], 0).percent).toBe(0)
  })

  it('les inscrits non placés sont listés par ordre alphabétique', () => {
    const players = [player('p1', 'Zoé'), player('p2', 'Abel'), player('p3', 'Léa')]
    expect(unplacedPlayers(players, [])).toHaveLength(3)
    expect(unplacedPlayers(players, [])[0]?.competitor.displayName).toBe('Abel')
  })
})

describe('corps du brouillon (PUT /tirages/{id}/affectations)', () => {
  it('têtes de série d’abord (drawnOrder 1 à n, leur poule), puis les autres à la suite dans l’ordre d’arrivée', () => {
    const pools = placePlayer(placePlayer(buildEmptyPools(['p1', 'p2'], 5), 2, 'p3'), 1, 'p4')
    expect(buildAssignments(pools)).toEqual([
      { participationId: 'p1', poolNumber: 1, drawnOrder: 1 },
      { participationId: 'p2', poolNumber: 2, drawnOrder: 2 },
      { participationId: 'p3', poolNumber: 2, drawnOrder: 3 },
      { participationId: 'p4', poolNumber: 1, drawnOrder: 4 }
    ])
  })

  it('changer un joueur garde son rang d’arrivée : les autres drawnOrder ne sont pas renumérotés', () => {
    const entered = placePlayer(placePlayer(placePlayer(buildEmptyPools(['p1', 'p2'], 5), 1, 'p3'), 2, 'p4'), 1, 'p5')
    const changed = replacePlayer(entered, 1, 2, 'p6')
    expect(buildAssignments(changed).map(entry => [entry.participationId, entry.drawnOrder])).toEqual([['p1', 1], ['p2', 2], ['p6', 3], ['p4', 4], ['p5', 5]])
  })

  it('une saisie partielle donne un brouillon partiel : seules les têtes de série', () => {
    expect(buildAssignments(buildEmptyPools(['p1', 'p2'], 5))).toHaveLength(2)
  })
})

describe('reprise d’un brouillon du serveur', () => {
  const draft = {
    id: 'd1',
    kind: DRAW_KIND.POOLS,
    roundKind: null,
    status: DRAW_STATUS.DRAFT,
    parameters: { poolCount: 2, seedCount: 2 },
    createdAt: '',
    validatedAt: null,
    createdBy: null,
    validatedBy: null,
    assignments: [
      { participationId: 'p3', competitorId: 'c3', displayName: 'C', poolId: null, poolNumber: 2, pairingIndex: null, sidePosition: null, drawnOrder: 3, assignedAt: '' },
      { participationId: 'p1', competitorId: 'c1', displayName: 'A', poolId: null, poolNumber: null, pairingIndex: null, sidePosition: null, drawnOrder: 1, assignedAt: '' },
      { participationId: 'p2', competitorId: 'c2', displayName: 'B', poolId: null, poolNumber: null, pairingIndex: null, sidePosition: null, drawnOrder: 2, assignedAt: '' }
    ]
  } as IAdminDraw

  it('les têtes de série (sans poule à la création) retrouvent la poule de leur rang, les autres leur poule', () => {
    const pools = buildPoolsFromDraft(draft, 5)
    expect(pools.map(pool => pool.members.map(member => [member.participationId, member.isSeed]))).toEqual([[['p1', true]], [['p2', true], ['p3', false]]])
  })
})

describe('étapes et erreurs', () => {
  it('cinq étapes : les précédentes faites, la courante active, les suivantes à venir', () => {
    const steps = buildSteps(POOL_DRAW_STEP.ENTRY)
    expect(steps).toHaveLength(5)
    expect(steps.map(step => step.state)).toEqual([POOL_DRAW_STEP_STATE.DONE, POOL_DRAW_STEP_STATE.DONE, POOL_DRAW_STEP_STATE.ACTIVE, POOL_DRAW_STEP_STATE.PENDING, POOL_DRAW_STEP_STATE.PENDING])
  })

  const apiError = (code: API_ERROR_CODE, statusCode = 409, offline = false) => new ApiRequestError({ statusCode, code, message: 'x' }, offline)

  it('une clé de traduction par code d’erreur du contrat', () => {
    const codes = [API_ERROR_CODE.DRAW_SEEDS_INVALID, API_ERROR_CODE.DRAW_INCONSISTENT, API_ERROR_CODE.DRAW_INCOMPLETE, API_ERROR_CODE.DRAW_ALREADY_VALIDATED, API_ERROR_CODE.DRAW_SEED_WITHDRAWN, API_ERROR_CODE.REGISTRATION_CLOSED, API_ERROR_CODE.EDITION_CLOSED, API_ERROR_CODE.VALIDATION_FAILED, API_ERROR_CODE.BAD_REQUEST, API_ERROR_CODE.NOT_FOUND, API_ERROR_CODE.FORBIDDEN]
    const keys = codes.map(code => toPoolDrawError(apiError(code)).key)
    expect(new Set(keys).size).toBe(codes.length)
    expect(keys.every(key => key.startsWith('admin.draws.errors.'))).toBe(true)
  })

  it('« une tête de série s’est retirée, recommencez » : jamais « tirage incohérent »', () => {
    const message = toPoolDrawError(apiError(API_ERROR_CODE.DRAW_SEED_WITHDRAWN))
    expect(message.key).toBe('admin.draws.errors.draw_seed_withdrawn')
    expect(message.fallback).toContain('recommencez')
    expect(message.fallback).not.toContain('incohérent')
  })

  it('une perte de connexion se distingue d’une erreur de l’API, et un échec inconnu a un message générique', () => {
    expect(toPoolDrawError(apiError(API_ERROR_CODE.NOT_FOUND, 0, true)).key).toBe('admin.draws.errors.offline')
    expect(toPoolDrawError(new Error('boom')).key).toBe('admin.draws.errors.unknown')
  })

  it('reconnaît les codes qui obligent à recommencer le tirage', () => {
    expect(hasPoolDrawErrorCode(apiError(API_ERROR_CODE.DRAW_SEED_WITHDRAWN), [API_ERROR_CODE.DRAW_SEED_WITHDRAWN])).toBe(true)
    expect(hasPoolDrawErrorCode(apiError(API_ERROR_CODE.DRAW_INCOMPLETE), [API_ERROR_CODE.DRAW_SEED_WITHDRAWN])).toBe(false)
    expect(hasPoolDrawErrorCode(new Error('x'), [API_ERROR_CODE.DRAW_SEED_WITHDRAWN])).toBe(false)
  })
})
