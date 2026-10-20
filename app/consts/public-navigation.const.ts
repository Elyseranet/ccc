import type { INavigationItem } from '~/interfaces/navigation.interface'

export const PUBLIC_NAVIGATION: INavigationItem[] = [
  { key: 'nav_competition', label: 'Compétition', to: '/competition' },
  { key: 'nav_players', label: 'Joueurs', to: '/players' },
  { key: 'nav_rules', label: 'Règles', to: '/rules' },
  { key: 'nav_variants', label: 'Variantes', to: '/variants' },
  { key: 'nav_hall_of_fame', label: 'Hall of Fame', to: '/hall-of-fame' }
]
