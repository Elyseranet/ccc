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
  /** Repères écrits à la main (F-64) : séquences de blocs empilés `[maquette, application]` ; on compare l'écart entre deux blocs consécutifs d'une séquence. */
  pairs?: Array<Array<[string, string]>>
}

/** Étapes de la phase finale puis en-tête de page : mêmes repères sur qualification, tirage de tour et clôture. */
const phaseHead = (page: string): Array<[string, string]> => [
  ['.ostep--phase', '[data-cy="phase-steps"]'],
  ['.adm-head .eyebrow', `.${page}__eyebrow`],
  ['.adm-head .adm-h1', '[data-cy="page-title"]'],
  ['.adm-head > p.muted', `.${page}__lead`]
]

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
  {
    name: 'joueur',
    mockup: 'joueur.html',
    path: '/joueurs/b20dfa9e-222d-46cf-a229-8fd77cc2edca',
    role: 'anonymous',
    pairs: [[
      ['.pl-hero', '[data-cy="player-header"]'],
      ['.pl-stats', '.player-stats__grid'],
      ['section:has(.pchart) > .section__head', '.player-journey__head'],
      ['.pchart', '[data-cy="player-journey-chart"]'],
      ['.table-wrap--bare', '[data-cy="player-journey-table"]'],
      ['section:has(.opps) > .section__head', '.player-opponents__head'],
      ['.opps', '[data-cy="player-opponents-list"]']
    ]]
  },
  {
    name: 'face-a-face',
    mockup: 'face-a-face.html',
    path: '{pair}',
    role: 'anonymous',
    pairs: [[
      ['.ff-hero .page-hero__title', '[data-cy="page-title"]'],
      ['.ff-hero .page-hero__lead', '[data-cy="page-hero-lead"]'],
      ['.ff-pick', '[data-cy="head-to-head-picker"]'],
      ['.ff-duel', '[data-cy="head-to-head-duel"] .origam-card'],
      ['section:has(> .ff-players) > .section__head', '.head-to-head-summary__head'],
      ['.ff-players', '.head-to-head-summary__players'],
      ['section:has(> .table-wrap) > .section__head', '.head-to-head-history__head'],
      ['.table-wrap', '[data-cy="head-to-head-scroll"]'],
      ['.ff-note', '[data-cy="head-to-head-note"]']
    ]]
  },
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
  {
    name: 'admin-participants',
    mockup: 'admin-participants.html',
    path: '/admin/participants',
    role: 'admin',
    pairs: [
      [['.adm-head .eyebrow', '.admin-participants__eyebrow'], ['.adm-head .adm-h1', '[data-cy="page-title"]'], ['.adm-head > p.muted', '[data-cy="participant-summary"]'], ['.pa-grid', '.admin-participants__grid']],
      [['.pa-add > .h-card', '.admin-participants__card-title'], ['.pa-add > p.muted', '.admin-participants__lead']],
      [['.pa-list > header', '.participant-list__head'], ['.pa-list .table-wrap', '[data-cy="participant-scroll"]'], ['.pa-list .pager', '[data-cy="participant-pagination"]']]
    ]
  },
  {
    name: 'admin-tirages',
    mockup: 'admin-tirages.html',
    path: '/admin/tirages',
    role: 'admin',
    pairs: [[['.adm-head .eyebrow', '.admin-draws__eyebrow'], ['.adm-head .adm-h1', '[data-cy="page-title"]'], ['.adm-head > p.muted', '.admin-draws__lead']]]
  },
  { name: 'admin-qualification', mockup: 'admin-qualification.html', path: '/admin/phase-finale/qualification', role: 'admin', pairs: [phaseHead('admin-qualification')] },
  { name: 'admin-tirage-tour', mockup: 'admin-tirage-tour.html', path: '/admin/phase-finale/tirage', role: 'admin', pairs: [phaseHead('admin-round-draw')] },
  { name: 'admin-cloture', mockup: 'admin-cloture.html', path: '/admin/phase-finale/cloture', role: 'admin', pairs: [phaseHead('admin-closing')] },
  { name: 'admin-plus', mockup: 'admin-plus.html', path: '/admin/plus', role: 'admin' },
  {
    name: 'admin-editions',
    mockup: 'admin-editions.html',
    path: '/admin/editions',
    role: 'admin',
    mockupHash: 'ed-p-list',
    pairs: [[['#ed-p-list .ed-bar', '.editions-toolbar'], ['#ed-p-list .table-wrap', '[data-cy="editions-table"]'], ['#ed-p-list .ed-note', '[data-cy="editions-note"]']]]
  },
  { name: 'admin-edition-nouvelle', mockup: 'admin-editions.html', path: '/admin/editions/nouvelle', role: 'admin', mockupHash: 'ed-p-new', mockupCss: '#ed-p-new .ed-done, #ed-p-new .alert--error { display: none !important; }' },
  { name: 'admin-edition-2026', mockup: 'admin-editions.html', path: '/admin/editions/2026', role: 'admin', mockupHash: 'ed-p-edit', mockupCss: '#ed-p-edit .ed-form--locked { display: none !important; }' },
  { name: 'admin-edition-2025', mockup: 'admin-editions.html', path: '/admin/editions/2025', role: 'admin', mockupHash: 'ed-p-edit', mockupCss: '#ed-p-edit .ed-form:not(.ed-form--locked), .ed-form--locked > .alert--error { display: none !important; }' },
  { name: 'admin-competiteur', mockup: 'admin-editions.html', path: '/admin/competiteurs/{competitor}', role: 'admin', mockupHash: 'ed-p-comp', mockupCss: '#ed-p-comp .cp-photo .alert { display: none !important; }' }
]

/** Rapport Markdown, hors dépôt par défaut ; instantané versionné par `SPACING_MOCKUP_AUDIT_OUT`. */
export const SPACING_MOCKUP_DEFAULT_OUT = 'test-results/spacing-mockup-audit.md'
