import type { IOrigamTheme } from 'origam/interfaces'

/*********************************************************
 * CCC — thème « Au bord de la mer » (décision utilisateur 2026-11-08, remplace « Happy Hour »)
 *
 * @description
 * L'affiche du festival de bières de Cherbourg : bleu pétrole profond du fond, or chaud
 * des lettres, crème de la mousse. Mode SOMBRE uniquement : même raison que le HH, l'or
 * et la crème perdraient leur rôle de lumière en mode clair. Voir notes dans mapping.md.
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
 *     token) : Elyseranet/origam#1266 ;
 *   - `.origam-field.origam-field.origam-field input` (retrait de 2 px de l'`<input>`, jamais remis à zéro) :
 *     Elyseranet/origam#1280 ;
 *   - `.origam-card > .origam-card__overlay.origam-card__overlay` (overlay des cartes cliquables écrasé par la règle
 *     `> *` d'Origam, carte noire au repos) : Elyseranet/origam#1276 ;
 *   - les 6 règles `.origam-pagination.origam-pagination.origam-pagination …` (pagination de l'annuaire : flèches
 *     masquées, liste qui passe à la ligne, couleurs des pages, dont un `!important` imposé par la règle à identifiant
 *     qu'Origam injecte sur chaque bouton) : Elyseranet/origam#1278 (remédiation : docs/tickets/F-04-PAG.md).
 ********************************************************/

