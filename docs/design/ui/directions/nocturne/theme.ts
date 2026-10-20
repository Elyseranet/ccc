import type { IOrigamTheme } from 'origam/interfaces'

/*********************************************************
 * Direction A — « Nocturne »
 *
 * @description
 * Une soirée de finale : fond quasi noir, halos de lumière acide (citron vert → menthe)
 * qui dérivent lentement derrière le hero, tuiles bento en verre dépoli, titres très
 * grands en Geist avec une ponctuation en serif italique (Instrument Serif).
 * Références : Liquid Glass Agency, Axle Journey, Peakline Redshift (voir notes.md).
 *
 * @description
 * Découpage conforme à `activeDefaultsFor` (origam.ts) : BASE (name sans mode) porte
 * props + tokens non colorés ; DARK (défaut) et LIGHT portent couleurs + ombres.
 ********************************************************/

export const CCC_NOCTURNE_BASE: IOrigamTheme = {
  name: 'ccc',
  label: 'CCC · Nocturne',
  description: 'Nuit de finale : verre dépoli, halos acides, typographie XXL.',
  swatch: 'linear-gradient(135deg, #07080b 40%, #c6ff3d 70%, #3dffb5)',

  // ── 1) PROPS D'ABORD ────────────────────────────────────────────
  components: {
    global: { density: 'default' },
    // CTA : `variant="flat" color="primary"` (fond = dégradé du token action.primary.bg).
    // Action secondaire : `variant="ghost"` — le glassmorphism est NATIF dans VARIANT (enums/Commons/variant.enum.ts).
    'origam-btn': { variant: 'text', size: 'large', rounded: 'full', elevation: 'none', fontWeight: 'semibold' },
    'origam-card': { rounded: 'xl', border: true, elevation: 'md', density: 'comfortable' },
    'origam-sheet': { rounded: 'xl', border: true, elevation: 'md' },
    'origam-chip': { size: 'small', pill: true, border: true, fontFamily: 'mono', textTransform: 'uppercase', letterSpacing: 'wider' },
    'origam-title': { fontFamily: 'sans', fontWeight: 'semibold', letterSpacing: 'tight', lineHeight: 'none' },
    'origam-tabs': { variant: 'pills', rounded: 'full', density: 'default', color: 'primary' },
    'origam-tab': { fontWeight: 'medium' },
    'origam-table': { border: false, rounded: 'lg', density: 'compact', hover: true, elevation: 'none' },
    'origam-data-table': { density: 'compact', hover: true },
    'origam-bracket': { variant: 'single-elimination', color: 'primary', density: 'compact', showScores: true, showSeed: true, showRoundTitles: true, elevation: 'md' },
    'origam-toolbar': { density: 'default', flat: true, elevation: 'none' },
    'origam-avatar': { rounded: 'full', size: 'x-large' },
    'origam-text-field': { variant: 'solo', rounded: 'full', density: 'default' },
    'origam-select': { variant: 'solo', rounded: 'full', density: 'default' },
    'origam-empty-state': { size: 'lg', align: 'center' }
  },

  // ── 2) TOKENS SÉMANTIQUES (communs) ────────────────────────────
  vars: {
    rounded: { none: '0px', xs: '6px', sm: '10px', md: '14px', lg: '20px', xl: '28px', '2xl': '36px', full: '9999px' },
    typo: {
      family: {
        sans: "'Geist', 'Inter', system-ui, sans-serif",
        serif: "'Instrument Serif', Georgia, serif",
        mono: "'Geist Mono', 'JetBrains Mono', monospace"
      },
      size: {
        xs: '0.75rem', sm: '0.875rem', md: '1rem', lg: '1.125rem', xl: '1.375rem',
        '2xl': '1.75rem', '3xl': 'clamp(2rem, 3.5vw, 2.75rem)', '4xl': 'clamp(2.75rem, 6vw, 4.5rem)', '5xl': 'clamp(3.5rem, 11vw, 10rem)'
      },
      weight: { regular: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800 },
      lineHeight: { none: 0.9, tight: 1.1, snug: 1.3, normal: 1.55, relaxed: 1.7, loose: 2 },
      letterSpacing: { tight: '-0.045em', normal: '-0.01em', wide: '0.02em', wider: '0.1em', widest: '0.2em' }
    },
    spacing: { '11': '44px' },
    motion: {
      duration: { instant: '0ms', fast: '140ms', normal: '220ms', medium: '360ms', slow: '700ms', xslow: '1200ms', drift: '24s' },
      easing: { standard: 'cubic-bezier(0.22, 1, 0.36, 1)', decelerate: 'cubic-bezier(0.16, 1, 0.3, 1)', accelerate: 'cubic-bezier(0.7, 0, 0.84, 0)' }
    }
  },

  // ── 3) ESCAPE HATCH — justifié : aucune prop n'exprime le flou d'arrière-plan d'une carte.
  // Token de composant existant : --origam-card---backdrop-filter (vérifié dans les sources 2.37.3).
  cssVars: {
    '--origam-card---backdrop-filter': 'blur(20px) saturate(160%)'
  }
}

