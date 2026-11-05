import { ROUTES } from './routes.const.js'
import type { INavigationItem } from '../interfaces/navigation.interface.js'
import { filterDeliveredItems } from '../utils/page-delivery.util.js'

export const PUBLIC_NAVIGATION: INavigationItem[] = filterDeliveredItems([
  { key: 'layout.header.nav_editions', label: 'Éditions', to: ROUTES.EDITIONS },
  { key: 'layout.header.nav_players', label: 'Joueurs', to: ROUTES.PLAYERS },
  { key: 'layout.header.nav_hall_of_fame', label: 'Palmarès', to: ROUTES.HALL_OF_FAME },
  { key: 'layout.header.nav_rules', label: 'Règles', to: ROUTES.RULES }
])

export const FOOTER_NAVIGATION: INavigationItem[] = filterDeliveredItems([
  { key: 'layout.footer.nav_rules', label: 'Règles', to: ROUTES.RULES },
  { key: 'layout.footer.nav_hall_of_fame', label: 'Palmarès', to: ROUTES.HALL_OF_FAME },
  { key: 'layout.footer.nav_login', label: 'Connexion', to: ROUTES.LOGIN }
])

export const LEGAL_NAVIGATION: INavigationItem[] = filterDeliveredItems([
  { key: 'layout.footer.legal_notice', label: 'Mentions légales', to: ROUTES.LEGAL_NOTICE },
  { key: 'layout.footer.legal_privacy', label: 'Confidentialité', to: ROUTES.PRIVACY },
  { key: 'layout.footer.legal_terms', label: 'Conditions d’utilisation', to: ROUTES.TERMS },
  { key: 'layout.footer.legal_accessibility', label: 'Accessibilité', to: ROUTES.ACCESSIBILITY }
])
