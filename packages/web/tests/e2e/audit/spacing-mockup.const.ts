import type { TSpacingAuditRole } from './spacing.const'

/*********************************************************
 * Audit des espacements contre la maquette (F-64) : correspondances écran ↔ maquette
 *
 * @description
 * Une ligne par écran qui a une maquette (`docs/design/ui/happy-hour`, `mapping.md`), avec le même choix d'écran que les
 * specs visuelles : `mockupHash` (écran `section.screen` d'admin-editions.html), `mockupTab` (onglet de compte.html),
 * `mockupCss` (états de la maquette absents de l'application, masqués comme dans les specs). `{competitor}`, `{invitation}`
 * et `{pair}` sont remplacés à l'exécution (premier compétiteur de l'annuaire, jeton valide, paire du face-à-face).
 ********************************************************/
export interface ISpacingMockupCase {
  name: string
  mockup: string
  path: string
  role: TSpacingAuditRole
  mockupHash?: string
  mockupTab?: string
  mockupCss?: string
}

/** Écart (px) au-delà duquel une différence app / maquette est signalée. */
export const SPACING_MOCKUP_MAX_DELTA = 4

/** Masqués dans toutes les maquettes : navigation entre écrans, catalogues d'états, toasts (hors produit). */
export const SPACING_MOCKUP_GLOBAL_CSS = '.screens, .adm-head .screens, .mock-states, .snack { display: none !important; }'

/** Onglets de navigation de compte.html entre ses trois écrans (hors produit) : leurs libellés se confondraient avec les titres de l'application. */
const ACCOUNT_TABS_HIDDEN = '[aria-label="Écrans du compte"] > .tabs { display: none !important; }'

export const SPACING_MOCKUP_CASES: ISpacingMockupCase[] = [
  { name: 'accueil', mockup: 'index.html', path: '/', role: 'anonymous' },
  { name: 'palmares', mockup: 'palmares.html', path: '/palmares', role: 'anonymous' },
  { name: 'edition', mockup: 'edition.html', path: '/editions/2025', role: 'anonymous' },
  { name: 'joueurs', mockup: 'joueurs.html', path: '/joueurs', role: 'anonymous' },
  { name: 'joueur', mockup: 'joueur.html', path: '/joueurs/b20dfa9e-222d-46cf-a229-8fd77cc2edca', role: 'anonymous' },
  { name: 'face-a-face', mockup: 'face-a-face.html', path: '{pair}', role: 'anonymous' },
  { name: 'regles', mockup: 'regles.html', path: '/regles', role: 'anonymous' },
  { name: 'connexion', mockup: 'compte.html', path: '/connexion', role: 'anonymous', mockupTab: '#ac-t-login', mockupCss: `${ACCOUNT_TABS_HIDDEN} #login-err { display: none !important; }` },
  { name: 'invitation', mockup: 'compte.html', path: '/invitation/{invitation}', role: 'anonymous', mockupTab: '#ac-t-first', mockupCss: ACCOUNT_TABS_HIDDEN },
  { name: 'profil', mockup: 'compte.html', path: '/profil', role: 'member', mockupTab: '#ac-t-prof', mockupCss: ACCOUNT_TABS_HIDDEN },
  { name: 'mentions-legales', mockup: 'mentions-legales.html', path: '/mentions-legales', role: 'anonymous' },
  { name: 'confidentialite', mockup: 'confidentialite.html', path: '/confidentialite', role: 'anonymous' },
  { name: 'cgu', mockup: 'cgu.html', path: '/cgu', role: 'anonymous' },
  { name: 'accessibilite', mockup: 'accessibilite.html', path: '/accessibilite', role: 'anonymous' },
  { name: 'erreur-404', mockup: 'erreur.html', path: '/page-qui-nexiste-pas', role: 'anonymous' },
  { name: 'admin', mockup: 'admin.html', path: '/admin', role: 'admin' },
  { name: 'admin-matchs', mockup: 'admin-matchs.html', path: '/admin/matchs', role: 'admin', mockupCss: '.sheet, .sheet-scrim { display: none !important; }' },
  { name: 'admin-participants', mockup: 'admin-participants.html', path: '/admin/participants', role: 'admin' },
  { name: 'admin-tirages', mockup: 'admin-tirages.html', path: '/admin/tirages', role: 'admin' },
  { name: 'admin-qualification', mockup: 'admin-qualification.html', path: '/admin/phase-finale/qualification', role: 'admin' },
  { name: 'admin-tirage-tour', mockup: 'admin-tirage-tour.html', path: '/admin/phase-finale/tirage', role: 'admin' },
  { name: 'admin-cloture', mockup: 'admin-cloture.html', path: '/admin/phase-finale/cloture', role: 'admin' },
  { name: 'admin-plus', mockup: 'admin-plus.html', path: '/admin/plus', role: 'admin' },
  { name: 'admin-editions', mockup: 'admin-editions.html', path: '/admin/editions', role: 'admin', mockupHash: 'ed-p-list' },
  { name: 'admin-edition-nouvelle', mockup: 'admin-editions.html', path: '/admin/editions/nouvelle', role: 'admin', mockupHash: 'ed-p-new', mockupCss: '#ed-p-new .ed-done, #ed-p-new .alert--error { display: none !important; }' },
  { name: 'admin-edition-2026', mockup: 'admin-editions.html', path: '/admin/editions/2026', role: 'admin', mockupHash: 'ed-p-edit', mockupCss: '#ed-p-edit .ed-form--locked { display: none !important; }' },
  { name: 'admin-edition-2025', mockup: 'admin-editions.html', path: '/admin/editions/2025', role: 'admin', mockupHash: 'ed-p-edit', mockupCss: '#ed-p-edit .ed-form:not(.ed-form--locked), .ed-form--locked > .alert--error { display: none !important; }' },
  { name: 'admin-competiteur', mockup: 'admin-editions.html', path: '/admin/competiteurs/{competitor}', role: 'admin', mockupHash: 'ed-p-comp', mockupCss: '#ed-p-comp .cp-photo .alert { display: none !important; }' }
]

/** Rapport Markdown, hors dépôt par défaut ; instantané versionné par `SPACING_MOCKUP_AUDIT_OUT`. */
export const SPACING_MOCKUP_DEFAULT_OUT = 'test-results/spacing-mockup-audit.md'
