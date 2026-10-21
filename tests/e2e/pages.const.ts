export const FIXTURE_SESSION_COOKIE = 'ccc_fixture_session'

export const PUBLIC_PAGES = [
  '/',
  '/palmares',
  '/editions',
  '/editions/00000000-0000-4000-0002-000000000002',
  '/joueurs',
  '/joueurs/00000000-0000-4000-0001-000000000001',
  '/joueurs/face-a-face',
  '/regles',
  '/connexion',
  '/invitation/jeton-de-test',
  '/profil'
]

export const ADMIN_PAGES = [
  '/admin',
  '/admin/matchs',
  '/admin/participants',
  '/admin/tirages',
  '/admin/plus'
]

export const REDIRECTS: Array<{ from: string, to: string }> = [
  { from: '/hall-of-fame', to: '/palmares' },
  { from: '/competition', to: '/editions' },
  { from: '/players', to: '/joueurs' },
  { from: '/head-to-head', to: '/joueurs/face-a-face' },
  { from: '/rules', to: '/regles' },
  { from: '/variants', to: '/regles#variantes' },
  { from: '/admin/scores', to: '/admin/matchs' },
  { from: '/admin/groups', to: '/admin/matchs' },
  { from: '/admin/draws', to: '/admin/tirages' }
]