export const CCC_NOCTURNE_DARK: IOrigamTheme = {
  name: 'ccc',
  mode: 'dark',
  vars: {
    color: {
      surface: {
        default: '#07080b',
        raised: 'rgba(255, 255, 255, 0.045)', // verre : la couleur réelle dépend du fond, mesurée ≈ #111215
        overlay: 'rgba(20, 22, 28, 0.82)',
        sunken: '#030304',
        disabled: '#16181d'
      },
      text: {
        primary: '#eef0f5',   // 17.56:1 sur default
        secondary: '#a1a7b3', // 7.75:1 sur verre
        tertiary: '#8b91a0',  // 5.94:1 sur verre
        disabled: '#4e5360',
        inverse: '#07130a',
        onColor: '#07130a',
        ink: '#eef0f5'
      },
      action: {
        // Un token couleur accepte un dégradé (theme.interface.ts) : le CTA EST le dégradé.
        primary: { bg: 'linear-gradient(120deg, #c6ff3d 0%, #3dffb5 100%)', bgHover: 'linear-gradient(120deg, #d4ff6b 0%, #6bffc8 100%)', bgDisabled: '#16181d', bgSubtle: 'rgba(198, 255, 61, 0.10)', fg: '#07130a', fgDisabled: '#4e5360', fgSubtle: '#c6ff3d' },
        secondary: { bg: 'rgba(255, 255, 255, 0.06)', bgHover: 'rgba(255, 255, 255, 0.12)', bgDisabled: '#16181d', fg: '#eef0f5', fgDisabled: '#4e5360' },
        ghost: { bg: 'rgba(255, 255, 255, 0.05)', bgHover: 'rgba(255, 255, 255, 0.10)', bgDisabled: 'rgba(0, 0, 0, 0)', fg: '#eef0f5', fgDisabled: '#4e5360' }
      },
      border: { default: 'rgba(255, 255, 255, 0.10)', subtle: 'rgba(255, 255, 255, 0.05)', strong: 'rgba(255, 255, 255, 0.22)', focus: '#c6ff3d' },
      feedback: {
        success: { bg: '#3dffb5', bgSubtle: 'rgba(61, 255, 181, 0.12)', fg: '#03190f', fgSubtle: '#3dffb5', border: '#3dffb5' },
        warning: { bg: '#ffc93d', bgSubtle: 'rgba(255, 201, 61, 0.12)', fg: '#231800', fgSubtle: '#ffc93d', border: '#ffc93d' },
        danger: { bg: '#ff6b81', bgSubtle: 'rgba(255, 107, 129, 0.12)', fg: '#2b060c', fgSubtle: '#ff6b81', border: '#ff6b81' },
        info: { bg: '#7cc4ff', bgSubtle: 'rgba(124, 196, 255, 0.12)', fg: '#041829', fgSubtle: '#7cc4ff', border: '#7cc4ff' }
      },
      // Halos du hero : rangés comme couleurs d'accent (pas de groupe gradient dans le DS).
      glow: { a: '#c6ff3d', b: '#3dffb5', c: '#5b6cff' }
    },
    shadow: {
      none: 'none',
      xs: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
      sm: 'inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 8px 24px -12px rgba(0, 0, 0, 0.8)',
      md: 'inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 24px 60px -24px rgba(0, 0, 0, 0.9)',
      lg: 'inset 0 1px 0 rgba(255, 255, 255, 0.10), 0 40px 80px -30px rgba(0, 0, 0, 0.95)',
      xl: 'inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 0 0 1px rgba(198, 255, 61, 0.35), 0 20px 80px -10px rgba(198, 255, 61, 0.40)'
    }
  }
}

