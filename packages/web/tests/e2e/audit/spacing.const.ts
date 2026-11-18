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
  { route: ROUTES.ADMIN_COMPETITOR, path: `/admin/competiteurs/${SPACING_AUDIT_COMPETITOR_PLACEHOLDER}`, role: 'admin' },
  // F-63b : fiche d'un compétiteur SANS compte (Deseine, hors comptes de test) : le formulaire d'invitation n'est rendu que là.
  { route: ROUTES.ADMIN_COMPETITOR, path: `/admin/competiteurs/${PLAYER_ID}`, role: 'admin', actions: [{ kind: 'submit', trigger: '[data-cy="competitor-account-submit"]' }] }
]

/** Règles d'exclusion, recopiées dans le rapport (le code de chaque règle est dans `spacing.audit.ts`, fonction `exclusion`). */
export const SPACING_AUDIT_RULES: Record<string, string> = {
  'tableau': 'parent ou enfant de table (`table`, `tr`, `td`…, rôles row / cell / rowgroup).',
  'liste': 'deux items de liste (`li`, rôles option / listitem / menuitem / tab / treeitem, `.origam-list-item`).',
  'bracket': 'à l\'intérieur d\'un tableau à élimination (`.origam-bracket`).',
  'interne-origam': 'deux parties internes d\'un composant Origam (classes `origam-x__y`) ou intérieur d\'un contrôle (bouton, lien, label, champ, puce, avatar, squelette).',
  'typo': 'lignes d\'un même élément de texte (parent `h1`..`h6`, `p`, `label`, `small`, `b`, `strong`).',
  'coque': 'deux repères de la coque hors `main` (`header`, `main`, `footer`, `nav`, `aside`), bandes accolées par design.',
  'gap-explicite': 'le parent déclare un `row-gap` (même 0 ou 2 px) : choix de design.',
  'padding': 'l\'écart VISIBLE atteint le seuil : un bloc sans fond, bordure, ombre, texte propre ni élément remplacé ne se voit pas, son bord visible est celui de son premier (dernier) descendant visible ; un bouton ou lien sans fond n\'est vu que par son libellé.',
  'texte-interligne': 'écart de boîtes de 0 à 3 px entre deux faces de texte en ligne (fin de A et début de B : du texte, sans fond de bloc ni contrôle de formulaire, une puce en ligne admise) : l\'interligne fait l\'espacement, écart identique aux maquettes (mesure dev-f63b, 2026-11-17). Jamais appliquée quand la cause est `card__content`, `form__content`, `dialog` ou `async-state`.'
}

/** Rapport Markdown, hors dépôt par défaut ; un instantané versionné passe par `SPACING_AUDIT_OUT` (ex. `docs/audits/F-63-espacements-apres.md`). */
export const SPACING_AUDIT_DEFAULT_OUT = 'test-results/spacing-audit.md'
