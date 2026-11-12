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

/** Pages non indexées : admin, connexion, profil, lien d'invitation, et les quatre pages légales (décision utilisateur 2026-11-12, accessibles depuis le pied de page). Elles portent `noindex` quelle que soit la variable d'indexation du site. */
export const SEO_PRIVATE_ROUTE_PATTERNS = ['/admin/**', '/connexion', '/profil', '/invitation/**', '/mentions-legales', '/confidentialite', '/cgu', '/accessibilite'] as const

/** `og:locale` par langue du site. */
export const SEO_LOCALES: Record<string, string> = { fr: 'fr_FR', en: 'en_US' }

/**
 * Langue que `useT` charge aujourd'hui (`fr.json` seule) : `useT` n'expose pas de langue active. Quand il saura en changer, ce point
 * est le seul à suivre.
 */
export const SEO_ACTIVE_LOCALE = 'fr'

/** Séparateur entre le titre de la page et le nom du site : le nom du site est ajouté une seule fois, par `useSeo`, jamais dans les clés `seo.*.title`. */
export const SEO_TITLE_SEPARATOR = ' · '

/** Points de suspension qui marquent un paramètre tronqué pour tenir dans le plafond. */
export const SEO_ELLIPSIS = '…'

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
    title: { key: 'seo.home.title', label: 'Cotentin Caps Cup : éditions, joueurs, classements' },
    description: { key: 'seo.home.description', label: 'La Cotentin Caps Cup : le classement ACP, les derniers scores validés et le champion de la dernière édition.' }
  },
  [SEO_PAGE.EDITIONS]: {
    title: { key: 'seo.editions.title', label: 'Éditions de la Cotentin Caps Cup' },
    description: { key: 'seo.editions.description', label: 'Toutes les éditions de la Cotentin Caps Cup : poules, phase finale, matchs et classements de chaque édition.' }
  },
  [SEO_PAGE.EDITION]: {
    title: { key: 'seo.edition.title', label: 'Édition {code} de la Cotentin Caps Cup' },
    description: { key: 'seo.edition.description', label: 'Édition {code} de la Cotentin Caps Cup : participants, poules, phase finale, matchs et résultats.' }
  },
  [SEO_PAGE.PLAYERS]: {
    title: { key: 'seo.players.title', label: 'Joueurs de la Cotentin Caps Cup' },
    description: { key: 'seo.players.description', label: 'L’annuaire des joueurs de la Cotentin Caps Cup : recherchez un joueur par nom ou pseudo et consultez sa fiche.' }
  },
  [SEO_PAGE.PLAYER]: {
    title: { key: 'seo.player.title', label: '{name} : fiche joueur' },
    description: { key: 'seo.player.description', label: 'Fiche de {name} à la Cotentin Caps Cup : parcours, victoires et défaites, adversaires fréquents.' }
  },
  [SEO_PAGE.HEAD_TO_HEAD]: {
    title: { key: 'seo.head_to_head.title', label: 'Face-à-face entre deux joueurs' },
    description: { key: 'seo.head_to_head.description', label: 'Comparez deux joueurs de la Cotentin Caps Cup : le bilan de leurs rencontres, l’historique des scores et leurs statistiques globales.' }
  },
  [SEO_PAGE.RULES]: {
    title: { key: 'seo.rules.title', label: 'Règles de la Cotentin Caps Cup' },
    description: { key: 'seo.rules.description', label: 'Les règles de la Cotentin Caps Cup : le jeu, le tournoi et les variantes.' }
  },
  [SEO_PAGE.HALL_OF_FAME]: {
    title: { key: 'seo.hall_of_fame.title', label: 'Palmarès de la Cotentin Caps Cup' },
    description: { key: 'seo.hall_of_fame.description', label: 'Le palmarès de la Cotentin Caps Cup.' }
  }
}

/** Routes Nitro de référencement et leurs types de contenu (T-SEO-01). */
export const SEO_ROBOTS_PATH = '/robots.txt'
export const SEO_SITEMAP_PATH = '/sitemap.xml'
export const SEO_ROBOTS_CONTENT_TYPE = 'text/plain; charset=utf-8'
export const SEO_SITEMAP_CONTENT_TYPE = 'application/xml; charset=utf-8'

/** Chemins interdits aux robots d'un site indexable (pages privées et API ; les pages légales restent crawlables mais `noindex`). */
export const SEO_ROBOTS_DISALLOWED_PATHS = ['/admin', '/connexion', '/profil', '/invitation', '/api/'] as const

export const SEO_XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8"?>'
export const SEO_SITEMAP_NAMESPACE = 'http://www.sitemaps.org/schemas/sitemap/0.9'

export const SEO_XML_ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }

/** Lignes de `robots.txt`. */
export const SEO_ROBOTS_USER_AGENT_LINE = 'User-agent: *'
export const SEO_ROBOTS_DISALLOW_ALL_LINE = 'Disallow: /'
export const SEO_ROBOTS_DISALLOW_PREFIX = 'Disallow: '
export const SEO_ROBOTS_SITEMAP_PREFIX = 'Sitemap: '
