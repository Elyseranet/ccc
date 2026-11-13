import type { FEEDBACK_STATUS } from '../enums/feedback.enum.js'
import type { POOL_DRAW_SAVE_STATE, POOL_DRAW_STEP, POOL_DRAW_STEP_STATE } from '../enums/pool-draw.enum.js'
import type { ITranslatableText } from './common-components.interface.js'
import type { IAdminDraw, ISeedProposal } from './draw.interface.js'
import type { TEditionPerson } from '../types/edition-person.type.js'

/** Un inscrit de l'édition, prêt à proposer dans une liste de places. */
export interface IPoolDrawPlayer {
  participationId: string
  competitor: TEditionPerson
  initials: string
}

/**
 * Un joueur placé dans une poule. `order` est l'ordre du tirage (`drawnOrder`) : il est donné au placement et ne change plus,
 * même quand la place est changée (« Changer ») ; la tête de série est toujours la première de sa poule (RG9, RG11).
 */
export interface IPoolDrawMember {
  participationId: string
  order: number
  isSeed: boolean
}

/** Une poule : ses joueurs placés, tête de série en premier ; les places vides sont celles qui restent jusqu'à `size`. */
export interface IPoolDrawPool {
  number: number
  size: number
  members: IPoolDrawMember[]
}

/** Une place d'une poule, remplie ou vide (`place` est 1-based). */
export interface IPoolDrawSlot {
  place: number
  member: IPoolDrawMember | null
}

/** Une tête de série à contrôler : rang et score ACP du classement (A8). */
export interface IPoolDrawSeedRow {
  participationId: string
  competitor: TEditionPerson
  rank: number
  acp: number
}

/**
 * Un groupe d'ex æquo parfaits à cheval sur la frontière des têtes de série (RG10) : la règle de choix n'est pas écrite, c'est
 * l'administrateur qui choisit `needed` joueurs parmi `candidates`.
 */
export interface IPoolDrawTieGroup {
  index: number
  candidates: IPoolDrawSeedRow[]
  needed: number
}

export interface IPoolDrawStepView {
  step: POOL_DRAW_STEP
  index: number
  state: POOL_DRAW_STEP_STATE
  label: ITranslatableText
}

export interface IPoolDrawFeedback {
  status: FEEDBACK_STATUS
  message: ITranslatableText
}

/** Dernière place enregistrée, pour le message « Poule 6, place 3 · 37/45 ». */
export interface IPoolDrawLastSaved {
  poolNumber: number
  place: number
  placed: number
  total: number
}

export interface IPoolDrawProgress {
  placed: number
  total: number
  /** Pourcentage entier (0 à 100) pour `origam-progress`. */
  percent: number
}

export interface IPoolDrawContext {
  draft: IAdminDraw | null
  proposal: ISeedProposal | null
}

export interface IDrawStepsProps {
  steps: Array<Pick<IPoolDrawStepView, 'label' | 'state'>>
  /** Nom du stepper pour les lecteurs d'écran ; à défaut, « Étapes du tirage ». */
  label?: string
}

export interface IDrawParametersProps {
  poolCount: number
  total: number
  issue: ITranslatableText | null
  busy: boolean
  readOnly: boolean
}

export interface IDrawSeedsProps {
  seeds: IPoolDrawSeedRow[]
  selectedIds: string[]
  tieGroups: IPoolDrawTieGroup[]
  choices: Record<number, string[]>
  poolCount: number
  issue: ITranslatableText | null
  canConfirm: boolean
  busy: boolean
}

export interface IDrawAssignmentProps {
  pools: IPoolDrawPool[]
  players: IPoolDrawPlayer[]
  unplaced: IPoolDrawPlayer[]
  seedRows: IPoolDrawSeedRow[]
  progress: IPoolDrawProgress
  poolCount: number
  saveState: POOL_DRAW_SAVE_STATE
  readOnly: boolean
  complete: boolean
}

export interface IDrawRecapProps {
  pools: IPoolDrawPool[]
  players: IPoolDrawPlayer[]
  total: number
  matchCount: number
  readOnly: boolean
  canValidate: boolean
}

export interface IDrawValidateDialogProps {
  open: boolean
  total: number
  poolCount: number
  matchCount: number
  busy: boolean
}

export interface IDrawValidationProps {
  total: number
  poolCount: number
  matchCount: number
  canValidate: boolean
  busy: boolean
  validated: boolean
}