export const CCC_NOCTURNE_LIGHT: IOrigamTheme = {
  name: 'ccc',
  mode: 'light',
  vars: {
    color: {
      surface: { default: '#f3f4f7', raised: 'rgba(255, 255, 255, 0.72)', overlay: 'rgba(255, 255, 255, 0.9)', sunken: '#e7e9ee', disabled: '#e7e9ee' },
      text: {
        primary: '#0b0d12',   // 17.67:1
        secondary: '#4b5160', // 7.94:1 sur blanc
        tertiary: '#5f6573',  // 5.31:1 sur default
        disabled: '#a2a7b2',
        inverse: '#f3f4f7',
        onColor: '#07130a',
        ink: '#0b0d12'
      },
      action: {
        primary: { bg: 'linear-gradient(120deg, #c6ff3d 0%, #3dffb5 100%)', bgHover: 'linear-gradient(120deg, #b6f02a 0%, #2cefa3 100%)', bgDisabled: '#e7e9ee', bgSubtle: 'rgba(63, 107, 0, 0.08)', fg: '#07130a', fgDisabled: '#a2a7b2', fgSubtle: '#3f6b00' },
        secondary: { bg: '#0b0d12', bgHover: '#1f232c', bgDisabled: '#e7e9ee', fg: '#f3f4f7', fgDisabled: '#a2a7b2' },
        ghost: { bg: 'rgba(255, 255, 255, 0.6)', bgHover: 'rgba(255, 255, 255, 0.9)', bgDisabled: 'rgba(0, 0, 0, 0)', fg: '#0b0d12', fgDisabled: '#a2a7b2' }
      },
      border: { default: 'rgba(11, 13, 18, 0.10)', subtle: 'rgba(11, 13, 18, 0.05)', strong: 'rgba(11, 13, 18, 0.22)', focus: '#3f6b00' },
      feedback: {
        success: { bg: '#0f7a4f', bgSubtle: 'rgba(15, 122, 79, 0.10)', fg: '#ffffff', fgSubtle: '#0b6640', border: '#0f7a4f' },
        warning: { bg: '#9a6400', bgSubtle: 'rgba(154, 100, 0, 0.10)', fg: '#ffffff', fgSubtle: '#7f5200', border: '#9a6400' },
        danger: { bg: '#c0213b', bgSubtle: 'rgba(192, 33, 59, 0.10)', fg: '#ffffff', fgSubtle: '#a51b31', border: '#c0213b' },
        info: { bg: '#1d5fc4', bgSubtle: 'rgba(29, 95, 196, 0.10)', fg: '#ffffff', fgSubtle: '#1a53ab', border: '#1d5fc4' }
      },
      glow: { a: '#d8ff7a', b: '#8affd6', c: '#a9b3ff' }
    },
    shadow: {
      none: 'none',
      xs: '0 1px 2px rgba(11, 13, 18, 0.06)',
      sm: '0 1px 2px rgba(11, 13, 18, 0.05), 0 8px 24px -12px rgba(11, 13, 18, 0.18)',
      md: 'inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 24px 48px -24px rgba(11, 13, 18, 0.22)',
      lg: 'inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 40px 72px -30px rgba(11, 13, 18, 0.28)',
      xl: '0 0 0 1px rgba(63, 107, 0, 0.30), 0 20px 60px -16px rgba(120, 200, 40, 0.45)'
    }
  }
}

export const CCC_NOCTURNE_THEMES: IOrigamTheme[] = [CCC_NOCTURNE_BASE, CCC_NOCTURNE_DARK, CCC_NOCTURNE_LIGHT]
