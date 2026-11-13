import type { PHASE_STEP } from '../enums/qualification.enum.js'

export interface IPhaseStepsProps {
  /** La page courante de la phase finale : son étape est inerte (`aria-current="step"`). */
  current: PHASE_STEP
}
