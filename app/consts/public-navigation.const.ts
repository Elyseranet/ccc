import { ROUTES } from '~/consts/routes.const'
import type { INavigationItem } from '~/interfaces/navigation.interface'

export const PUBLIC_NAVIGATION: INavigationItem[] = [
  { key: 'layout.header.nav_editions', label: 'Éditions', to: ROUTES.EDITIONS },
  { key: 'layout.header.nav_players', label: 'Joueurs', to: ROUTES.PLAYERS },
  { key: 'layout.header.nav_hall_of_fame', label: 'Palmarès', to: ROUTES.HALL_OF_FAME },
  { key: 'layout.header.nav_rules', label: 'Règles', to: ROUTES.RULES }
]

export const FOOTER_NAVIGATION: INavigationItem[] = [
  { key: 'layout.footer.nav_rules', label: 'Règles', to: ROUTES.RULES },
  { key: 'layout.footer.nav_hall_of_fame', label: 'Palmarès', to: ROUTES.HALL_OF_FAME },
  { key: 'layout.footer.nav_login', label: 'Connexion', to: ROUTES.LOGIN }
]
