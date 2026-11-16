import {
  POOL_DRAW_ERROR_MESSAGES,
  POOL_DRAW_ERROR_OFFLINE,
  POOL_DRAW_ERROR_UNKNOWN,
  POOL_DRAW_MAX_POOLS,
  POOL_DRAW_MIN_POOLS,
  POOL_DRAW_STEPS,
  POOL_DRAW_DEFAULT_POOL_COUNT
} from '../consts/pool-draw.const.js'
import { API_ERROR_CODE } from '../enums/api-error-code.enum.js'
import { POOL_DRAW_STEP, POOL_DRAW_STEP_STATE } from '../enums/pool-draw.enum.js'
import type { ITranslatableText } from '../interfaces/common-components.interface.js'
import type { IAdminDraw, IDrawAssignmentInput, ISeedProposal } from '../interfaces/draw.interface.js'
import type { IEditionParticipant } from '../interfaces/edition.interface.js'
import type {
  IPoolDrawMember,
  IPoolDrawPlayer,
  IPoolDrawPool,
  IPoolDrawProgress,
  IPoolDrawSeedRow,
  IPoolDrawSlot,
  IPoolDrawStepView,
  IPoolDrawTieGroup
} from '../interfaces/pool-draw.interface.js'
import { ApiRequestError } from './api-request-error.util.js'
import { getInitials } from './player.util.js'

/*********************************************************
 * Tirage des poules de l'admin (F-11)
 *
 * @description
 * Fonctions pures : elles ne traduisent rien (clés + paramètres) et ne font aucun appel. Le tirage est PHYSIQUE (A1, RG12) :
 * rien ici ne tire au sort, on ne fait que ranger ce que l'administrateur saisit. Le serveur ne connaît que `poolNumber` et
 * `drawnOrder` par joueur : la « place » dans la poule est le rang d'arrivée du joueur dans sa poule, la tête de série étant
 * toujours la première (RG9, RG11).
 ********************************************************/

/** Les inscrits de l'édition, indexés par `participationId`, avec leurs initiales. */
export const toPlayers = (participants: IEditionParticipant[]): IPoolDrawPlayer[] => participants.map(participant => ({
  participationId: participant.participationId,
  competitor: { id: participant.competitor.id, displayName: participant.competitor.displayName },
  initials: getInitials(participant.competitor.displayName)
}))

/** Tailles des poules (RG16) : les `total` joueurs se répartissent au plus à un joueur d'écart, les plus grandes poules d'abord. */
export const poolSizes = (total: number, poolCount: number): number[] => {
  if (poolCount < 1 || total < 0) {
    return []
  }
  const base = Math.floor(total / poolCount)
  const larger = total % poolCount
  return Array.from({ length: poolCount }, (_, index) => (index < larger ? base + 1 : base))
}

/**
 * Nombre de poules proposé au départ : celui de la table « Config poules » du classeur (RG16). 0 quand le nombre d'inscrits n'y
 * figure pas : pas de proposition, l'administrateur saisit le nombre.
 */
export const suggestPoolCount = (participantCount: number): number => POOL_DRAW_DEFAULT_POOL_COUNT[participantCount] ?? 0

/**
 * Ce qui empêche de quitter l'étape « Paramètres » (RG9) : autant de têtes de série que de poules, et un nombre de poules compris
 * entre 1 et le plus petit du maximum de l'API et du nombre d'inscrits. `null` : on peut passer à l'étape suivante.
 */
export const parameterIssue = (poolCount: number, seedCount: number, participantCount: number): ITranslatableText | null => {
  if (!Number.isInteger(poolCount) || poolCount < POOL_DRAW_MIN_POOLS || poolCount > POOL_DRAW_MAX_POOLS) {
    return { key: 'admin.draws.issue_pool_count', fallback: 'Le nombre de poules est un entier de {min} à {max}.', params: { min: POOL_DRAW_MIN_POOLS, max: POOL_DRAW_MAX_POOLS } }
  }
  if (poolCount > participantCount) {
    return { key: 'admin.draws.issue_too_many_pools', fallback: 'Il ne peut pas y avoir plus de poules que d’inscrits ({count}).', params: { count: participantCount } }
  }
  if (seedCount !== poolCount) {
    return { key: 'admin.draws.issue_seed_count', fallback: 'Il faut autant de têtes de série que de poules ({pools}) : {seeds} choisies.', params: { pools: poolCount, seeds: seedCount } }
  }
  return null
}

