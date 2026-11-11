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
 ********************************************************/

export const CCC_HH_BASE: IOrigamTheme = {
  name: 'ccc',
  label: 'CCC · Au bord de la mer',
  description: 'Bleu pétrole, or chaud et crème de la mousse.',
  swatch: 'linear-gradient(135deg, #112631 45%, #c17825 45% 70%, #f3eedd 70%)',

  // ── 1) PROPS D'ABORD ────────────────────────────────────────────
  components: {
    global: { density: 'default' },

    // Actions : défaut texte neutre. CTA = `variant="flat" bg-color="primary" elevation="lg" :hover="{ elevation: 'xl' }"`, sans `color`
    // (fond or action.primary.bg, texte action.primary.fg, extrusion ambre shadow.lg) ; `size="x-large"` pour les CTA de formulaire (48 px, F-00m).
    'origam-btn': { variant: 'text', size: 'large', rounded: 'full', elevation: 'none', fontWeight: 'bold' },
    'origam-btn-group': { rounded: 'full' },

    // Surfaces
    'origam-card': { rounded: 'xl', border: true, elevation: 'md', density: 'comfortable' },
    'origam-sheet': { rounded: 'xl', border: true, elevation: 'md' },
    'origam-dialog': { rounded: 'xl', elevation: 'xl', scrim: true, maxWidth: 560 },
    'origam-drawer': { elevation: 'none', border: true },
    'origam-toolbar': { flat: true, density: 'default', elevation: 'none' },
    'origam-bottom-nav': { elevation: 'lg', grow: true },

    // Données
    'origam-chip': { size: 'small', pill: true, border: false, fontWeight: 'bold' },
    'origam-chip-group': { column: false },
    'origam-badge': { rounded: 'full', inline: true },
    'origam-tabs': { variant: 'pills', rounded: 'full', density: 'default', color: 'primary' },
    'origam-tab': { fontWeight: 'bold' },
    'origam-table': { border: true, rounded: 'lg', density: 'compact', hover: true, elevation: 'none' },
    'origam-data-table': { density: 'compact', hover: true, rounded: 'lg', border: true },
    'origam-list': { density: 'comfortable', rounded: 'lg', slim: false },
    'origam-list-item': { rounded: 'lg' },
    'origam-data-list': { density: 'compact', rounded: 'lg', border: true },
    'origam-bracket': { variant: 'single-elimination', color: 'primary', density: 'compact', showScores: true, showSeed: false, showRoundTitles: true, elevation: 'md' },
    'origam-stepper': { orientation: 'vertical', showConnectors: true, clickable: false, rounded: 'lg' },
    'origam-pagination': { density: 'compact', showFirstLastPage: false },
    'origam-breadcrumb': { density: 'compact' },
    'origam-avatar': { rounded: 'full', size: 'default' },
    'origam-empty-state': { size: 'lg', align: 'center' },
    'origam-chart': { rounded: 'lg', showGrid: true, showLegend: true, showTooltip: true, animated: false },

    // Saisie
    'origam-text-field': { variant: 'solo', rounded: 'full', density: 'default' },
    'origam-select': { variant: 'solo', rounded: 'full', density: 'default' },
    'origam-number-field': { variant: 'solo', rounded: 'lg', density: 'default', hideSpinButtons: false }
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
        primary: { bg: '#e2ac65', bgHover: '#e7b16a', bgActive: '#e2ac65', bgDisabled: '#284758', bgSubtle: 'rgba(226, 172, 101, 0.14)', fg: '#0e242f', fgDisabled: '#537c93', fgSubtle: '#e2ac65' },
        // Crème = accent éditorial (chips, onglet actif). Encre dessus : 13.78:1.
        secondary: { bg: '#f3eedd', bgHover: '#f8f6ec', bgActive: '#f3eedd', bgDisabled: '#284758', bgSubtle: 'rgba(243, 238, 221, 0.16)', fg: '#0e242f', fgDisabled: '#537c93', fgSubtle: '#f3eedd' },
        ghost: { bg: 'rgba(243, 238, 221, 0)', bgHover: 'rgba(243, 238, 221, 0.08)', bgDisabled: 'rgba(0, 0, 0, 0)', fg: '#f3eedd', fgDisabled: '#537c93' }
      },
      // Cible 3:1 (WCAG 1.4.11) : 3.97:1 sur sunken, 3.17:1 sur raised — corrige le M1 de T-A11Y-01 (le HH ne faisait 1,3–1,4:1).
      border: { default: 'rgba(131, 166, 185, 0.7)', subtle: 'rgba(131, 166, 185, 0.3)', strong: 'rgba(131, 166, 185, 1)', focus: '#3ec8da' },
      // `bgHover` et `bgActive` = `bg` : `origam-alert` est « survolée » et « active » au repos (Elyseranet/origam#1307).
      feedback: {
        success: { bg: '#41c89b', bgHover: '#41c89b', bgActive: '#41c89b', bgSubtle: 'rgba(65, 200, 155, 0.14)', fg: '#0e242f', fgSubtle: '#41c89b', border: '#41c89b' },
        warning: { bg: '#e2ac65', bgHover: '#e2ac65', bgActive: '#e2ac65', bgSubtle: 'rgba(226, 172, 101, 0.14)', fg: '#0e242f', fgSubtle: '#e2ac65', border: '#e2ac65' },
        danger: { bg: '#e78474', bgHover: '#e78474', bgActive: '#e78474', bgSubtle: 'rgba(231, 132, 116, 0.14)', fg: '#0e242f', fgSubtle: '#e78474', border: '#e78474' },
        info: { bg: '#62b4da', bgHover: '#62b4da', bgActive: '#62b4da', bgSubtle: 'rgba(98, 180, 218, 0.14)', fg: '#0e242f', fgSubtle: '#62b4da', border: '#62b4da' }
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

export const CCC_HH_THEMES: IOrigamTheme[] = [CCC_HH_BASE, CCC_HH_DARK]
