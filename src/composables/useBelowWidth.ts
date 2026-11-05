import { onBeforeUnmount, onMounted, ref } from 'vue'

/*********************************************************
 * useBelowWidth
 *
 * @description
 * Vrai quand la fenêtre est plus étroite que `width` px (media query, pas de minuteur). Faux au rendu serveur et avant le
 * montage : l'écran démarre en bureau, puis bascule si besoin. Sert à choisir entre dialogue (bureau) et tiroir bas (mobile).
 ********************************************************/
export const useBelowWidth = (width: number) => {
  const below = ref(false)
  let query: MediaQueryList | null = null
  const update = () => {
    below.value = query?.matches ?? false
  }

  onMounted(() => {
    query = window.matchMedia(`(max-width: ${width}px)`)
    update()
    query.addEventListener('change', update)
  })
  onBeforeUnmount(() => {
    query?.removeEventListener('change', update)
  })

  return below
}