export const canLeaveParameters = (poolCount: number, seedCount: number, participantCount: number): boolean =>
  parameterIssue(poolCount, seedCount, participantCount) === null

/*********************************************************
 * Têtes de série et égalités (RG9, RG10)
 *
 * @description
 * Un groupe d'ex æquo parfaits à cheval sur la frontière des n têtes de série n'est jamais tranché par le serveur ni par l'écran :
 * l'administrateur choisit autant de joueurs que le groupe a de places parmi les têtes de série (la règle de choix n'est pas écrite).
 ********************************************************/
export const toSeedRows = (proposal: ISeedProposal): IPoolDrawSeedRow[] => proposal.seeds.map(entry => ({
  participationId: entry.participationId,
  competitor: { id: entry.competitor.id, displayName: entry.competitor.displayName },
  rank: entry.rank,
  acp: entry.acp
}))

/** Groupes d'égalité non tranchés : leurs candidats (nom pris dans les inscrits, rang et ACP du groupe) et le nombre à retenir. */
export const findTieGroups = (proposal: ISeedProposal, players: IPoolDrawPlayer[]): IPoolDrawTieGroup[] => {
  const byId = new Map(players.map(player => [player.participationId, player]))
  const seeds = new Map(proposal.seeds.map(entry => [entry.participationId, entry]))
  return proposal.unresolvedTies.map((group, index) => {
    const seated = group.filter(id => seeds.has(id))
    const reference = seeds.get(seated[0] ?? '')
    return {
      index,
      needed: seated.length,
      candidates: group.flatMap((id) => {
        const player = byId.get(id)
        const seed = seeds.get(id)
        if (!player && !seed) {
          return []
        }
        return [{
          participationId: id,
          competitor: player?.competitor ?? { id: seed!.competitor.id, displayName: seed!.competitor.displayName },
          rank: seed?.rank ?? reference?.rank ?? 0,
          acp: seed?.acp ?? reference?.acp ?? 0
        }]
      })
    }
  })
}

/** Choix par défaut : les joueurs que la proposition a déjà placés dans chaque groupe. */
export const defaultTieChoices = (proposal: ISeedProposal, groups: IPoolDrawTieGroup[]): Record<number, string[]> => {
  const seeded = new Set(proposal.seeds.map(entry => entry.participationId))
  return Object.fromEntries(groups.map(group => [group.index, group.candidates.filter(candidate => seeded.has(candidate.participationId)).map(candidate => candidate.participationId)]))
}

export const tieChoicesComplete = (groups: IPoolDrawTieGroup[], choices: Record<number, string[]>): boolean =>
  groups.every(group => (choices[group.index] ?? []).length === group.needed)

/**
 * Les têtes de série retenues, dans l'ordre du classement : les joueurs hors égalité restent à leur place, et les places d'un
 * groupe d'ex æquo sont remplies, dans l'ordre, par les joueurs choisis.
 */
export const selectedSeedIds = (proposal: ISeedProposal, groups: IPoolDrawTieGroup[], choices: Record<number, string[]>): string[] => {
  const groupOf = new Map<string, number>()
  for (const group of groups) {
    for (const candidate of group.candidates) {
      groupOf.set(candidate.participationId, group.index)
    }
  }
  const queues = new Map(groups.map(group => [group.index, [...(choices[group.index] ?? [])]]))
  return proposal.seeds.flatMap((entry) => {
    const index = groupOf.get(entry.participationId)
    if (index === undefined) {
      return [entry.participationId]
    }
    const next = queues.get(index)?.shift()
    return next ? [next] : []
  })
}

