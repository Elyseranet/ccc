import type { IOrigamTheme } from 'origam/interfaces'

/*********************************************************
 * Direction B — « Affiche »
 *
 * @description
 * Le CCC comme une marque de sport : grand aplat orange capsule, titres condensés
 * italiques géants, collage de cartes inclinées façon magazine, bandeau défilant des
 * règles d'or, pastilles « sticker ». Encre presque noire, crème, orange, et un bleu
 * électrique en contrepoint. Références : Stridr, Slam Dunk, Bold Studio (notes.md).
 *
 * @description
 * ⚠️ Slot de police : la prop `fontFamily` (TFontFamily) n'accepte que sans | serif | mono.
 * Le condensé d'affichage (Anton) est rangé sous `serif` — arbitrage ouvert (notes.md).
 ********************************************************/

export const CCC_AFFICHE_BASE: IOrigamTheme = {
  name: 'ccc',
  label: 'CCC · Affiche',
  description: 'Orange capsule, condensé italique XXL, collage magazine.',
  swatch: 'linear-gradient(135deg, #ff5a1f 55%, #120a05 55%)',

  // ── 1) PROPS D'ABORD ────────────────────────────────────────────
  components: {
    global: { density: 'default' },
    'origam-btn': { variant: 'flat', size: 'large', rounded: 'full', elevation: 'none', fontWeight: 'bold', letterSpacing: 'wide' },
    'origam-card': { rounded: 'lg', border: false, elevation: 'md', density: 'default' },
    'origam-sheet': { rounded: 'lg', border: false, elevation: 'md' },
    'origam-chip': { size: 'small', pill: true, border: false, fontFamily: 'sans', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 'wide' },
    'origam-title': { fontFamily: 'serif', fontWeight: 'regular', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: 'tight', lineHeight: 'none' },
    'origam-tabs': { variant: 'underline', density: 'default', color: 'primary' },
    'origam-tab': { fontWeight: 'bold', letterSpacing: 'wide' },
    'origam-table': { border: false, rounded: 'lg', density: 'default', hover: true, elevation: 'none' },
    'origam-data-table': { density: 'default', hover: true },
    'origam-bracket': { variant: 'single-elimination', color: 'primary', density: 'default', showScores: true, showSeed: false, showRoundTitles: true, elevation: 'md' },
    'origam-toolbar': { density: 'default', flat: true, elevation: 'none' },
    'origam-avatar': { rounded: 'full', size: 'x-large' },
    'origam-text-field': { variant: 'filled', rounded: 'full', density: 'default' },
    'origam-select': { variant: 'filled', rounded: 'full', density: 'default' },
    'origam-empty-state': { size: 'lg', align: 'left' }
  },

  // `variants` (ADR-005) : `outlined` = bordure épaisse d'encre, en props.
  variants: {
    'origam-btn': { outlined: { border: 2, rounded: 'full', elevation: 'none' } }
  },

  // ── 2) TOKENS SÉMANTIQUES (communs) ────────────────────────────
  vars: {
    rounded: { none: '0px', xs: '4px', sm: '8px', md: '12px', lg: '18px', xl: '28px', '2xl': '40px', full: '9999px' },
    typo: {
      family: {
        sans: "'Archivo', 'Helvetica Neue', Arial, sans-serif",
        serif: "'Anton', 'Impact', 'Arial Narrow', sans-serif", // slot détourné : voir en-tête
        mono: "'JetBrains Mono', monospace"
      },
      size: {
        xs: '0.75rem', sm: '0.875rem', md: '1rem', lg: '1.125rem', xl: '1.375rem',
        '2xl': '1.875rem', '3xl': 'clamp(2.5rem, 5vw, 3.75rem)', '4xl': 'clamp(3.25rem, 8vw, 6rem)', '5xl': 'clamp(3.25rem, 15vw, 15rem)'
      },
      weight: { regular: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800 },
      lineHeight: { none: 0.86, tight: 1, snug: 1.25, normal: 1.5, relaxed: 1.65, loose: 2 },
      letterSpacing: { tight: '-0.01em', normal: '0em', wide: '0.04em', wider: '0.1em', widest: '0.18em' }
    },
    spacing: { '11': '44px' },
    motion: {
      duration: { instant: '0ms', fast: '120ms', normal: '200ms', medium: '320ms', slow: '600ms', xslow: '900ms', marquee: '45s' },
      easing: { standard: 'cubic-bezier(0.34, 1.56, 0.64, 1)', decelerate: 'cubic-bezier(0.16, 1, 0.3, 1)', linear: 'linear' }
    }
  }
}

