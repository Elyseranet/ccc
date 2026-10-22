/** Identifiants réels, figés par le dump des archives : édition 2025, Nicolas Deseine (ARCH-9). */
export const PUBLIC_PAGES = [
  '/',
  '/palmares',
  '/editions',
  '/editions/2025',
  '/joueurs',
  '/joueurs/b20dfa9e-222d-46cf-a229-8fd77cc2edca',
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
