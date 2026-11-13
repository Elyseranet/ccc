import { ROUND_DRAW_ERROR_MESSAGES, ROUND_DRAW_STALE_CODES } from '../consts/round-draw.const.js'
import { POOL_DRAW_ERROR_OFFLINE, POOL_DRAW_ERROR_UNKNOWN } from '../consts/pool-draw.const.js'
import { KNOCKOUT_ROUND_ORDER } from '../consts/qualification.const.js'
import { API_ERROR_CODE } from '../enums/api-error-code.enum.js'
import { DRAW_KIND, DRAW_STATUS } from '../enums/draw.enum.js'
import { POOL_DRAW_SAVE_STATE, POOL_DRAW_STEP_STATE } from '../enums/pool-draw.enum.js'
import { ROUND_DRAW_BLOCKER, ROUND_DRAW_MENTION, ROUND_DRAW_VIEW } from '../enums/round-draw.enum.js'
import { ROUND_KIND, ROUND_STATUS } from '../enums/round.enum.js'
import type { ITranslatableText } from '../interfaces/common-components.interface.js'
import type { IAdminDraw, IDraw } from '../interfaces/draw.interface.js'
import type { IPool } from '../interfaces/pool.interface.js'
import type { IRoundDrawPlayer, IRoundDrawPairing, IRoundDrawProgress, IRoundDrawRecapRow, IRoundDrawRoundStep, IRoundDrawSide } from '../interfaces/round-draw.interface.js'
import type { IRoundDrawPreview, IRoundDrawAssignmentInput } from '../interfaces/qualification.interface.js'
import type { IQualificationMember } from '../interfaces/qualification.interface.js'
import type { IRound } from '../interfaces/round.interface.js'
import type { TSidePosition } from '../types/draw.type.js'
import { ApiRequestError } from './api-request-error.util.js'
import { getInitials } from './player.util.js'

/*********************************************************
 * Tirage d'un tour de phase finale (F-25)
 *
 * @description
 * Fonctions pures : elles ne traduisent rien et ne font aucun appel. Le tirage est PHYSIQUE (A1, RG12) : rien ici ne tire au sort, on range ce que
 * l'administrateur saisit, affiche par affiche (c9790abd (5)). Le serveur reste l'autorité (taille du vivier, premiers de poule hors barrages, tour déduit) ;
 * aucun contrôle « puissance de 2 » (c9790abd (6)). Barrages (RG14, PLAYOFF-DRAW) : les premiers de poule attendent sans jouer, seuls les autres joueurs sont
 * tirés et le nombre d'affiches n'est pas fixé par une règle : on en propose la moitié des joueurs tirables, la validation accepte les affiches complètes saisies.
 ********************************************************/
const SIDES: readonly TSidePosition[] = [1, 2]

/** Premiers de leur poule : les participations au rang 1 d'un classement de poule (le serveur les écarte des barrages, RG14). */
export const leaderIdsOf = (pools: IPool[]): Set<string> =>
  new Set(pools.flatMap(pool => pool.standing.filter(row => row.rank === 1).map(row => row.participationId)))

export const toRoundPlayers = (candidates: IQualificationMember[], leaders: ReadonlySet<string>): IRoundDrawPlayer[] =>
  candidates.map(member => ({
    participationId: member.participationId,
    competitor: { id: member.competitor.id, displayName: member.competitor.displayName },
    initials: getInitials(member.competitor.displayName),
    isLeader: leaders.has(member.participationId)
  }))

/** Joueurs qu'on peut tirer : tout le vivier, sauf les premiers de poule pour les barrages. */
export const drawablePlayers = (players: IRoundDrawPlayer[], roundKind: ROUND_KIND): IRoundDrawPlayer[] =>
  roundKind === ROUND_KIND.PLAYOFF ? players.filter(player => !player.isLeader) : players

/** Affiches à tirer : la moitié des joueurs tirables (arrondie vers le bas : un barrage ne se joue qu'à deux). */
export const pairingTotal = (drawableCount: number): number => Math.floor(drawableCount / 2)

/*********************************************************
 * Affiches
 *
 * @description
 * La saisie va affiche par affiche : l'affiche en cours est la première qui n'est pas complète ; un joueur placé disparaît des listes ; « Changer » vide
 * une affiche, qui redevient l'affiche en cours (ses joueurs reviennent dans « À placer »). Les côtés se remplissent dans l'ordre 1 puis 2.
 ********************************************************/
