import { ROUTES } from '../../../src/consts/routes.const'

/*********************************************************
 * Audit des espacements (F-63) : périmètre et règles
 *
 * @description
 * Chaque route de `ROUTES` (et donc de `PAGE_DELIVERY`) est visitée, avec la session qui la rend (anonyme, membre,
 * administrateur) et des paramètres réels de la base de test (ARCH-9). `actions` ouvre les états principaux sans
 * écriture : onglets, boîtes de dialogue, formulaire soumis vide (refusé côté client).
 ********************************************************/
export type TSpacingAuditRole = 'anonymous' | 'member' | 'admin'

export type TSpacingAuditAction =
  | { kind: 'tabs' }
  | { kind: 'dialog', trigger: string }
  | { kind: 'submit', trigger: string }

export interface ISpacingAuditCase {
  route: string
  path: string
  role: TSpacingAuditRole
  actions?: TSpacingAuditAction[]
}

/** Écart vertical minimal entre deux blocs frères empilés (px), exclu : « < 4 px » signale. */
export const SPACING_AUDIT_MIN_GAP = 4

export const SPACING_AUDIT_VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 }
]

/** Nicolas Deseine, figé par le dump (voir `tests/e2e/pages.const.ts`). */
const PLAYER_ID = 'b20dfa9e-222d-46cf-a229-8fd77cc2edca'

/** `COMPETITOR_ID` et `INVITATION_TOKEN` sont remplacés à l'exécution (premier compétiteur de l'annuaire, jeton valide). */
export const SPACING_AUDIT_COMPETITOR_PLACEHOLDER = '{competitor}'
export const SPACING_AUDIT_INVITATION_PLACEHOLDER = '{invitation}'

const TABS: TSpacingAuditAction = { kind: 'tabs' }

export const SPACING_AUDIT_CASES: ISpacingAuditCase[] = [
  { route: ROUTES.HOME, path: '/', role: 'anonymous' },
  { route: ROUTES.HALL_OF_FAME, path: '/palmares', role: 'anonymous', actions: [TABS] },
  { route: ROUTES.EDITIONS, path: '/editions', role: 'anonymous' },
  { route: ROUTES.EDITION, path: '/editions/2025', role: 'anonymous', actions: [TABS] },
  { route: ROUTES.EDITION, path: '/editions/2026', role: 'anonymous', actions: [TABS] },
  { route: ROUTES.PLAYERS, path: '/joueurs', role: 'anonymous' },
  { route: ROUTES.PLAYER, path: `/joueurs/${PLAYER_ID}`, role: 'anonymous', actions: [TABS] },
  { route: ROUTES.HEAD_TO_HEAD, path: '/joueurs/face-a-face', role: 'anonymous' },
  { route: ROUTES.RULES, path: '/regles', role: 'anonymous', actions: [TABS] },
  { route: ROUTES.LOGIN, path: '/connexion', role: 'anonymous', actions: [{ kind: 'submit', trigger: '[data-cy="login-submit"]' }] },
  { route: ROUTES.INVITATION, path: '/invitation/jeton-de-test', role: 'anonymous' },
  { route: ROUTES.INVITATION, path: `/invitation/${SPACING_AUDIT_INVITATION_PLACEHOLDER}`, role: 'anonymous', actions: [{ kind: 'submit', trigger: '[data-cy="invitation-submit"]' }] },
  { route: ROUTES.LEGAL_NOTICE, path: '/mentions-legales', role: 'anonymous' },
  { route: ROUTES.PRIVACY, path: '/confidentialite', role: 'anonymous' },
  { route: ROUTES.TERMS, path: '/cgu', role: 'anonymous' },
  { route: ROUTES.ACCESSIBILITY, path: '/accessibilite', role: 'anonymous' },
  { route: ROUTES.PROFILE, path: '/profil', role: 'member' },
  { route: ROUTES.ADMIN, path: '/admin', role: 'admin' },
  { route: ROUTES.ADMIN_PARTICIPANTS, path: '/admin/participants', role: 'admin', actions: [{ kind: 'dialog', trigger: '[data-cy="participant-invite"]' }] },
  { route: ROUTES.ADMIN_DRAWS, path: '/admin/tirages', role: 'admin' },
  { route: ROUTES.ADMIN_MATCHES, path: '/admin/matchs', role: 'admin', actions: [{ kind: 'dialog', trigger: '[data-cy^="admin-match-enter-"]' }] },
  { route: ROUTES.ADMIN_FINAL_PHASE, path: '/admin/phase-finale', role: 'admin' },
  { route: ROUTES.ADMIN_FINAL_PHASE_QUALIFICATION, path: '/admin/phase-finale/qualification', role: 'admin' },
  { route: ROUTES.ADMIN_FINAL_PHASE_ROUND_DRAW, path: '/admin/phase-finale/tirage', role: 'admin' },
  { route: ROUTES.ADMIN_FINAL_PHASE_CLOSING, path: '/admin/phase-finale/cloture', role: 'admin' },
  { route: ROUTES.ADMIN_MORE, path: '/admin/plus', role: 'admin' },
  { route: ROUTES.ADMIN_EDITIONS, path: '/admin/editions', role: 'admin' },
  { route: ROUTES.ADMIN_EDITION_NEW, path: '/admin/editions/nouvelle', role: 'admin', actions: [{ kind: 'submit', trigger: '[data-cy="edition-form-submit"]' }] },
  { route: ROUTES.ADMIN_EDITION, path: '/admin/editions/2026', role: 'admin', actions: [{ kind: 'dialog', trigger: '[data-cy="edition-delete-open"]' }] },
  { route: ROUTES.ADMIN_EDITION, path: '/admin/editions/2025', role: 'admin' },
  { route: ROUTES.ADMIN_COMPETITORS, path: '/admin/competiteurs', role: 'admin' },
  { route: ROUTES.ADMIN_COMPETITOR, path: `/admin/competiteurs/${SPACING_AUDIT_COMPETITOR_PLACEHOLDER}`, role: 'admin' }
]

/** Rapport versionné (Markdown) ; chemin surchargeable par `SPACING_AUDIT_OUT`. */
export const SPACING_AUDIT_DEFAULT_OUT = '../../docs/audits/F-63-espacements.md'
