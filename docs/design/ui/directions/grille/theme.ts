import type { IOrigamTheme } from 'origam/interfaces'

/*********************************************************
 * Direction C — « Grille »
 *
 * @description
 * Éditorial suisse, façon fiche pilote : papier blanc, encre, colonnes visibles en
 * pointillés, chiffres géants en graisse régulière contre libellés mono capitales,
 * un seul accent bleu électrique. Les données SONT la décoration : compteurs animés
 * en CSS (@property), barres de parcours, lignes de grille qui se tracent.
 * Références : NOX Grid, F1 Driver Profile (vue sur la fiche Slam Dunk), Axle Journey.
 *
 * @description
 * Aucun slot de police détourné : Inter Tight (sans) + JetBrains Mono (mono).
 ********************************************************/

export const CCC_GRILLE_BASE: IOrigamTheme = {
  name: 'ccc',
  label: 'CCC · Grille',
  description: 'Éditorial suisse : grille visible, chiffres géants, un accent bleu.',
  swatch: 'linear-gradient(135deg, #fafaf8 50%, #1f3bff 50%)',

  // ── 1) PROPS D'ABORD ────────────────────────────────────────────
  components: {
    global: { density: 'compact' },
    'origam-btn': { variant: 'text', size: 'default', rounded: 'none', elevation: 'none', fontWeight: 'medium' },
    'origam-card': { rounded: 'none', border: true, elevation: 'none', flat: true, density: 'default' },
    'origam-sheet': { rounded: 'none', border: true, elevation: 'none' },
    'origam-chip': { size: 'small', pill: false, label: true, border: true, fontFamily: 'mono', textTransform: 'uppercase', letterSpacing: 'wider' },
    'origam-title': { fontFamily: 'sans', fontWeight: 'medium', letterSpacing: 'tight', lineHeight: 'none' },
    'origam-tabs': { variant: 'underline', density: 'compact', color: 'primary', rounded: 'none' },
    'origam-tab': { fontWeight: 'medium', letterSpacing: 'normal' },
    'origam-table': { border: true, rounded: 'none', density: 'compact', hover: true, elevation: 'none', fixedHeader: true },
    'origam-data-table': { density: 'compact', hover: true },
    'origam-bracket': { variant: 'single-elimination', color: 'primary', density: 'compact', showScores: true, showSeed: true, showRoundTitles: true, elevation: 'none' },
    'origam-toolbar': { density: 'compact', flat: true, elevation: 'none', border: true },
    'origam-avatar': { rounded: 'none', size: 'x-large' },
    'origam-text-field': { variant: 'underlined', rounded: 'none', density: 'compact' },
    'origam-select': { variant: 'underlined', rounded: 'none', density: 'compact' },
    'origam-empty-state': { size: 'md', align: 'left' }
  },

  // ── 2) TOKENS SÉMANTIQUES (communs) ────────────────────────────
  vars: {
    rounded: { none: '0px', xs: '0px', sm: '2px', md: '2px', lg: '4px', xl: '6px', '2xl': '8px', full: '9999px' },
    typo: {
      family: {
        sans: "'Inter Tight', 'Inter', 'Helvetica Neue', Arial, sans-serif",
        mono: "'JetBrains Mono', 'Fira Code', monospace"
      },
      size: {
        xs: '0.75rem', sm: '0.8125rem', md: '0.9375rem', lg: '1.0625rem', xl: '1.375rem',
        '2xl': '2rem', '3xl': 'clamp(2.25rem, 4.5vw, 3.5rem)', '4xl': 'clamp(3.5rem, 9vw, 8rem)', '5xl': 'clamp(4rem, 13vw, 12.5rem)'
      },
      weight: { regular: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800 },
      lineHeight: { none: 0.85, tight: 1.05, snug: 1.25, normal: 1.5, relaxed: 1.65, loose: 2 },
      letterSpacing: { tight: '-0.05em', normal: '-0.01em', wide: '0.02em', wider: '0.12em', widest: '0.24em' }
    },
    border: { width: { '0': '0px', thin: '1px', '2': '2px', '4': '4px' }, style: { solid: 'solid', dashed: 'dashed', dotted: 'dotted' } },
    spacing: { '11': '44px' },
    motion: {
      duration: { instant: '0ms', fast: '120ms', normal: '200ms', medium: '400ms', slow: '900ms', xslow: '1400ms' },
      easing: { standard: 'cubic-bezier(0.65, 0, 0.35, 1)', decelerate: 'cubic-bezier(0.22, 1, 0.36, 1)' }
    }
  }
}