export const buildEmptyPairings = (total: number): IRoundDrawPairing[] =>
  Array.from({ length: total }, (_, index) => ({ index: index + 1, first: null, second: null }))

/** Affiches d'un brouillon du serveur : chaque affectation reprend son affiche, son côté et son ordre de tirage. */
export const buildPairingsFromDraft = (draft: IDraw, total: number): IRoundDrawPairing[] => {
  const count = Math.max(total, ...draft.assignments.map(assignment => assignment.pairingIndex ?? 0))
  return buildEmptyPairings(count).map((pairing) => {
    const side = (position: TSidePosition): IRoundDrawSide | null => {
      const found = draft.assignments.find(assignment => assignment.pairingIndex === pairing.index && assignment.sidePosition === position)
      return found ? { participationId: found.participationId, order: found.drawnOrder } : null
    }
    return { ...pairing, first: side(1), second: side(2) }
  })
}

export const isPairingFull = (pairing: IRoundDrawPairing): boolean => pairing.first !== null && pairing.second !== null
export const isPairingEmpty = (pairing: IRoundDrawPairing): boolean => pairing.first === null && pairing.second === null

/** Affiche en cours : la première incomplète, `null` quand toutes sont pleines. */
export const currentPairingIndex = (pairings: IRoundDrawPairing[]): number | null =>
  pairings.find(pairing => !isPairingFull(pairing))?.index ?? null

/** Côté à remplir dans l'affiche : le premier vide. */
export const nextSideOf = (pairing: IRoundDrawPairing): TSidePosition | null =>
  pairing.first === null ? 1 : (pairing.second === null ? 2 : null)

export const sidesOf = (pairing: IRoundDrawPairing): Array<IRoundDrawSide | null> => [pairing.first, pairing.second]

export const placedIdsOf = (pairings: IRoundDrawPairing[]): Set<string> =>
  new Set(pairings.flatMap(pairing => sidesOf(pairing).flatMap(side => side ? [side.participationId] : [])))

const nextOrder = (pairings: IRoundDrawPairing[]): number =>
  pairings.reduce((max, pairing) => Math.max(max, ...sidesOf(pairing).map(side => side?.order ?? 0)), 0) + 1

/** Place un joueur non placé dans le prochain côté libre de l'affiche : il prend l'ordre de tirage suivant. */
export const placePlayer = (pairings: IRoundDrawPairing[], pairingIndex: number, participationId: string): IRoundDrawPairing[] => {
  const target = pairings.find(pairing => pairing.index === pairingIndex)
  const side = target ? nextSideOf(target) : null
  if (!target || side === null || placedIdsOf(pairings).has(participationId)) {
    return pairings
  }
  const placed: IRoundDrawSide = { participationId, order: nextOrder(pairings) }
  return pairings.map(pairing => (pairing.index === pairingIndex
    ? { ...pairing, first: side === 1 ? placed : pairing.first, second: side === 2 ? placed : pairing.second }
    : pairing))
}

/** « Changer » : vide l'affiche ; elle redevient l'affiche en cours et ses joueurs reviennent dans « À placer ». */
export const clearPairing = (pairings: IRoundDrawPairing[], pairingIndex: number): IRoundDrawPairing[] =>
  pairings.map(pairing => (pairing.index === pairingIndex ? { ...pairing, first: null, second: null } : pairing))

/** Joueurs pas encore placés, par ordre alphabétique. */
export const unplacedPlayers = (players: IRoundDrawPlayer[], pairings: IRoundDrawPairing[]): IRoundDrawPlayer[] => {
  const placed = placedIdsOf(pairings)
  return players
    .filter(player => !placed.has(player.participationId))
    .sort((a, b) => a.competitor.displayName.localeCompare(b.competitor.displayName, 'fr'))
}

export const roundDrawProgress = (pairings: IRoundDrawPairing[], drawableCount: number): IRoundDrawProgress => {
  const placed = placedIdsOf(pairings).size
  const full = pairings.filter(isPairingFull).length
  return { pairings: full, total: pairings.length, placed, remaining: Math.max(0, drawableCount - placed), percent: pairings.length > 0 ? Math.round(full / pairings.length * 100) : 0 }
}

