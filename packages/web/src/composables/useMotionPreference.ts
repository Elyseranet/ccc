import { MOTION_COOKIE, MOTION_COOKIE_MAX_AGE_SECONDS, MOTION_PAUSED_VALUE, MOTION_STATE_KEY } from '~/consts/motion.const'

/*********************************************************
 * useMotionPreference
 *
 * @description
 * Préférence « mettre en pause les animations » (WCAG 2.2.2, RGAA 13.8 ; T-A11Y-01, M5). Mémorisée dans le cookie `ccc_motion`
 * (valeur `paused` seulement, 12 mois, SameSite=Lax), lu côté serveur : le HTML part déjà avec `data-motion="paused"` et les animations ne
 * démarrent jamais pour un visiteur qui les a coupées. L'état est partagé (`useState`) entre le bouton, le canvas et `app.vue`.
 ********************************************************/
export const useMotionPreference = () => {
  const cookie = useCookie<string | null>(MOTION_COOKIE, { default: () => null, sameSite: 'lax', path: '/', maxAge: MOTION_COOKIE_MAX_AGE_SECONDS })
  const paused = useState<boolean>(MOTION_STATE_KEY, () => cookie.value === MOTION_PAUSED_VALUE)
  const toggle = () => {
    paused.value = !paused.value
    cookie.value = paused.value ? MOTION_PAUSED_VALUE : null
  }
  return { paused, toggle }
}
