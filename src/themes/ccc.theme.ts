import type { IOrigamTheme } from 'origam/interfaces'

/*********************************************************
 * CCC — thème « Happy Hour » (direction retenue le 2026-10-20)
 *
 * @description
 * La soirée au bar : nuit violette, néon rose, ambre de la bière, crème de la mousse.
 * Mode SOMBRE uniquement. Un mode clair n'a pas été retenu : sur fond crème, le néon
 * rose et l'ambre perdent leur rôle de lumière et l'univers « soirée » disparaît.
 * Voir notes dans mapping.md.
 *
 * @description
 * Découpage conforme à `activeDefaultsFor` (origam.ts) :
 *   - CCC_HH_BASE : name sans mode → props `components` + tokens non colorés.
 *   - CCC_HH_DARK : couleurs + ombres (seul mode livré).
 *
 * @description
 * EXCEPTION PROPS-FIRST (décision utilisateur 2026-10-20, docs/design/ux/decisions.md) :
 * la police display Bagel Fat One est appliquée par une CLASSE CSS LOCALE (`.font-display`)
 * car `fontFamily` (TFontFamily) n'accepte que sans | serif | mono. Rien d'autre ne sort
 * des props et des tokens. Suivi DS : Elyseranet/origam#1212 (slot de police display).
 *
 * @description
 * Contournements Origam portés par `src/assets/css/main.css` (le CSS ne prend pas de commentaire) ; chacun se
 * retire quand le défaut suivi est corrigé dans Origam (docs/tickets/origam/INDEX.md) :
 *   - `:where(.origam-tab__label)` (interligne des onglets) : Elyseranet/origam#1252 ;
 *   - `.origam-field.origam-field.origam-field` (corner-clearance des champs pilule) : Elyseranet/origam#1254 ;
 *   - `.origam-btn.origam-btn--variant-outlined.origam-btn--size-x-large` (filet compté dans le padding) :
 *     Elyseranet/origam#1261 ;
 *   - `.origam-table .origam-table__wrapper.origam-table__wrapper td` (séparateur de ligne en haut) :
 *     Elyseranet/origam#1262 ;
 *   - `.origam-breadcrumb .origam-breadcrumb__items.origam-breadcrumb__items` (interligne du fil d'Ariane,
 *     `line-height: 1.6` en dur) : Elyseranet/origam#1265 ;
 *   - `.origam-field.origam-field.origam-field.origam-field input::placeholder` (couleur du placeholder, sans
 *     token) : Elyseranet/origam#1266.
 ********************************************************/