/*********************************************************
 * Poules et brouillon
 *
 * @description
 * `members` d'une poule : ses joueurs dans l'ordre d'arrivée, la tête de série en premier. Un nouvel arrivant prend l'ordre de
 * tirage suivant ; changer une place garde l'ordre de la place.
 ********************************************************/

/** Poules à l'ouverture du brouillon : chaque tête de série est la première de la poule de même rang (maquette, RG9, RG11). */
export const buildEmptyPools = (seedIds: string[], total: number): IPoolDrawPool[] =>
  poolSizes(total, seedIds.length).map((size, index) => ({
    number: index + 1,
    size,
    members: [{ participationId: seedIds[index] as string, order: index + 1, isSeed: true }]
  }))

/** Poules d'un brouillon du serveur : têtes de série (`drawnOrder` ≤ `seedCount`) d'abord, puis les autres dans l'ordre du tirage. */
export const buildPoolsFromDraft = (draft: IAdminDraw, total: number): IPoolDrawPool[] => {
  const { poolCount, seedCount } = draft.parameters
  const ordered = [...draft.assignments].sort((a, b) => a.drawnOrder - b.drawnOrder)
  return poolSizes(total, poolCount).map((size, index) => {
    const number = index + 1
    const members: IPoolDrawMember[] = ordered
      .filter(assignment => (assignment.drawnOrder <= seedCount ? (assignment.poolNumber ?? assignment.drawnOrder) === number : assignment.poolNumber === number))
      .map(assignment => ({ participationId: assignment.participationId, order: assignment.drawnOrder, isSeed: assignment.drawnOrder <= seedCount }))
    return { number, size, members }
  })
}

export const poolSlots = (pool: IPoolDrawPool): IPoolDrawSlot[] =>
  Array.from({ length: Math.max(pool.size, pool.members.length) }, (_, index) => ({ place: index + 1, member: pool.members[index] ?? null }))

/** Poule en cours de saisie (RG11 : poule après poule) : la première qui n'est pas pleine, `null` quand toutes le sont. */
export const currentPoolNumber = (pools: IPoolDrawPool[]): number | null =>
  pools.find(pool => pool.members.length < pool.size)?.number ?? null

export const nextOrder = (pools: IPoolDrawPool[]): number =>
  pools.reduce((max, pool) => Math.max(max, ...pool.members.map(member => member.order)), 0) + 1

/** Place un joueur non placé dans une poule qui a encore de la place : il arrive en dernier, avec l'ordre de tirage suivant. */
export const placePlayer = (pools: IPoolDrawPool[], poolNumber: number, participationId: string): IPoolDrawPool[] => {
  const alreadyPlaced = pools.some(pool => pool.members.some(member => member.participationId === participationId))
  const target = pools.find(pool => pool.number === poolNumber)
  if (alreadyPlaced || !target || target.members.length >= target.size) {
    return pools
  }
  const order = nextOrder(pools)
  return pools.map(pool => (pool.number === poolNumber
    ? { ...pool, members: [...pool.members, { participationId, order, isSeed: false }] }
    : pool))
}

/** Remplace le joueur d'une place (« Changer ») : la tête de série n'est jamais remplacée (fixée à la création), l'ordre de la place est gardé. */
export const replacePlayer = (pools: IPoolDrawPool[], poolNumber: number, place: number, participationId: string): IPoolDrawPool[] => {
  const alreadyPlaced = pools.some(pool => pool.members.some(member => member.participationId === participationId))
  const target = pools.find(pool => pool.number === poolNumber)
  const current = target?.members[place - 1]
  if (alreadyPlaced || !target || !current || current.isSeed) {
    return pools
  }
  return pools.map(pool => (pool.number === poolNumber
    ? { ...pool, members: pool.members.map((member, index) => (index === place - 1 ? { ...member, participationId } : member)) }
    : pool))
}