export const CCC_HH_BASE: IOrigamTheme = {
  name: 'ccc',
  label: 'CCC · Au bord de la mer',
  description: 'Bleu pétrole, or chaud et crème de la mousse.',
  swatch: 'linear-gradient(135deg, #112631 45%, #c17825 45% 70%, #f3eedd 70%)',

  // ── 1) PROPS D'ABORD ────────────────────────────────────────────
  components: {
    // Contournement Origam #1227 : `components.global.density` (valeur par défaut du DS) retiré ; il déclenchait un avertissement `density` sur chaque composant.

    // Actions : défaut texte neutre ; CTA = `variant="flat" color="primary"` (or + extrusion ambre via elevation).
    'origam-btn': {
      variant: 'text',
      size: 'large',
      rounded: 'full',
      elevation: 'none',
      fontWeight: 'bold',
      letterSpacing: 'normal',
      lineHeight: 'normal'
    },
    'origam-btn-group': { rounded: 'full' },

    // Surfaces
    'origam-card': { rounded: 'xl', border: true, borderColor: 'var(--origam-color__border---default)', elevation: 'md', density: 'comfortable' },
    'origam-sheet': { rounded: 'xl', border: true, elevation: 'md' },
    'origam-dialog': { rounded: 'xl', elevation: 'xl', scrim: true, maxWidth: 560 },
    'origam-drawer': { elevation: 'none', border: true },
    'origam-toolbar': { flat: true, density: 'default', elevation: 'none' },
    'origam-bottom-nav': { elevation: 'lg', grow: true },

    // Données
    'origam-chip': {
      size: 'small',
      pill: true,
      border: false,
      fontWeight: 'bold',
      color: 'var(--origam-color__text---secondary)',
      bgColor: 'var(--origam-color__surface---overlay)'
    },
    'origam-chip-group': { column: false },
    'origam-badge': { rounded: 'full', inline: true },
    'origam-tabs': { variant: 'pills', rounded: 'full', density: 'default', color: 'secondary' },
    'origam-tab': { fontWeight: 'bold' },
    'origam-table': {
      border: true,
      borderColor: 'var(--origam-color__border---default)',
      rounded: 'lg',
      density: 'default',
      hover: true,
      elevation: 'none'
    },
    'origam-data-table': {
      density: 'default',
      hover: true,
      rounded: 'lg',
      border: true,
      borderColor: 'var(--origam-color__border---default)'
    },
    'origam-list': { density: 'comfortable', rounded: 'lg', slim: false },
    'origam-list-item': { rounded: 'lg' },
    'origam-data-list': { density: 'compact', rounded: 'lg', border: true },
    'origam-bracket': {
      variant: 'single-elimination',
      color: 'primary',
      density: 'compact',
      showScores: true,
      showSeed: false,
      showRoundTitles: true,
      elevation: 'md'
    },
    'origam-stepper': { orientation: 'vertical', showConnectors: true, clickable: false, rounded: 'lg' },
    'origam-pagination': {
      density: 'default',
      size: 'large',
      color: 'primary',
      bgColor: 'primary',
      showFirstLastPage: false
    },
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
    // Légende visible (F-03b) : titre de tableau de la maquette (`.table caption`), taille « lg », texte primaire (la graisse 700 n'a pas de variable : Elyseranet/origam#1283).
    '--origam-table__caption---padding': 'var(--origam-space---4) var(--origam-space---5) var(--origam-space---2)',
    '--origam-table__caption---font-size': 'var(--origam-font__size---lg)',
    '--origam-table__caption---color': 'var(--origam-color__text---primary)',
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
    '--origam-field---padding-start': 'calc(var(--origam-space---5) + var(--origam-border__width---thin))',
    '--origam-field---padding-end': 'calc(var(--origam-space---5) + var(--origam-border__width---thin))',
    // Texte des champs (F-15) : interligne du texte courant (1,55, comme la maquette ; Origam met 1,5) interlettrage normal (Origam met 0,009375 em) et opacité pleine du conteneur de saisie (Origam met 0,7, ce qui assombrit la valeur et le placeholder).
    '--origam-input---line-height': 'var(--origam-font__lineHeight---normal)',
    '--origam-field---letter-spacing': 'normal',
    '--origam-field__input---opacity': '1',
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
    // Pagination (F-04-PAG) : page courante en or plein, les autres en texte secondaire.
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
        xs: '0.8rem',
        sm: '0.8rem',
        md: '1rem',
        lg: '1.25rem',
        xl: '1.5625rem',
        '2xl': '1.953rem',
        '3xl': 'clamp(1.953rem, 3.2vw, 2.441rem)',
        '4xl': 'clamp(2.441rem, 5.4vw, 3.815rem)',
        '5xl': 'clamp(3.815rem, 9vw, 7.451rem)'
      },
      weight: { regular: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800 },
      lineHeight: { none: 0.88, tight: 1.08, snug: 1.3, normal: 1.55, relaxed: 1.7, loose: 2 },
      letterSpacing: { tight: '-0.02em', normal: '0em', wide: '0.02em', wider: '0.08em', widest: '0.16em' }
    },
    spacing: { '11': '44px' },
    motion: {
      // Courbes exponentielles uniquement, aucun rebond ni élastique (aucune valeur > 1).
      duration: { instant: '0ms', fast: '120ms', normal: '200ms', medium: '320ms', slow: '600ms', xslow: '900ms' },
      easing: {
        standard: 'cubic-bezier(0.25, 1, 0.5, 1)' /* ease-out-quart */,
        decelerate: 'cubic-bezier(0.16, 1, 0.3, 1)' /* ease-out-expo */,
        accelerate: 'cubic-bezier(0.5, 0, 0.75, 0)' /* ease-in-quart */,
        sharp: 'cubic-bezier(0.83, 0, 0.17, 1)' /* ease-in-out-quint */,
        linear: 'linear'
      }
    }
  }
}