export const CCC_HH_BASE: IOrigamTheme = {
  name: 'ccc',
  label: 'CCC · Happy Hour',
  description: 'Nuit violette, néon rose, ambre bière et mousse.',
  swatch: 'linear-gradient(135deg, #160b2e 45%, #ff3d9a 45% 70%, #ffb21a 70%)',

  // ── 1) PROPS D'ABORD ────────────────────────────────────────────
  components: {
    // Contournement Origam #1227 : `components.global.density` (valeur par défaut du DS) retiré ; il déclenchait un avertissement `density` sur chaque composant.

    // Actions : défaut texte neutre ; CTA = `variant="flat" color="primary"` (ambre + ombre néon via elevation).
    'origam-btn': { variant: 'text', size: 'large', rounded: 'full', elevation: 'none', fontWeight: 'bold', letterSpacing: 'normal', lineHeight: 'normal' },
    'origam-btn-group': { rounded: 'full' },

    // Surfaces
    'origam-card': { rounded: 'xl', border: true, elevation: 'md', density: 'comfortable' },
    'origam-sheet': { rounded: 'xl', border: true, elevation: 'md' },
    'origam-dialog': { rounded: 'xl', elevation: 'xl', scrim: true, maxWidth: 560 },
    'origam-drawer': { elevation: 'none', border: true },
    'origam-toolbar': { flat: true, density: 'default', elevation: 'none' },
    'origam-bottom-nav': { elevation: 'lg', grow: true },

    // Données
    'origam-chip': { size: 'small', pill: true, border: false, fontWeight: 'bold', color: 'var(--origam-color__text---secondary)', bgColor: 'var(--origam-color__surface---overlay)' },
    'origam-chip-group': { column: false },
    'origam-badge': { rounded: 'full', inline: true },
    'origam-tabs': { variant: 'pills', rounded: 'full', density: 'default', color: 'secondary' },
    'origam-tab': { fontWeight: 'bold' },
    'origam-table': { border: true, borderColor: 'var(--origam-color__border---default)', rounded: 'lg', density: 'default', hover: true, elevation: 'none' },
    'origam-data-table': { density: 'default', hover: true, rounded: 'lg', border: true, borderColor: 'var(--origam-color__border---default)' },
    'origam-list': { density: 'comfortable', rounded: 'lg', slim: false },
    'origam-list-item': { rounded: 'lg' },
    'origam-data-list': { density: 'compact', rounded: 'lg', border: true },
    'origam-bracket': { variant: 'single-elimination', color: 'primary', density: 'compact', showScores: true, showSeed: false, showRoundTitles: true, elevation: 'md' },
    'origam-stepper': { orientation: 'vertical', showConnectors: true, clickable: false, rounded: 'lg' },
    'origam-pagination': { density: 'default', size: 'large', color: 'primary', bgColor: 'primary', showFirstLastPage: false },
    'origam-breadcrumb': { density: 'compact', divider: '›' },
    'origam-avatar': { rounded: 'full', size: 'default' },
    'origam-empty-state': { size: 'lg', align: 'center' },
    'origam-chart': { rounded: 'lg', showGrid: true, showLegend: true, showTooltip: true, animated: false },

    // Saisie
    'origam-text-field': { variant: 'outlined', rounded: 'full', density: 'default' },
    'origam-select': { variant: 'outlined', rounded: 'full', density: 'default' },
    'origam-number-field': { variant: 'outlined', rounded: 'lg', density: 'default', hideSpinButtons: false },
    'origam-date-picker-field': { variant: 'outlined', rounded: 'full', density: 'default' },
    'origam-textarea-field': { variant: 'outlined', rounded: 'lg', density: 'default' },
    'origam-file-field': { variant: 'outlined', rounded: 'full', density: 'default' },
    'origam-password-field': { variant: 'outlined', rounded: 'full', density: 'default' }
  },

  // Échappement `cssVars` : Origam décale le libellé d'un bouton de `--origam-btn---text-indent` (0,16 em, pour centrer un
  // texte à interlettrage large). Les boutons du Happy Hour ont un interlettrage normal : l'indentation est donc nulle.
  // Tableaux (F-00g) : ni une prop ni un token sémantique n'expriment ces valeurs ; chaque entrée pointe vers un token existant.
  cssVars: {
    '--origam-btn---text-indent': '0',
    // Fond de la table : surface.raised (le défaut du DS est surface.default).
    '--origam-table---background-color': 'var(--origam-color__surface---raised)',
    '--origam-data-table---background-color': 'var(--origam-color__surface---raised)',
    // Texte des tableaux : taille « sm » (12,8 px) comme la maquette.
    '--origam-table---font-size': 'var(--origam-font__size---sm)',
    // En-têtes : 700, tertiaire, filet de 1 px, sans fond propre. Densité « default » (props) = cellules de 12 px / 16 px.
    '--origam-table__header-cell---font-weight': 'var(--origam-font__weight---bold)',
    '--origam-table__header-cell---color': 'var(--origam-color__text---tertiary)',
    '--origam-table__header-cell---background-color': 'transparent',
    '--origam-table__header-cell---border-bottom-width': 'var(--origam-border__width---thin)',
    '--origam-data-table-header-cell---color': 'var(--origam-color__text---tertiary)',
    '--origam-data-table-header-cell---background': 'transparent',
    // Lignes : transparentes sur la surface de la table ; survol = fantôme du thème.
    '--origam-data-table-row---background-color': 'transparent',
    '--origam-data-table-row--hover---background-color': 'var(--origam-color__action--ghost---bgHover)',
    // Onglets en pilule (F-00l) : ni une prop ni un token sémantique n'expriment ces valeurs ; l'onglet actif du DS est
    // `action.primary` en dur, la maquette le veut en `action.secondary`. Chaque entrée pointe vers un token existant.
    // Les deux cssVars `--origam-tabs__item--pills--active---*` contournent Elyseranet/origam#1253 (prop color ignorée sur
    // l'onglet actif en pilule) : à retirer quand Origam honore `color`.
    '--origam-tabs---border-width': 'var(--origam-border__width---thin)',
    '--origam-tabs---border-color': 'var(--origam-color__border---default)',
    '--origam-tabs---border-radius': 'var(--origam-radius---full)',
    '--origam-tabs--pills---background-color': 'var(--origam-color__surface---sunken)',
    '--origam-tabs--pills---gap': 'var(--origam-space---1)',
    '--origam-tabs--pills---padding': 'var(--origam-space---1)',
    '--origam-tabs__item---height': 'var(--origam-space---11)',
    '--origam-tabs__item---padding-inline': 'var(--origam-space---5)',
    '--origam-tabs__item---border-radius': 'var(--origam-radius---full)',
    '--origam-tabs__item---font-size': 'var(--origam-font__size---md)',
    '--origam-tabs__item---letter-spacing': 'normal',
    '--origam-tabs__item---color': 'var(--origam-color__text---secondary)',
    '--origam-tabs__item--hover---color': 'var(--origam-color__text---primary)',
    '--origam-tabs__item--hover---background-color': 'transparent',
    '--origam-tabs__item--active---font-weight': 'var(--origam-font__weight---bold)',
    '--origam-tabs__item--pills--active---color': 'var(--origam-color__action--secondary---fg)',
    '--origam-tabs__item--pills--active---background-color': 'var(--origam-color__action--secondary---bg)',
    // Fil d'Ariane (F-00p) : séparateur › via la prop `divider` du thème ; liens text.secondary soulignés, séparateur › en text.tertiary, page courante
    // en text.tertiary sans soulignement (règle `.origam-breadcrumb-item--disabled` de main.css). Chaque entrée pointe vers un token existant.
    // Le séparateur d'Origam porte déjà 8 px de chaque côté : la maquette (8 px entre l'élément et le séparateur, 8 px après) n'en veut pas de plus.
    '--origam-breadcrumb---gap': '0px',
    '--origam-breadcrumb-item---color': 'var(--origam-color__text---secondary)',
    '--origam-breadcrumb-item---text-decoration': 'underline',
    '--origam-breadcrumb-item---opacity-disabled': '1',
    '--origam-breadcrumb-divider---color': 'var(--origam-color__text---tertiary)',
    '--origam-breadcrumb-divider---opacity': '1',
    // Champs (F-00m) : hauteur 48 px (le défaut « default » d'Origam vaut 36 px), retrait du texte 20 px.
    '--origam-input__control---height-md': 'var(--origam-space---12)',
    '--origam-field---padding-start': 'var(--origam-space---5)',
    '--origam-field---padding-end': 'var(--origam-space---5)',
    // Champs outlined : fond surface.sunken, filet 1 px border.default, sans atténuation d'opacité.
    '--origam-field---background-color': 'var(--origam-color__surface---sunken)',
    '--origam-field---border-color': 'var(--origam-color__border---default)',
    '--origam-field---focus-ring-width': 'calc(var(--origam-border__width---2) + var(--origam-border__width---thin))',
    '--origam-field---focus-ring-offset': 'var(--origam-border__width---2)',
    '--origam-field---focus-ring-color': 'var(--origam-color__border---focus)',
    '--origam-field---border-opacity-outlined': '1',
    // Valeur choisie d'un select : text.primary (le défaut d'Origam est text.secondary).
    '--origam-select__selection---color': 'var(--origam-color__text---primary)',
    '--origam-field---border-width-outlined': 'var(--origam-border__width---thin)',
    // Boutons « x-large » (F-00m, appels à l'action des formulaires) : 48 px de haut (défaut Origam : 52 px) ; outlined : filet strong de 2 px.
    '--origam-btn---height-xl': 'var(--origam-space---12)',
    '--origam-btn---border-color': 'var(--origam-color__border---strong)',
    '--origam-btn---border-width-outlined': 'var(--origam-border__width---2)',
    // Pastilles (F-00q) : la maquette donne 4 px / 12 px de padding et une interligne de 1,3 (snug) pour du texte xs, soit 24,64 px de haut ; Origam fixe line-height: 1 et mesure la hauteur en content-box (`size` small : 24 px, padding 0 10 px).
    '--origam-chip---height-sm': 'calc(var(--origam-font__size---xs) * var(--origam-font__lineHeight---snug) + 2 * var(--origam-space---1))',
    '--origam-chip---padding-sm': 'var(--origam-space---3)',
    // Pagination (F-04-PAG) : page courante en ambre plein, les autres en texte secondaire.
    '--origam-pagination--primary---background-color': 'transparent',
    '--origam-pagination--primary---color': 'var(--origam-color__text---secondary)',
    '--origam-pagination---background-color-hover': 'var(--origam-color__action--ghost---bgHover)',
    '--origam-pagination__item--is-active---background-color': 'var(--origam-color__action--primary---bg)',
    '--origam-pagination__item--is-active---color': 'var(--origam-color__action--primary---fg)'
  },

  // ── 2) TOKENS SÉMANTIQUES (communs) ────────────────────────────
  vars: {
    rounded: { none: '0px', xs: '6px', sm: '10px', md: '14px', lg: '20px', xl: '28px', '2xl': '40px', full: '9999px' },
    typo: {
      // `display` n'est PAS lu par les props (TFontFamily) : il alimente la classe locale .font-display (exception).
      family: {
        // Gabarito : grotesque géométrique au dessin rond et un peu farceur (pas une police « système »).
        sans: "'Gabarito', system-ui, sans-serif",
        mono: "'JetBrains Mono', monospace",
        display: "'Bagel Fat One', 'Gabarito', sans-serif"
      },
      // Échelle modulaire 1.25 (tierce majeure) à partir de 16 px. xs = sm : plancher de lisibilité (12,8 px),
      // pour qu'aucun palier ne soit à moins de 1.25 du suivant.
      size: {
        xs: '0.8rem', sm: '0.8rem', md: '1rem', lg: '1.25rem', xl: '1.5625rem',
        '2xl': '1.953rem', '3xl': 'clamp(1.953rem, 3.2vw, 2.441rem)', '4xl': 'clamp(2.441rem, 5.4vw, 3.815rem)', '5xl': 'clamp(3.815rem, 9vw, 7.451rem)'
      },
      weight: { regular: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800 },
      lineHeight: { none: 0.88, tight: 1.08, snug: 1.3, normal: 1.55, relaxed: 1.7, loose: 2 },
      letterSpacing: { tight: '-0.02em', normal: '0em', wide: '0.02em', wider: '0.08em', widest: '0.16em' }
    },
    spacing: { '11': '44px' },
    motion: {
      // Courbes exponentielles uniquement, aucun rebond ni élastique (aucune valeur > 1).
      duration: { instant: '0ms', fast: '120ms', normal: '200ms', medium: '320ms', slow: '600ms', xslow: '900ms' },
      easing: { standard: 'cubic-bezier(0.25, 1, 0.5, 1)' /* ease-out-quart */, decelerate: 'cubic-bezier(0.16, 1, 0.3, 1)' /* ease-out-expo */, accelerate: 'cubic-bezier(0.5, 0, 0.75, 0)' /* ease-in-quart */, sharp: 'cubic-bezier(0.83, 0, 0.17, 1)' /* ease-in-out-quint */, linear: 'linear' }
    }
  }
}