export const placedIds = (pools: IPoolDrawPool[]): Set<string> => new Set(pools.flatMap(pool => pool.members.map(member => member.participationId)))

/** Inscrits pas encore placés, par ordre alphabétique : ils disparaissent des listes dès qu'ils sont placés. */
export const unplacedPlayers = (players: IPoolDrawPlayer[], pools: IPoolDrawPool[]): IPoolDrawPlayer[] => {
  const placed = placedIds(pools)
  return players
    .filter(player => !placed.has(player.participationId))
    .sort((a, b) => a.competitor.displayName.localeCompare(b.competitor.displayName, 'fr'))
}

export const drawProgress = (pools: IPoolDrawPool[], total: number): IPoolDrawProgress => {
  const placed = pools.reduce((sum, pool) => sum + pool.members.length, 0)
  return { placed, total, percent: total > 0 ? Math.round((placed / total) * 100) : 0 }
}

export const isDrawComplete = (pools: IPoolDrawPool[], total: number): boolean => total > 0 && drawProgress(pools, total).placed === total

/** Matchs de poule générés à la validation : le round-robin intégral de chaque poule, n(n−1)/2 (RG15). */
export const poolMatchCount = (pools: IPoolDrawPool[]): number => pools.reduce((sum, pool) => sum + (pool.size * (pool.size - 1)) / 2, 0)

/**
 * Corps du `PUT /tirages/{id}/affectations` : la liste complète, remplacée à chaque appel. Les têtes de série gardent `drawnOrder` 1 à n
 * (fixé à la création) et leur poule ; les autres suivent dans l'ordre d'arrivée, numérotés à la suite (les trous sont permis, on n'en laisse pas).
 */
export const buildAssignments = (pools: IPoolDrawPool[]): IDrawAssignmentInput[] => {
  const seeds = pools.flatMap(pool => pool.members.filter(member => member.isSeed).map(member => ({ participationId: member.participationId, poolNumber: pool.number, order: member.order })))
  const others = pools
    .flatMap(pool => pool.members.filter(member => !member.isSeed).map(member => ({ participationId: member.participationId, poolNumber: pool.number, order: member.order })))
    .sort((a, b) => a.order - b.order)
  return [
    ...seeds.sort((a, b) => a.order - b.order).map(seed => ({ participationId: seed.participationId, poolNumber: seed.poolNumber, drawnOrder: seed.order })),
    ...others.map((other, index) => ({ participationId: other.participationId, poolNumber: other.poolNumber, drawnOrder: seeds.length + index + 1 }))
  ]
}

/*********************************************************
 * Étapes et erreurs
 ********************************************************/
export const buildSteps = (current: POOL_DRAW_STEP): IPoolDrawStepView[] => {
  const currentIndex = POOL_DRAW_STEPS.findIndex(entry => entry.step === current)
  return POOL_DRAW_STEPS.map((entry, index) => ({
    step: entry.step,
    index: index + 1,
    label: entry.label,
    state: index < currentIndex ? POOL_DRAW_STEP_STATE.DONE : (index === currentIndex ? POOL_DRAW_STEP_STATE.ACTIVE : POOL_DRAW_STEP_STATE.PENDING)
  }))
}

/** Texte traduisible d'une erreur d'API ; un échec sans réponse (réseau, délai) est distingué d'une réponse en erreur. */
export const toPoolDrawError = (error: unknown): ITranslatableText => {
  if (!(error instanceof ApiRequestError)) {
    return POOL_DRAW_ERROR_UNKNOWN
  }
  if (error.isOffline) {
    return POOL_DRAW_ERROR_OFFLINE
  }
  return POOL_DRAW_ERROR_MESSAGES[error.error.code as API_ERROR_CODE] ?? POOL_DRAW_ERROR_UNKNOWN
}

export const hasPoolDrawErrorCode = (error: unknown, codes: API_ERROR_CODE[]): boolean =>
  error instanceof ApiRequestError && codes.includes(error.error.code as API_ERROR_CODE)
