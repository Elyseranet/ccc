import { ROUTES } from './routes.const.js'
import { PHASE_STEP } from '../enums/qualification.enum.js'
import type { ITranslatableText } from '../interfaces/common-components.interface.js'

/**
 * Les trois pages de la phase finale. `to` est `null` tant que la page n'existe pas (F-25 : tirage de tour, F-26 : clôture) : l'étape
 * n'est alors pas cliquable (même règle que F-07). Une page livrée y inscrit sa route dans le même commit.
 */
export const ADMIN_PHASE_STEPS: Array<{ step: PHASE_STEP, label: ITranslatableText, to: string | null }> = [
  { step: PHASE_STEP.QUALIFICATION, label: { key: 'admin.phase.step_qualification', fallback: 'Qualification' }, to: ROUTES.ADMIN_FINAL_PHASE_QUALIFICATION },
  { step: PHASE_STEP.ROUND_DRAW, label: { key: 'admin.phase.step_round_draw', fallback: 'Tirage de tour' }, to: ROUTES.ADMIN_FINAL_PHASE_ROUND_DRAW },
  { step: PHASE_STEP.CLOSING, label: { key: 'admin.phase.step_closing', fallback: 'Clôture' }, to: null }
]
