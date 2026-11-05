import { computed } from 'vue'
import type { Ref } from 'vue'
import { useT } from '~/composables/useT'
import { ROUTES } from '~/consts/routes.const'
import { ERROR_PAGE_KIND } from '~/enums/error-page-kind.enum'
import type { IErrorPageError } from '~/interfaces/error-page.interface'
import { resolveErrorPageKind } from '~/utils/error-page.util'

/*********************************************************
 * useErrorPage
 *
 * @description
 * Textes de la page d'erreur (`src/error.vue`) selon le code de l'erreur : « introuvable » pour un 404, texte générique
 * pour le reste. Le titre est porté en clés (`PageHero` traduit). Le retour à l'accueil efface l'erreur Nuxt : un simple
 * lien laisserait la page d'erreur affichée.
 ********************************************************/
export const useErrorPage = (error: Ref<IErrorPageError> | (() => IErrorPageError)) => {
  const { t } = useT()
  const source = computed(() => typeof error === 'function' ? error() : error.value)
  const isNotFound = computed(() => resolveErrorPageKind(source.value.statusCode) === ERROR_PAGE_KIND.NOT_FOUND)

  const heroTitle = computed(() => isNotFound.value
    ? { key: 'error_page.not_found_title', fallback: 'Page introuvable' }
    : { key: 'error_page.generic_title', fallback: 'Une erreur est survenue' })
  const heroSubtitle = computed(() => isNotFound.value
    ? { key: 'error_page.not_found_text', fallback: 'Cette page n’existe pas ou n’est plus disponible. Vérifiez l’adresse, ou revenez à l’accueil.' }
    : { key: 'error_page.generic_text', fallback: 'Le site a rencontré un problème. Réessayez dans un instant, ou revenez à l’accueil.' })
  const eyebrow = computed(() => t('error_page.eyebrow', 'Erreur {code}', { code: source.value.statusCode }))
  const backLabel = computed(() => t('error_page.back_home', 'Retour à l’accueil'))
  const documentTitle = computed(() => t(heroTitle.value.key, heroTitle.value.fallback))

  const backHome = () => clearError({ redirect: ROUTES.HOME })

  return { heroTitle, heroSubtitle, eyebrow, backLabel, documentTitle, backHome }
}
