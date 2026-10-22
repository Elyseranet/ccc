import { onScopeDispose, ref, watch } from 'vue'
import type { Ref } from 'vue'

/*********************************************************
 * useDebouncedValue
 *
 * @description
 * Copie retardée d'une valeur réactive, pour ne pas émettre une requête par frappe (la recherche publique est
 * limitée en débit). Le minuteur ne pilote aucun rendu visuel : il retarde seulement la requête.
 ********************************************************/
export const useDebouncedValue = <T>(source: Ref<T>, delayMs: number): Readonly<Ref<T>> => {
  const debounced = ref(source.value) as Ref<T>
  let timer: ReturnType<typeof setTimeout> | undefined
  watch(source, (value) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      debounced.value = value
    }, delayMs)
  })
  onScopeDispose(() => clearTimeout(timer))
  return debounced
}
