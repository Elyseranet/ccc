import { SEO_PAGE } from '../enums/seo.enum.js'
import type { ISeoPageMessages } from '../interfaces/seo.interface.js'

/*********************************************************
 * Référencement (T-SEO-01)
 *
 * @description
 * Valeurs partagées par `useSeo`, les règles de route de `nuxt.config.ts` et leurs tests.
 ********************************************************/

/** Valeur de `robots` (meta) et d'`X-Robots-Tag` (en-tête) des pages privées : jamais indexées, aucun lien suivi. */
export const SEO_ROBOTS_NOINDEX = 'noindex, nofollow'

/** Pages privées : admin, connexion, profil, lien d'invitation. Elles portent `noindex` quelle que soit la variable d'indexation du site. */
export const SEO_PRIVATE_ROUTE_PATTERNS = ['/admin/**', '/connexion', '/profil', '/invitation/**'] as const

/** `og:locale` par langue du site. */
export const SEO_LOCALES: Record<string, string> = { fr: 'fr_FR', en: 'en_US' }

/**
 * Langue que `useT` charge aujourd'hui (`fr.json` seule) : `useT` n'expose pas de langue active. Quand il saura en changer, ce point
 * est le seul à suivre.
 */
export const SEO_ACTIVE_LOCALE = 'fr'

/** Plafonds usuels d'un titre et d'une description dans les résultats de recherche. */
export const SEO_TITLE_MAX_LENGTH = 60
export const SEO_DESCRIPTION_MAX_LENGTH = 160

export const SEO_OG_TYPE = 'website'

/** Sans image de partage (`runtimeConfig.public.siteOgImage` vide), la carte Twitter est la carte courte. */
export const SEO_TWITTER_CARD = 'summary'
export const SEO_TWITTER_CARD_WITH_IMAGE = 'summary_large_image'

/** Titre et description de chaque page : clé de traduction et libellé de repli (les clés sont écrites en toutes lettres pour le contrôle des clés mortes). */
export const SEO_MESSAGES: Record<SEO_PAGE, ISeoPageMessages> = {
  [SEO_PAGE.HOME]: {
    title: { key: 'seo.home.title', label: 'Championnat de Caps · Éditions, joueurs, classements' },
    description: { key: 'seo.home.description', label: 'Le Championnat de Caps : l’édition en cours, les derniers scores validés, le champion et le classement ACP.' }
  },
  [SEO_PAGE.EDITIONS]: {
    title: { key: 'seo.editions.title', label: 'Éditions du Championnat de Caps · CCC' },
    description: { key: 'seo.editions.description', label: 'Toutes les éditions du Championnat de Caps : poules, phase finale, matchs et classements de chaque édition.' }
  },
  [SEO_PAGE.EDITION]: {
    title: { key: 'seo.edition.title', label: 'Édition {code} du Championnat de Caps · CCC' },
    description: { key: 'seo.edition.description', label: 'Édition {code} du Championnat de Caps : participants, poules, phase finale, matchs et résultats.' }
  },
  [SEO_PAGE.PLAYERS]: {
    title: { key: 'seo.players.title', label: 'Joueurs du Championnat de Caps · CCC' },
    description: { key: 'seo.players.description', label: 'L’annuaire des joueurs du Championnat de Caps : recherchez un joueur par nom ou pseudo et consultez sa fiche.' }
  },
  [SEO_PAGE.PLAYER]: {
    title: { key: 'seo.player.title', label: '{name} · Fiche joueur · CCC' },
    description: { key: 'seo.player.description', label: 'Fiche de {name} au Championnat de Caps : parcours, victoires et défaites, adversaires fréquents.' }
  },
  [SEO_PAGE.HEAD_TO_HEAD]: {
    title: { key: 'seo.head_to_head.title', label: 'Face-à-face entre deux joueurs · Championnat de Caps' },
    description: { key: 'seo.head_to_head.description', label: 'Comparez deux joueurs du Championnat de Caps : leurs rencontres, le score de leurs confrontations et leurs bilans globaux.' }
  },
  [SEO_PAGE.RULES]: {
    title: { key: 'seo.rules.title', label: 'Règles du Championnat de Caps · CCC' },
    description: { key: 'seo.rules.description', label: 'Les règles du Championnat de Caps : le jeu, le tournoi et les variantes.' }
  },
  [SEO_PAGE.HALL_OF_FAME]: {
    title: { key: 'seo.hall_of_fame.title', label: 'Palmarès du Championnat de Caps · CCC' },
    description: { key: 'seo.hall_of_fame.description', label: 'Le palmarès du Championnat de Caps : classements ACP et All Time, évolution des points et chronologie des titres.' }
  }
}
