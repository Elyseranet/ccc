import type { IOrigamTheme } from 'origam/interfaces'

export const CCC_DARK_THEME: IOrigamTheme = {
  name: 'ccc',
  mode: 'dark',
  label: 'CCC',
  description: 'Thème sombre du Championnat de Caps.',
  swatch: '#57f200',
  vars: {
    color: {
      surface: {
        default: '#0e0f12',
        raised: '#16171c',
        sunken: '#08090b',
        overlay: '#1e2027',
        disabled: '#1e2027'
      },
      text: {
        primary: '#e8eaee',
        secondary: '#969ba5',
        disabled: '#626772',
        inverse: '#08150a',
        onColor: '#08150a'
      },
      action: {
        primary: {
          bg: '#57f200',
          bgHover: '#70ff24',
          bgDisabled: '#1e2027',
          bgSubtle: 'rgba(87, 242, 0, 0.11)',
          fg: '#08150a',
          fgDisabled: '#626772',
          fgSubtle: '#57f200'
        },
        secondary: {
          bg: '#1e2027',
          bgHover: '#272a31',
          bgDisabled: '#16171c',
          fg: '#e8eaee',
          fgDisabled: '#626772'
        },
        ghost: {
          bg: 'rgba(0, 0, 0, 0)',
          bgHover: 'rgba(255, 255, 255, 0.06)',
          bgDisabled: 'rgba(0, 0, 0, 0)',
          fg: '#57f200',
          fgDisabled: '#626772'
        }
      },
      border: {
        default: 'rgba(255, 255, 255, 0.09)',
        subtle: 'rgba(255, 255, 255, 0.04)',
        strong: 'rgba(255, 255, 255, 0.16)',
        focus: '#57f200'
      }
    },
    rounded: {
      none: '0px',
      xs: '2px',
      sm: '4px',
      md: '8px',
      lg: '10px',
      xl: '14px',
      '2xl': '16px',
      full: '9999px'
    },
    typo: {
      family: {
        sans: "'Archivo', sans-serif",
        mono: "'JetBrains Mono', monospace"
      },
      size: {
        '5xl': 'clamp(34px, 5vw, 58px)',
        cccHero: 'clamp(62px, 10vw, 126px)'
      }
    }
  },
  components: {
    'origam-btn': { variant: 'flat', color: 'primary', rounded: 'md', elevation: 'none' },
    'origam-card': { rounded: 'md', border: true, elevation: 'none' },
    'origam-avatar': { rounded: 'full' }
  }
}