export const CCC_HH_DARK: IOrigamTheme = {
  name: 'ccc',
  mode: 'dark',
  vars: {
    color: {
      surface: { default: '#112631', raised: '#1c3745', overlay: '#284758', sunken: '#0a1b24', disabled: '#2a404b' },
      text: {
        primary: '#f3eedd',   // mousse — 10.75:1 sur raised
        secondary: '#a9c3d1', // mer claire — 5.35:1 sur overlay
        tertiary: '#98b4c3',  // 5.74:1 sur raised
        disabled: '#537c93',
        inverse: '#0e242f',
        onColor: '#0e242f',
        ink: '#f3eedd'
      },
      action: {
        // Or = action. Encre pétrole dessus : 7.87:1.
        primary: {
          bg: '#e2ac65',
          bgHover: '#e7b16a',
          bgActive: '#e2ac65',
          bgDisabled: '#284758',
          bgSubtle: 'rgba(226, 172, 101, 0.14)',
          fg: '#0e242f',
          fgDisabled: '#537c93',
          fgSubtle: '#e2ac65'
        },
        // Crème = accent éditorial (chips, onglet actif). Encre dessus : 13.78:1.
        secondary: {
          bg: '#f3eedd',
          bgHover: '#f8f6ec',
          bgActive: '#f3eedd',
          bgDisabled: '#284758',
          bgSubtle: 'rgba(243, 238, 221, 0.16)',
          fg: '#0e242f',
          fgDisabled: '#537c93',
          fgSubtle: '#f3eedd'
        },
        ghost: {
          bg: 'rgba(243, 238, 221, 0)',
          bgHover: 'rgba(243, 238, 221, 0.08)',
          bgDisabled: 'rgba(0, 0, 0, 0)',
          fg: '#f3eedd',
          fgDisabled: '#537c93'
        }
      },
      border: {
        // Cible 3:1 (WCAG 1.4.11) : 3.97:1 sur sunken, 3.17:1 sur raised — corrige le M1 de T-A11Y-01 (le HH ne faisait 1,3–1,4:1).
        default: 'rgba(131, 166, 185, 0.7)',
        subtle: 'rgba(131, 166, 185, 0.3)',
        strong: 'rgba(131, 166, 185, 1)',
        focus: '#3ec8da'
      },
      // `bgHover` et `bgActive` = `bg` : `origam-alert` est « survolée » (`hover` vrai par défaut) et « active » (sa visibilité sert d'état actif) sans aucune
      // interaction ; le fond au repos est donc celui de ces jetons, qui retombaient sur un `color-mix` du jeton ou sur un noir à 30 % avec un texte
      // basculé en blanc. Défaut Origam : docs/tickets/origam/alert-etat-survol-au-repos.md (Elyseranet/origam#1307).
      feedback: {
        success: {
          bg: '#41c89b',
          bgHover: '#41c89b',
          bgActive: '#41c89b',
          bgSubtle: 'rgba(65, 200, 155, 0.14)',
          fg: '#0e242f',
          fgSubtle: '#41c89b',
          border: '#41c89b'
        },
        warning: {
          bg: '#e2ac65',
          bgHover: '#e2ac65',
          bgActive: '#e2ac65',
          bgSubtle: 'rgba(226, 172, 101, 0.14)',
          fg: '#0e242f',
          fgSubtle: '#e2ac65',
          border: '#e2ac65'
        },
        danger: {
          bg: '#e78474',
          bgHover: '#e78474',
          bgActive: '#e78474',
          bgSubtle: 'rgba(231, 132, 116, 0.14)',
          fg: '#0e242f',
          fgSubtle: '#e78474',
          border: '#e78474'
        },
        info: {
          bg: '#62b4da',
          bgHover: '#62b4da',
          bgActive: '#62b4da',
          bgSubtle: 'rgba(98, 180, 218, 0.14)',
          fg: '#0e242f',
          fgSubtle: '#62b4da',
          border: '#62b4da'
        }
      },
      // Couleurs d'univers (décor : pinte, halos, or des titres). Pas de rôle sémantique dans le DS.
      bar: { foam: '#f3eedd', amber: '#e2ac65', neon: '#c17825', ice: '#92c5dd', night: '#0b1e28', glow: '#2a576f' }
    },
    shadow: {
      none: 'none',
      xs: '0 1px 0 rgba(243, 238, 221, 0.06) inset',
      sm: '0 1px 0 rgba(243, 238, 221, 0.06) inset, 0 8px 20px -10px rgba(2, 10, 14, 0.8)',
      md: '0 1px 0 rgba(243, 238, 221, 0.08) inset, 0 24px 48px -24px rgba(2, 10, 14, 0.9)',
      // Extrusion ambre décalée : l'élévation des actions (lettrage rétro).
      lg: '0 6px 0 #855123',
      xl: '0 10px 0 #855123, 0 24px 48px -12px rgba(226, 172, 101, 0.45)'
    }
  }
}

export const CCC_HH_THEMES: IOrigamTheme[] = [ CCC_HH_BASE, CCC_HH_DARK ]
