import type { SCORE_ENTRY_PHASE, SCORE_ENTRY_SUCCESS, SCORE_FIELD_ERROR, SCORE_FORM_ERROR } from '../enums/score-entry.enum.js'
import type { MATCH_PURPOSE } from '../enums/match.enum.js'
import type { ROUND_KIND } from '../enums/round.enum.js'
import type { IAdminMatch } from './admin-match.interface.js'
import type { IMatchValidationResult, IScoreSubmission } from './score.interface.js'

/** Ce dont le contrôle RG22 a besoin d'un match : le tour, la finalité et la cible portée par le match. */
export interface IScoreEntryRules {
  roundKind: ROUND_KIND
  purpose: MATCH_PURPOSE
  targetScore: number
}

export interface IScoreEntryValidation {
  valid: boolean
  /** Un élément par champ, dans l'ordre des côtés ; `null` si le champ est correct. */
  fieldErrors: Array<SCORE_FIELD_ERROR | null>
  formError: SCORE_FORM_ERROR | null
  /** Les scores lus, vides tant qu'un champ est en erreur. */
  scores: number[]
}

/** Ce que `useScoreEntry` attend du service : les deux écritures versionnées (le vrai `MatchService` ou un double de test). */
export interface IScoreWriter {
  record: (matchId: string, submission: IScoreSubmission, version: number) => Promise<IAdminMatch>
  validate: (matchId: string, submission: IScoreSubmission, version: number) => Promise<IMatchValidationResult>
}

export interface IUseScoreEntryOptions {
  service?: IScoreWriter
  /** Appelé avec le match à jour après une écriture réussie (la file remplace la ligne, la version suit). */
  onWritten: (match: IAdminMatch, outcome: SCORE_ENTRY_SUCCESS) => void
  /** Appelé quand la ligne est périmée (412, 409) : la file la recharge. */
  onStale: () => void
}

export interface IScoreEntryFormProps {
  names: string[]
  values: string[]
  /** Messages d'erreur de chaque champ, déjà traduits. */
  fieldMessages: string[][]
  /** Erreur du formulaire entier (RG22), déjà traduite, `null` sinon. */
  formMessage: string | null
  /** Échec d'écriture, déjà traduit, `null` sinon. */
  failureMessage: string | null
  ruleTitle: string
  ruleText: string
  meta: string
  validateLabel: string
  phase: SCORE_ENTRY_PHASE
  canValidate: boolean
  focusOnMount?: boolean
}

export interface IScoreEntryFormEmits {
  (event: 'update:value', index: number, value: string): void
  (event: 'save'): void
  (event: 'validate'): void
}

export interface IScoreEntryDialogProps {
  match: IAdminMatch | null
  editionCode: string
  open: boolean
}

export interface IScoreEntryDialogEmits {
  (event: 'update:open', value: boolean): void
  (event: 'written', match: IAdminMatch, outcome: SCORE_ENTRY_SUCCESS): void
  (event: 'stale'): void
}

export interface IScoreValidationConfirmProps {
  match: IAdminMatch | null
  editionCode: string
  open: boolean
}

export interface IScoreValidationConfirmEmits {
  (event: 'update:open', value: boolean): void
  (event: 'written', match: IAdminMatch, outcome: SCORE_ENTRY_SUCCESS): void
  (event: 'stale'): void
}