export const CCC_AFFICHE_LIGHT: IOrigamTheme = {
  name: 'ccc',
  mode: 'light',
  vars: {
    color: {
      surface: { default: '#f4efe8', raised: '#fffaf3', overlay: '#fffaf3', sunken: '#ebe3d8', disabled: '#e6ddd1' },
      text: {
        primary: '#120a05',   // 17.14:1
        secondary: '#4d4238', // 8.53:1
        tertiary: '#5c5046',
        disabled: '#ab9f92',
        inverse: '#fff6ec',
        onColor: '#120a05',
        ink: '#120a05'
      },
      action: {
        // Orange = FOND, toujours avec l'encre (6.29:1). En texte sur crème : #b83a0a (5.03:1).
        primary: { bg: '#ff5a1f', bgHover: '#ff6f3c', bgDisabled: '#e6ddd1', bgSubtle: 'rgba(255, 90, 31, 0.12)', fg: '#120a05', fgDisabled: '#ab9f92', fgSubtle: '#b83a0a' },
        secondary: { bg: '#2b4bff', bgHover: '#4362ff', bgDisabled: '#e6ddd1', bgSubtle: 'rgba(43, 75, 255, 0.10)', fg: '#ffffff', fgDisabled: '#ab9f92', fgSubtle: '#2b4bff' },
        ghost: { bg: 'rgba(0, 0, 0, 0)', bgHover: 'rgba(18, 10, 5, 0.06)', bgDisabled: 'rgba(0, 0, 0, 0)', fg: '#120a05', fgDisabled: '#ab9f92' }
      },
      border: { default: 'rgba(18, 10, 5, 0.14)', subtle: 'rgba(18, 10, 5, 0.07)', strong: '#120a05', focus: '#2b4bff' },
      feedback: {
        success: { bg: '#127a3d', bgSubtle: 'rgba(18, 122, 61, 0.12)', fg: '#ffffff', fgSubtle: '#0f6633', border: '#127a3d' },
        warning: { bg: '#ffd23f', bgSubtle: 'rgba(255, 210, 63, 0.35)', fg: '#120a05', fgSubtle: '#7a5200', border: '#7a5200' },
        danger: { bg: '#c8201a', bgSubtle: 'rgba(200, 32, 26, 0.10)', fg: '#ffffff', fgSubtle: '#a81a15', border: '#c8201a' },
        info: { bg: '#2b4bff', bgSubtle: 'rgba(43, 75, 255, 0.10)', fg: '#ffffff', fgSubtle: '#2b4bff', border: '#2b4bff' }
      },
      sticker: { yellow: '#ffd23f' }
    },
    shadow: {
      none: 'none',
      xs: '0 1px 2px rgba(18, 10, 5, 0.12)',
      sm: '0 2px 4px rgba(18, 10, 5, 0.10), 0 10px 20px -10px rgba(18, 10, 5, 0.30)',
      md: '0 4px 8px rgba(18, 10, 5, 0.10), 0 24px 40px -16px rgba(18, 10, 5, 0.40)',
      lg: '0 8px 16px rgba(18, 10, 5, 0.12), 0 40px 64px -24px rgba(18, 10, 5, 0.45)',
      xl: '10px 10px 0 #120a05'
    }
  }
}

export const CCC_AFFICHE_DARK: IOrigamTheme = {
  name: 'ccc',
  mode: 'dark',
  vars: {
    color: {
      surface: { default: '#120d0a', raised: '#1d1612', overlay: '#271e18', sunken: '#0a0705', disabled: '#271e18' },
      text: {
        primary: '#f4efe8',   // 15.61:1 sur raised
        secondary: '#c9bcad', // 9.59:1 sur raised
        tertiary: '#a89a8b',
        disabled: '#5c5046',
        inverse: '#120a05',
        onColor: '#120a05',
        ink: '#f4efe8'
      },
      action: {
        primary: { bg: '#ff5a1f', bgHover: '#ff7a45', bgDisabled: '#271e18', bgSubtle: 'rgba(255, 90, 31, 0.16)', fg: '#120a05', fgDisabled: '#5c5046', fgSubtle: '#ff7a45' },
        secondary: { bg: '#7d8cff', bgHover: '#97a3ff', bgDisabled: '#271e18', bgSubtle: 'rgba(125, 140, 255, 0.14)', fg: '#0b0b0b', fgDisabled: '#5c5046', fgSubtle: '#97a3ff' },
        ghost: { bg: 'rgba(0, 0, 0, 0)', bgHover: 'rgba(244, 239, 232, 0.08)', bgDisabled: 'rgba(0, 0, 0, 0)', fg: '#f4efe8', fgDisabled: '#5c5046' }
      },
      border: { default: 'rgba(244, 239, 232, 0.12)', subtle: 'rgba(244, 239, 232, 0.06)', strong: '#f4efe8', focus: '#ffd23f' },
      feedback: {
        success: { bg: '#4ade80', bgSubtle: 'rgba(74, 222, 128, 0.14)', fg: '#06210f', fgSubtle: '#4ade80', border: '#4ade80' },
        warning: { bg: '#ffd23f', bgSubtle: 'rgba(255, 210, 63, 0.16)', fg: '#120a05', fgSubtle: '#ffd23f', border: '#ffd23f' },
        danger: { bg: '#ff6b6b', bgSubtle: 'rgba(255, 107, 107, 0.14)', fg: '#2b0606', fgSubtle: '#ff8a8a', border: '#ff6b6b' },
        info: { bg: '#7d8cff', bgSubtle: 'rgba(125, 140, 255, 0.14)', fg: '#0b0b0b', fgSubtle: '#97a3ff', border: '#7d8cff' }
      },
      sticker: { yellow: '#ffd23f' }
    },
    shadow: {
      none: 'none',
      xs: '0 1px 2px rgba(0, 0, 0, 0.5)',
      sm: '0 10px 20px -10px rgba(0, 0, 0, 0.8)',
      md: '0 24px 40px -16px rgba(0, 0, 0, 0.85)',
      lg: '0 40px 64px -24px rgba(0, 0, 0, 0.9)',
      xl: '10px 10px 0 #ff5a1f'
    }
  }
}

export const CCC_AFFICHE_THEMES: IOrigamTheme[] = [CCC_AFFICHE_BASE, CCC_AFFICHE_LIGHT, CCC_AFFICHE_DARK]
