import type { FEEDBACK_STATUS } from '../enums/feedback.enum.js'
import type { ROUND_DRAW_BLOCKER, ROUND_DRAW_MENTION, ROUND_DRAW_VIEW } from '../enums/round-draw.enum.js'
import type { POOL_DRAW_SAVE_STATE, POOL_DRAW_STEP_STATE } from '../enums/pool-draw.enum.js'
import type { ROUND_KIND } from '../enums/round.enum.js'
import type { TSidePosition } from '../types/draw.type.js'
import type { TEditionPerson } from '../types/edition-person.type.js'
import type { ITranslatableText } from './common-components.interface.js'

/** Un joueur du vivier, prêt à proposer dans une liste : ses initiales servent à la pastille de la liste « À placer ». */
export interface IRoundDrawPlayer {
  participationId: string
  competitor: TEditionPerson
  initials: string
  /** Premier de sa poule : il attend les barrages sans les jouer (RG14) et n'entre pas dans un tirage de barrages. */
  isLeader: boolean
}

/** Un joueur placé dans une affiche. `order` est l'ordre du tirage physique : donné au placement, il ne change plus. */
export interface IRoundDrawSide {
  participationId: string
  order: number
}

/** Une affiche : deux côtés, vides tant que le joueur n'est pas tiré. `index` est 1-based. */
export interface IRoundDrawPairing {
  index: number
  first: IRoundDrawSide | null
  second: IRoundDrawSide | null
}

export interface IRoundDrawProgress {
  /** Affiches complètes. */
  pairings: number
  /** Affiches à tirer au total. */
  total: number
  /** Joueurs placés, tous côtés confondus. */
  placed: number
  /** Joueurs du vivier qui restent à placer. */
  remaining: number
  percent: number
}

export interface IRoundDrawFeedback {
  status: FEEDBACK_STATUS
  message: ITranslatableText
}

/** Une ligne du récapitulatif des affiches. */
export interface IRoundDrawRecapRow {
  number: number
  first: TEditionPerson
  second: TEditionPerson
}

/** Une étape du stepper des tours : le libellé du tour et son état (fait, à tirer ou en cours, à venir). */
export interface IRoundDrawRoundStep {
  kind: ROUND_KIND
  state: POOL_DRAW_STEP_STATE
  mention: ROUND_DRAW_MENTION
}

export interface IRoundDrawChoiceProps {
  roundKind: ROUND_KIND | null
  allowedRoundKinds: ROUND_KIND[]
  playerCount: number
  busy: boolean
}

export interface IRoundDrawChoiceEmits {
  (event: 'start', roundKind: ROUND_KIND): void
}

export interface IRoundDrawEntryProps {
  roundKind: ROUND_KIND
  pairings: IRoundDrawPairing[]
  players: IRoundDrawPlayer[]
  progress: IRoundDrawProgress
  readOnly: boolean
  /** Le tour a été choisi (vivier hors 2, 4, 8, 16) : « Changer de tour » est proposé. */
  changeable: boolean
  saveState: POOL_DRAW_SAVE_STATE
  /** Barrages : nombre de premiers de poule qui attendent (0 sinon). */
  waitingLeaders: number
}

export interface IRoundDrawEntryEmits {
  (event: 'place', pairingIndex: number, participationId: string, position: TSidePosition): void
  (event: 'change', pairingIndex: number): void
  (event: 'change-round'): void
}

export interface IRoundDrawSideProps {
  roundKind: ROUND_KIND
  playerCount: number
  leaderCount: number
  /** Un tour de barrages a été tiré : les non-premiers du vivier en sont les vainqueurs. */
  hasPlayoff: boolean
  unplaced: IRoundDrawPlayer[]
  /** Barrages en cours de tirage : la phrase des premiers de poule en attente s'affiche. */
}

export interface IRoundDrawRecapProps {
  roundKind: ROUND_KIND
  rows: IRoundDrawRecapRow[]
  blocker: ROUND_DRAW_BLOCKER | null
  remaining: number
  busy: boolean
}

export interface IRoundDrawRecapEmits {
  (event: 'validate'): void
}

export interface IRoundDrawChangeDialogProps {
  open: boolean
  allowedRoundKinds: ROUND_KIND[]
  currentKind: ROUND_KIND
  savedPairings: number
  busy: boolean
}

export interface IRoundDrawChangeDialogEmits {
  (event: 'cancel'): void
  (event: 'confirm', roundKind: ROUND_KIND): void
}

export interface IRoundDrawStatePanelProps {
  view: ROUND_DRAW_VIEW
  roundKind: ROUND_KIND | null
  playerCount: number
  remainingMatches: number
  matchCount: number
  validatedOn: string | null
}

export interface IRoundKindRadiosProps {
  modelValue: ROUND_KIND | null
  kinds: ROUND_KIND[]
  legend?: string
  dataCy: string
}

export interface IRoundKindRadiosEmits {
  (event: 'update:modelValue', value: ROUND_KIND): void
}
