/*********************************************************
 * useNavigationState
 *
 * @description
 * État « courant » d'une entrée de navigation d'après la route.
 * Une entrée est active sur sa route et sur ses sous-routes, sauf `exact` (ex. le tableau de bord admin).
 * `aria-current="page"` n'est posé que sur la route exacte, `true` sur une section parente.
 ********************************************************/
export const useNavigationState = () => {
  const route = useRoute()

  const isExact = (to: string): boolean => route.path === to

  const isActive = (to: string, exact = false): boolean =>
    isExact(to) || (!exact && route.path.startsWith(`${to}/`))

  const ariaCurrent = (to: string, exact = false): 'page' | 'true' | undefined => {
    if (isExact(to)) {
      return 'page'
    }
    return isActive(to, exact) ? 'true' : undefined
  }

  return { isActive, ariaCurrent }
}
