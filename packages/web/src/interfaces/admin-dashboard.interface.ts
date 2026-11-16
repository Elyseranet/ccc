import type { ADMIN_ACTIVITY_KIND } from '../enums/admin-activity.enum.js'
import type { ADMIN_DASHBOARD_STEP, ADMIN_DASHBOARD_STEP_STATUS, ADMIN_DASHBOARD_TODO } from '../enums/admin-dashboard.enum.js'
import type { IAdminMatch } from './admin-match.interface.js'
import type { ITranslatableText } from './common-components.interface.js'
import type { IAdminDraw } from './draw.interface.js'
import type { IEditionDetail } from './edition.interface.js'
import type { ApiRequestError } from '../utils/api-request-error.util.js'

export interface IAdminDashboardStepDefinition {
  step: ADMIN_DASHBOARD_STEP
  title: ITranslatableText
}

/** Les trois lectures dont le tableau de bord dérive l'étape active et les compteurs. */
export interface IAdminDashboardData {
  edition: IEditionDetail
  adminMatches: IAdminMatch[]
  draws: IAdminDraw[]
}

export interface IAdminDashboardCounters {
  poolMatchCount: number
  poolValidatedCount: number
  recordedCount: number
  scheduledCount: number
  pendingDrawCount: number
}

export interface IAdminDashboardStepItem {
  title: string
  subtitle: string
  status: ADMIN_DASHBOARD_STEP_STATUS
  /** Page de l'étape ; `null` : pas de page, l'étape n'est pas cliquable. */
  to: string | null
}

export interface IAdminDashboardTodoItem {
  id: ADMIN_DASHBOARD_TODO
  count: number
  title: string
  subtitle: string
  to: string | null
  hot: boolean
}

/** Vue du tableau de bord : tout ce que la page affiche, déjà traduit. */
export interface IAdminDashboardView {
  year: number
  readOnly: boolean
  activeStep: ADMIN_DASHBOARD_STEP | null
  recordedCount: number
  canValidate: boolean
  steps: IAdminDashboardStepItem[]
  todo: IAdminDashboardTodoItem[]
  progress: string
}

/** Ligne du flux d'activité : composée côté front à partir des champs structurés (aucun libellé serveur). */
export interface IAdminActivityRow {
  id: string
  kind: ADMIN_ACTIVITY_KIND
  head: string
  score: string | null
  tail: string | null
  context: string | null
}

export interface IAdminControlCenterProps {
  items: IAdminDashboardStepItem[]
  progress: string
}

export interface IAdminControlCenterEmits {}

export interface IAdminControlCenterSlots {}

export interface IAdminTodoProps {
  items: IAdminDashboardTodoItem[]
}

export interface IAdminTodoEmits {}

export interface IAdminTodoSlots {}

export interface IAdminActivityProps {
  items: IAdminActivityRow[]
  error?: ApiRequestError | null
  pending?: boolean
}

export interface IAdminActivityEmits {
  (event: 'retry'): void
}

export interface IAdminActivitySlots {}