/** Affiches complètes d'une seule traite, de la première : les trous ne partent pas (le serveur veut des affiches numérotées de 1 à k). */
export const leadingFullPairings = (pairings: IRoundDrawPairing[]): IRoundDrawPairing[] => {
  const end = pairings.findIndex(pairing => !isPairingFull(pairing))
  return end === -1 ? pairings : pairings.slice(0, end)
}

/**
 * Le tirage est prêt à valider : des affiches complètes, aucune affiche entamée derrière elles, et pour un tour hors barrages tout le vivier est tiré.
 * Barrages : seuls les joueurs choisis sont tirés, les affiches vides en fin de liste sont ignorées.
 */
export const isRoundDrawComplete = (pairings: IRoundDrawPairing[], roundKind: ROUND_KIND): boolean => {
  const full = leadingFullPairings(pairings)
  if (full.length === 0) {
    return false
  }
  const rest = pairings.slice(full.length)
  return roundKind === ROUND_KIND.PLAYOFF ? rest.every(isPairingEmpty) : rest.length === 0
}

/** Ce qui empêche de valider, `null` si rien (la raison est écrite sous le bouton). */
export const validationBlocker = (pairings: IRoundDrawPairing[], roundKind: ROUND_KIND, saveState: POOL_DRAW_SAVE_STATE): ROUND_DRAW_BLOCKER | null => {
  if (saveState === POOL_DRAW_SAVE_STATE.SAVING) {
    return ROUND_DRAW_BLOCKER.SAVING
  }
  if (saveState === POOL_DRAW_SAVE_STATE.FAILED) {
    return ROUND_DRAW_BLOCKER.SAVE_FAILED
  }
  if (leadingFullPairings(pairings).length === 0) {
    return ROUND_DRAW_BLOCKER.NOTHING_PLACED
  }
  return isRoundDrawComplete(pairings, roundKind) ? null : ROUND_DRAW_BLOCKER.PAIRINGS_LEFT
}

/** Corps du `PUT /tirages/{id}/affectations` : la liste complète, remplacée à chaque appel ; l'ordre du tirage est renuméroté de 1 à N dans l'ordre de saisie. */
export const buildRoundAssignments = (pairings: IRoundDrawPairing[]): IRoundDrawAssignmentInput[] => {
  const placed = pairings.flatMap(pairing => SIDES.flatMap((position) => {
    const side = position === 1 ? pairing.first : pairing.second
    return side ? [{ participationId: side.participationId, pairingIndex: pairing.index, sidePosition: position, order: side.order }] : []
  }))
  return placed
    .sort((a, b) => a.order - b.order)
    .map((entry, index) => ({ participationId: entry.participationId, pairingIndex: entry.pairingIndex, sidePosition: entry.sidePosition, drawnOrder: index + 1 }))
}

export const recapRows = (pairings: IRoundDrawPairing[], players: IRoundDrawPlayer[]): IRoundDrawRecapRow[] => {
  const byId = new Map(players.map(player => [player.participationId, player.competitor]))
  return leadingFullPairings(pairings).flatMap((pairing) => {
    const first = byId.get(pairing.first!.participationId)
    const second = byId.get(pairing.second!.participationId)
    return first && second ? [{ number: pairing.index, first, second }] : []
  })
}

/*********************************************************
 * Ce que la page affiche
 ********************************************************/
const KNOCKOUT_INDEX = (kind: ROUND_KIND): number => KNOCKOUT_ROUND_ORDER.indexOf(kind)

/** Dernier tirage de tour de l'édition (brouillon ou validé). */
export const latestRoundDraw = (draws: IAdminDraw[]): IAdminDraw | null => draws.filter(draw => draw.kind === DRAW_KIND.ROUND).at(-1) ?? null

/**
 * Vue de la page : l'aperçu du serveur décide (liste non figée, tour précédent inachevé, rien à tirer, tour déduit ou à choisir) ; un brouillon rouvre la saisie.
 * Un tirage validé dont les matchs sont à jouer donne la lecture seule (le serveur rend alors `ROUND_NOT_COMPLETED`).
 */
