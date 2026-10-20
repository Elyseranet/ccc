import type { INavigationItem } from '~/interfaces/navigation.interface'

export const HOME_EXPLORE_LINKS: INavigationItem[] = [
  { key: 'explore_competition', label: 'La compétition', to: '/competition' },
  { key: 'explore_players', label: 'Les compétiteurs', to: '/players' },
  { key: 'explore_hall', label: 'Hall of Fame', to: '/hall-of-fame' }
]
