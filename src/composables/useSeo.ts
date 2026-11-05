import { computed, toValue } from 'vue'
import { useT } from '~/composables/useT'
import {
  SEO_ACTIVE_LOCALE,
  SEO_LOCALES,
  SEO_MESSAGES,
  SEO_OG_TYPE,
  SEO_ROBOTS_NOINDEX,
  SEO_TWITTER_CARD,
  SEO_TWITTER_CARD_WITH_IMAGE
} from '~/consts/seo.const'
import type { ISeoOptions } from '~/interfaces/seo.interface'
import { isSiteIndexable } from '~/utils/site-indexable.util'
import { buildAbsoluteImageUrl, buildCanonicalUrl } from '~/utils/seo.util'

/*********************************************************
 * useSeo
 *
 * @description
 * Métadonnées de référencement d'une page (T-SEO-01). Une page publique donne son `page` : titre et description viennent de
 * `seo.<page>.title|description` (textes fixes avec paramètres, jamais assemblés à partir des données de la page), la canonique et `og:url`
 * de `runtimeConfig.public.siteUrl` (jamais de l'en-tête Host) et du chemin sans query, `og:locale` de la langue chargée par `useT`. L'image de
 * partage (`runtimeConfig.public.siteOgImage`) n'est posée que si elle est renseignée. Une page privée (admin, connexion, profil, invitation)
 * passe `noindex` : elle ne pose que `robots`, et garde son propre titre. `robots: noindex, nofollow` est aussi posé dans le HTML de toutes les
 * pages tant que le site n'est pas indexable (`isSiteIndexable`, variable d'environnement d'indexation) : l'en-tête seul ne protège pas un HTML copié.
 ********************************************************/
export const useSeo = (options: ISeoOptions) => {
  const { t } = useT()
  const config = useRuntimeConfig()
  const route = useRoute()
  const robots = computed(() => options.noindex || !isSiteIndexable(config) ? SEO_ROBOTS_NOINDEX : undefined)

  if (!options.page) {
    useSeoMeta({ robots })
    return
  }

  const messages = SEO_MESSAGES[options.page]
  const params = computed(() => toValue(options.params) ?? {})
  const siteName = computed(() => t('layout.brand_name', 'CCC'))
  const title = computed(() => t(messages.title.key, messages.title.label, params.value))
  const description = computed(() => t(messages.description.key, messages.description.label, params.value))
  const siteUrl = String(config.public.siteUrl)
  const url = computed(() => buildCanonicalUrl(siteUrl, toValue(options.path) ?? route.path))
  const image = buildAbsoluteImageUrl(siteUrl, String(config.public.siteOgImage ?? ''))

  useHead({ link: [{ rel: 'canonical', href: url }] })
  useSeoMeta({
    title,
    description,
    robots,
    ogTitle: title,
    ogDescription: description,
    ogUrl: url,
    ogType: SEO_OG_TYPE,
    ogSiteName: siteName,
    ogLocale: SEO_LOCALES[SEO_ACTIVE_LOCALE],
    ogImage: image || undefined,
    twitterCard: image ? SEO_TWITTER_CARD_WITH_IMAGE : SEO_TWITTER_CARD,
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: image || undefined
  })
}
