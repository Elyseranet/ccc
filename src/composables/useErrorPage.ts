import { computed, nextTick, onMounted } from 'vue'
import type { Ref } from 'vue'
import { INTENT, VARIANT } from 'origam/enums'
import { useSeo } from '~/composables/useSeo'
import { useT } from '~/composables/useT'
import { HOME_CTA_HOVER } from '~/consts/home.const'
import { ROUTES } from '~/consts/routes.const'
import { ERROR_PAGE_KIND } from '~/enums/error-page-kind.enum'
import type { IErrorPageError } from '~/interfaces/error-page.interface'
import { isKnownStatusCode, resolveErrorPageKind } from '~/utils/error-page.util'

/*********************************************************
 * useErrorPage
 *
 * @description
 * Textes et actions de la page d'erreur (`src/error.vue`), selon le code de l'erreur :
 * - 404 : « Page introuvable » et un seul bouton, « Retour à l'accueil » ;
 * - toute autre erreur : « Une erreur est survenue », « Réessayer » en action principale (efface l'erreur puis
 *   recharge la route) et « Retour à l'accueil » en contour.
 * Le code affiché en eyebrow est le vrai `statusCode`, jamais écrit en dur ; sans code connu, pas d'eyebrow. Le message
 * technique de l'erreur n'est jamais affiché. À l'arrivée, le focus va sur le titre `h1` (un lecteur d'écran annonce
 * la page). La page porte `noindex` : une page d'erreur ne doit pas être indexée. Le titre du document est celui du
 * h1, sans nom de site : `useSeo({ noindex: true })` (T-SEO-01) ne pose que `robots` et garde ce titre.
 ********************************************************/
export const useErrorPage = (error: Ref<IErrorPageError> | (() => IErrorPageError)) => {
  const { t } = useT()
  const route = useRoute()
  const source = computed(() => typeof error === 'function' ? error() : error.value)
  const isNotFound = computed(() => resolveErrorPageKind(source.value.statusCode) === ERROR_PAGE_KIND.NOT_FOUND)
  const isGeneric = computed(() => !isNotFound.value)
  const hasCode = computed(() => isKnownStatusCode(source.value.statusCode))
  const code = computed(() => hasCode.value ? String(source.value.statusCode) : '')

  const heroTitle = computed(() => isNotFound.value
    ? { key: 'error_page.not_found_title', fallback: 'Page introuvable' }
    : { key: 'error_page.generic_title', fallback: 'Une erreur est survenue' })
  const heroSubtitle = computed(() => isNotFound.value
    ? { key: 'error_page.not_found_text', fallback: 'Cette page n’existe pas ou n’est plus disponible.' }
    : { key: 'error_page.generic_text', fallback: 'La page n’a pas pu s’afficher. Réessayez dans quelques instants.' })
  const eyebrow = computed(() => hasCode.value ? t('error_page.eyebrow', 'Erreur {code}', { code: code.value }) : '')
  const backLabel = computed(() => t('error_page.back_home', 'Retour à l’accueil'))
  const retryLabel = computed(() => t('error_page.retry', 'Réessayer'))
  const documentTitle = computed(() => t(heroTitle.value.key, heroTitle.value.fallback))

  /** En 404 le retour à l'accueil est l'action principale ; sinon « Réessayer » l'est et l'accueil passe en contour. */
  const homeButton = computed(() => isNotFound.value
    ? { variant: VARIANT.FLAT, bgColor: INTENT.PRIMARY, elevation: 'lg', hover: HOME_CTA_HOVER }
    : { variant: VARIANT.OUTLINED, bgColor: undefined, elevation: undefined, hover: undefined })

  const backHome = () => clearError({ redirect: ROUTES.HOME })
  const retry = () => clearError({ redirect: route.fullPath })

  useSeo({ noindex: true })

  onMounted(async () => {
    await nextTick()
    const heading = document.querySelector<HTMLElement>('h1')
    heading?.setAttribute('tabindex', '-1')
    heading?.focus()
  })

  return { heroTitle, heroSubtitle, eyebrow, hasCode, code, isGeneric, backLabel, retryLabel, documentTitle, homeButton, backHome, retry }
}