export const CCC_GRILLE_LIGHT: IOrigamTheme = {
  name: 'ccc',
  mode: 'light',
  vars: {
    color: {
      surface: { default: '#fafaf8', raised: '#ffffff', overlay: '#ffffff', sunken: '#f0f0ec', disabled: '#ecece8' },
      text: {
        primary: '#0a0a0a',   // 18.94:1
        secondary: '#55554f', // 7.18:1
        tertiary: '#6b6b64',  // 5.14:1
        disabled: '#b4b4ad',
        inverse: '#fafaf8',
        onColor: '#ffffff',
        ink: '#0a0a0a'
      },
      action: {
        primary: { bg: '#1f3bff', bgHover: '#0f2be6', bgDisabled: '#ecece8', bgSubtle: 'rgba(31, 59, 255, 0.07)', fg: '#ffffff', fgDisabled: '#b4b4ad', fgSubtle: '#1f3bff' },
        secondary: { bg: '#0a0a0a', bgHover: '#262626', bgDisabled: '#ecece8', fg: '#fafaf8', fgDisabled: '#b4b4ad' },
        ghost: { bg: 'rgba(0, 0, 0, 0)', bgHover: 'rgba(10, 10, 10, 0.05)', bgDisabled: 'rgba(0, 0, 0, 0)', fg: '#0a0a0a', fgDisabled: '#b4b4ad' }
      },
      border: { default: 'rgba(10, 10, 10, 0.14)', subtle: 'rgba(10, 10, 10, 0.07)', strong: '#0a0a0a', focus: '#1f3bff' },
      feedback: {
        success: { bg: '#0f7a3f', bgSubtle: 'rgba(15, 122, 63, 0.08)', fg: '#ffffff', fgSubtle: '#0d6a37', border: '#0f7a3f' },
        warning: { bg: '#a15c00', bgSubtle: 'rgba(161, 92, 0, 0.08)', fg: '#ffffff', fgSubtle: '#8a4f00', border: '#a15c00' },
        danger: { bg: '#d0261b', bgSubtle: 'rgba(208, 38, 27, 0.08)', fg: '#ffffff', fgSubtle: '#b31f16', border: '#d0261b' },
        info: { bg: '#1f3bff', bgSubtle: 'rgba(31, 59, 255, 0.07)', fg: '#ffffff', fgSubtle: '#1f3bff', border: '#1f3bff' }
      }
    },
    shadow: { none: 'none', xs: '0 1px 0 rgba(10, 10, 10, 0.08)', sm: '0 1px 0 rgba(10, 10, 10, 0.12)', md: '0 0 0 1px #0a0a0a', lg: '4px 4px 0 #0a0a0a', xl: '6px 6px 0 #1f3bff' }
  }
}

export const CCC_GRILLE_DARK: IOrigamTheme = {
  name: 'ccc',
  mode: 'dark',
  vars: {
    color: {
      surface: { default: '#0b0b0b', raised: '#141414', overlay: '#1b1b1b', sunken: '#050505', disabled: '#1b1b1b' },
      text: {
        primary: '#edede8',   // 16.76:1
        secondary: '#a3a39c', // 7.76:1
        tertiary: '#8f8f88',  // 5.66:1 sur raised
        disabled: '#4a4a46',
        inverse: '#0b0b0b',
        onColor: '#0b0b0b',
        ink: '#edede8'
      },
      action: {
        primary: { bg: '#7d8cff', bgHover: '#97a3ff', bgDisabled: '#1b1b1b', bgSubtle: 'rgba(125, 140, 255, 0.10)', fg: '#0b0b0b', fgDisabled: '#4a4a46', fgSubtle: '#97a3ff' },
        secondary: { bg: '#edede8', bgHover: '#ffffff', bgDisabled: '#1b1b1b', fg: '#0b0b0b', fgDisabled: '#4a4a46' },
        ghost: { bg: 'rgba(0, 0, 0, 0)', bgHover: 'rgba(237, 237, 232, 0.06)', bgDisabled: 'rgba(0, 0, 0, 0)', fg: '#edede8', fgDisabled: '#4a4a46' }
      },
      border: { default: 'rgba(237, 237, 232, 0.14)', subtle: 'rgba(237, 237, 232, 0.07)', strong: '#edede8', focus: '#97a3ff' },
      feedback: {
        success: { bg: '#4ade80', bgSubtle: 'rgba(74, 222, 128, 0.10)', fg: '#06210f', fgSubtle: '#4ade80', border: '#4ade80' },
        warning: { bg: '#f0b44c', bgSubtle: 'rgba(240, 180, 76, 0.10)', fg: '#231500', fgSubtle: '#f0b44c', border: '#f0b44c' },
        danger: { bg: '#ff6b5e', bgSubtle: 'rgba(255, 107, 94, 0.10)', fg: '#2b0704', fgSubtle: '#ff8a80', border: '#ff6b5e' },
        info: { bg: '#7d8cff', bgSubtle: 'rgba(125, 140, 255, 0.10)', fg: '#0b0b0b', fgSubtle: '#97a3ff', border: '#7d8cff' }
      }
    },
    shadow: { none: 'none', xs: '0 1px 0 rgba(237, 237, 232, 0.06)', sm: '0 1px 0 rgba(237, 237, 232, 0.10)', md: '0 0 0 1px #edede8', lg: '4px 4px 0 #edede8', xl: '6px 6px 0 #7d8cff' }
  }
}

export const CCC_GRILLE_THEMES: IOrigamTheme[] = [CCC_GRILLE_BASE, CCC_GRILLE_LIGHT, CCC_GRILLE_DARK]