export const viewOf = (preview: IRoundDrawPreview, draw: IAdminDraw | null, rounds: IRound[]): ROUND_DRAW_VIEW => {
  if (draw?.status === DRAW_STATUS.DRAFT) {
    return ROUND_DRAW_VIEW.ENTRY
  }
  if (preview.blockedBy === API_ERROR_CODE.QUALIFICATION_NOT_DONE) {
    return ROUND_DRAW_VIEW.QUALIFICATION_PENDING
  }
  if (preview.blockedBy === API_ERROR_CODE.ROUND_NOT_COMPLETED) {
    return draw?.status === DRAW_STATUS.VALIDATED ? ROUND_DRAW_VIEW.DRAWN : ROUND_DRAW_VIEW.PREVIOUS_INCOMPLETE
  }
  if (preview.roundKind !== null) {
    return ROUND_DRAW_VIEW.ENTRY
  }
  if (preview.allowedRoundKinds.length > 0) {
    return ROUND_DRAW_VIEW.CHOICE
  }
  const final = rounds.find(round => round.kind === ROUND_KIND.FINAL)
  if (final) {
    // Le serveur ne rend plus de blocage une fois la finale tirée : on regarde l'état de son tour.
    return final.status === ROUND_STATUS.COMPLETED ? ROUND_DRAW_VIEW.FINISHED : ROUND_DRAW_VIEW.DRAWN
  }
  return ROUND_DRAW_VIEW.UNDRAWABLE
}

/**
 * Stepper des tours : les tours déjà tirés (état du serveur), puis le tour à tirer, puis les suivants jusqu'à la finale. Sans barrage tiré ni prévu, ils
 * n'apparaissent pas. Un tour tiré aux matchs à jouer est « en cours », un tour joué est fait, ceux d'après sont à venir (RG13 : aucune affiche d'avance).
 */
export const roundSteps = (rounds: IRound[], current: ROUND_KIND | null): IRoundDrawRoundStep[] => {
  const drawn = rounds.filter(round => round.kind !== ROUND_KIND.POOLS)
  const kinds = new Set<ROUND_KIND>([...drawn.map(round => round.kind), ...(current ? [current] : [])])
  const first = Math.min(...[...kinds].map(KNOCKOUT_INDEX))
  if (kinds.size === 0 || first < 0) {
    return []
  }
  const path = KNOCKOUT_ROUND_ORDER.filter((kind, index) => index >= first && (kind !== ROUND_KIND.PLAYOFF || kinds.has(kind)))
  return path.map((kind) => {
    const round = drawn.find(entry => entry.kind === kind)
    if (round) {
      const played = round.status === ROUND_STATUS.COMPLETED
      return { kind, state: played ? POOL_DRAW_STEP_STATE.DONE : POOL_DRAW_STEP_STATE.ACTIVE, mention: played ? ROUND_DRAW_MENTION.NONE : ROUND_DRAW_MENTION.IN_PROGRESS }
    }
    return kind === current
      ? { kind, state: POOL_DRAW_STEP_STATE.ACTIVE, mention: ROUND_DRAW_MENTION.TO_DRAW }
      : { kind, state: POOL_DRAW_STEP_STATE.PENDING, mention: ROUND_DRAW_MENTION.NONE }
  })
}

/** Tour tiré dont les matchs sont à jouer (le dernier tour de l'édition qui n'est pas joué), `null` s'il n'y en a pas. */
export const inProgressRound = (rounds: IRound[]): IRound | null =>
  rounds.filter(round => round.kind !== ROUND_KIND.POOLS && round.status !== ROUND_STATUS.COMPLETED).at(-1) ?? null

/** Le tour du tirage ouvert : celui du brouillon, sinon celui que l'aperçu déduit. */
export const currentRoundKind = (preview: IRoundDrawPreview, draw: IAdminDraw | null): ROUND_KIND | null =>
  (draw?.status === DRAW_STATUS.DRAFT ? draw.roundKind : null) ?? preview.roundKind

/** Texte traduisible d'un refus ; une absence de réponse (réseau, délai) est distinguée d'une réponse en erreur. */
export const toRoundDrawError = (error: unknown): ITranslatableText => {
  if (!(error instanceof ApiRequestError)) {
    return POOL_DRAW_ERROR_UNKNOWN
  }
  if (error.isOffline) {
    return POOL_DRAW_ERROR_OFFLINE
  }
  return ROUND_DRAW_ERROR_MESSAGES[error.error.code as API_ERROR_CODE] ?? POOL_DRAW_ERROR_UNKNOWN
}

export const isStaleRoundDrawError = (error: unknown): boolean =>
  error instanceof ApiRequestError && ROUND_DRAW_STALE_CODES.includes(error.error.code as API_ERROR_CODE)