export const CCC_HH_DARK: IOrigamTheme = {
  name: 'ccc',
  mode: 'dark',
  vars: {
    color: {
      surface: { default: '#160b2e', raised: '#22113f', overlay: '#2c1752', sunken: '#0e0620', disabled: '#2c1752' },
      text: {
        primary: '#fff4dc',   // mousse — 15.76:1 sur raised
        secondary: '#c9b8e8', // lilas — 8.51:1 sur overlay
        tertiary: '#a99ad0',  // 6.74:1 sur raised
        disabled: '#6d5f92',
        inverse: '#160b2e',
        onColor: '#160b2e',
        ink: '#fff4dc'
      },
      action: {
        // Ambre = action. Encre de nuit dessus : 10.38:1.
        primary: { bg: '#ffb21a', bgHover: '#ffc24a', bgActive: '#ffb21a', bgDisabled: '#2c1752', bgSubtle: 'rgba(255, 178, 26, 0.14)', fg: '#160b2e', fgDisabled: '#6d5f92', fgSubtle: '#ffb21a' },
        // Néon = accent éditorial (chips, onglet actif, extrusion des titres). 5.69:1 avec la nuit.
        secondary: { bg: '#ff3d9a', bgHover: '#ff5aa8', bgActive: '#ff3d9a', bgDisabled: '#2c1752', bgSubtle: 'rgba(255, 61, 154, 0.16)', fg: '#160b2e', fgDisabled: '#6d5f92', fgSubtle: '#ff5aa8' },
        ghost: { bg: 'rgba(255, 244, 220, 0)', bgHover: 'rgba(255, 244, 220, 0.08)', bgDisabled: 'rgba(0, 0, 0, 0)', fg: '#fff4dc', fgDisabled: '#6d5f92' }
      },
      border: { default: 'rgba(201, 184, 232, 0.18)', subtle: 'rgba(201, 184, 232, 0.09)', strong: 'rgba(201, 184, 232, 0.38)', focus: '#3ee8ff' },
      feedback: {
        success: { bg: '#4ff0a8', bgSubtle: 'rgba(79, 240, 168, 0.14)', fg: '#160b2e', fgSubtle: '#4ff0a8', border: '#4ff0a8' },
        warning: { bg: '#ffb21a', bgSubtle: 'rgba(255, 178, 26, 0.14)', fg: '#160b2e', fgSubtle: '#ffb21a', border: '#ffb21a' },
        danger: { bg: '#ff6b81', bgSubtle: 'rgba(255, 107, 129, 0.14)', fg: '#160b2e', fgSubtle: '#ff6b81', border: '#ff6b81' },
        info: { bg: '#7fd4ff', bgSubtle: 'rgba(127, 212, 255, 0.14)', fg: '#160b2e', fgSubtle: '#7fd4ff', border: '#7fd4ff' }
      },
      // Couleurs d'univers (décor : capsules, pinte, glaçon). Pas de rôle sémantique dans le DS.
      bar: { foam: '#fff4dc', amber: '#ffb21a', neon: '#ff3d9a', ice: '#3ee8ff', night: '#160b2e', glow: '#3a1f66' }
    },
    shadow: {
      none: 'none',
      xs: '0 1px 0 rgba(255, 244, 220, 0.06) inset',
      sm: '0 1px 0 rgba(255, 244, 220, 0.06) inset, 0 8px 20px -10px rgba(5, 2, 12, 0.8)',
      md: '0 1px 0 rgba(255, 244, 220, 0.08) inset, 0 24px 48px -24px rgba(5, 2, 12, 0.9)',
      // Ombre « néon » décalée : l'élévation des actions.
      lg: '0 6px 0 #ff3d9a',
      xl: '0 10px 0 #ff3d9a, 0 24px 48px -12px rgba(255, 61, 154, 0.45)'
    }
  }
}

export const CCC_HH_THEMES: IOrigamTheme[] = [CCC_HH_BASE, CCC_HH_DARK]
