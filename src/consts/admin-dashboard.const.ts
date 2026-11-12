import { ADMIN_ACTIVITY_KIND } from '../enums/admin-activity.enum.js'
import { ADMIN_DASHBOARD_STEP, ADMIN_DASHBOARD_STEP_STATUS } from '../enums/admin-dashboard.enum.js'
import type { IAdminDashboardStepDefinition } from '../interfaces/admin-dashboard.interface.js'
import type { ITranslatableText } from '../interfaces/common-components.interface.js'

/*********************************************************
 * Centre de contrôle
 *
 * @description
 * Les neuf étapes du workflow de la Spec fonctionnelle (« Centre de contrôle du tournoi »), dans l'ordre.
 * Les sous-titres qui dépendent de l'état de l'édition (étapes 1 à 4) sont choisis par `admin-dashboard.util.ts`.
 ********************************************************/
export const ADMIN_DASHBOARD_STEPS: IAdminDashboardStepDefinition[] = [
  { step: ADMIN_DASHBOARD_STEP.CREATION, title: { key: 'admin.dashboard.step_creation', fallback: 'Création' } },
  { step: ADMIN_DASHBOARD_STEP.PARTICIPANTS, title: { key: 'admin.dashboard.step_participants', fallback: 'Participants' } },
  { step: ADMIN_DASHBOARD_STEP.POOL_DRAW, title: { key: 'admin.dashboard.step_pool_draw', fallback: 'Tirage des poules' } },
  { step: ADMIN_DASHBOARD_STEP.POOL_MATCHES, title: { key: 'admin.dashboard.step_pool_matches', fallback: 'Matchs de poules' } },
  { step: ADMIN_DASHBOARD_STEP.QUALIFIED_VALIDATION, title: { key: 'admin.dashboard.step_qualified_validation', fallback: 'Validation des qualifiés' } },
  { step: ADMIN_DASHBOARD_STEP.BRACKET_DRAW, title: { key: 'admin.dashboard.step_bracket_draw', fallback: 'Tirage du bracket' } },
  { step: ADMIN_DASHBOARD_STEP.BRACKET_MATCHES, title: { key: 'admin.dashboard.step_bracket_matches', fallback: 'Matchs du bracket' } },
  { step: ADMIN_DASHBOARD_STEP.FINAL, title: { key: 'admin.dashboard.step_final', fallback: 'Finale' } },
  { step: ADMIN_DASHBOARD_STEP.CLOSING, title: { key: 'admin.dashboard.step_closing', fallback: 'Clôture' } }
]

export const ADMIN_DASHBOARD_STEP_COUNT = ADMIN_DASHBOARD_STEPS.length

export const ADMIN_DASHBOARD_STATUS_TEXTS: Record<ADMIN_DASHBOARD_STEP_STATUS, ITranslatableText> = {
  [ADMIN_DASHBOARD_STEP_STATUS.DONE]: { key: 'admin.dashboard.status_done', fallback: 'Fait' },
  [ADMIN_DASHBOARD_STEP_STATUS.ACTIVE]: { key: 'admin.dashboard.status_active', fallback: 'En cours' },
  [ADMIN_DASHBOARD_STEP_STATUS.PENDING]: { key: 'admin.dashboard.status_pending', fallback: 'À venir' }
}

export const ADMIN_DASHBOARD_STATIC_SUBTITLES: Partial<Record<ADMIN_DASHBOARD_STEP, ITranslatableText>> = {
  [ADMIN_DASHBOARD_STEP.QUALIFIED_VALIDATION]: { key: 'admin.dashboard.step_qualified_validation_subtitle', fallback: 'après validation de tous les matchs de poule' },
  [ADMIN_DASHBOARD_STEP.BRACKET_DRAW]: { key: 'admin.dashboard.step_bracket_draw_subtitle', fallback: 'huitièmes, puis un tirage par tour (RG13)' },
  [ADMIN_DASHBOARD_STEP.BRACKET_MATCHES]: { key: 'admin.dashboard.step_bracket_matches_subtitle', fallback: '8 huitièmes, 4 quarts, 2 demies' },
  [ADMIN_DASHBOARD_STEP.FINAL]: { key: 'admin.dashboard.step_final_subtitle', fallback: '1 match, cible 10' },
  [ADMIN_DASHBOARD_STEP.CLOSING]: { key: 'admin.dashboard.step_closing_subtitle', fallback: 'calcul du barème et des classements' }
}

/** Nombre de lignes demandé au flux d'activité (`?limit=` de B-15 : défaut 20, maximum 100). */
export const ADMIN_DASHBOARD_ACTIVITY_LIMIT = 5

/** Bordure de la carte « À traiter » qui demande une action (maquette `.adm-task--hot`) : l'accent d'action, pas le filet par défaut. */
export const ADMIN_TODO_HOT_BORDER_COLOR = 'var(--origam-color__action--primary---bg)'

/*********************************************************
 * Types d'activité
 *
 * @description
 * Libellé et couleur de la pastille de chaque type d'évènement du flux « Activité récente » (`ADMIN_ACTIVITY_KIND`, B-17).
 ********************************************************/
export const ADMIN_DASHBOARD_ACTIVITY_KINDS: Record<ADMIN_ACTIVITY_KIND, { text: ITranslatableText, color: string }> = {
  [ADMIN_ACTIVITY_KIND.MATCH_VALIDATED]: { text: { key: 'admin.dashboard.activity_match_validated', fallback: 'Match validé' }, color: 'success' },
  [ADMIN_ACTIVITY_KIND.DRAW_CREATED]: { text: { key: 'admin.dashboard.activity_draw_created', fallback: 'Tirage créé' }, color: 'info' },
  [ADMIN_ACTIVITY_KIND.DRAW_VALIDATED]: { text: { key: 'admin.dashboard.activity_draw_validated', fallback: 'Tirage validé' }, color: 'success' }
}
