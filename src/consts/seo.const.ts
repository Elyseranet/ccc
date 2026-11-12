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
    title: { key: 'seo.home.title', label: 'Championnat de Caps : éditions, joueurs, classements' },
    description: { key: 'seo.home.description', label: 'Le Championnat de Caps : le classement ACP, les derniers scores validés et le champion de la dernière édition.' }
  },
  [SEO_PAGE.EDITIONS]: {
    title: { key: 'seo.editions.title', label: 'Éditions du Championnat de Caps' },
    description: { key: 'seo.editions.description', label: 'Toutes les éditions du Championnat de Caps : poules, phase finale, matchs et classements de chaque édition.' }
  },
  [SEO_PAGE.EDITION]: {
    title: { key: 'seo.edition.title', label: 'Édition {code} du Championnat de Caps' },
    description: { key: 'seo.edition.description', label: 'Édition {code} du Championnat de Caps : participants, poules, phase finale, matchs et résultats.' }
  },
  [SEO_PAGE.PLAYERS]: {
    title: { key: 'seo.players.title', label: 'Joueurs du Championnat de Caps' },
    description: { key: 'seo.players.description', label: 'L’annuaire des joueurs du Championnat de Caps : recherchez un joueur par nom ou pseudo et consultez sa fiche.' }
  },
  [SEO_PAGE.PLAYER]: {
    title: { key: 'seo.player.title', label: '{name} : fiche joueur' },
    description: { key: 'seo.player.description', label: 'Fiche de {name} au Championnat de Caps : parcours, victoires et défaites, adversaires fréquents.' }
  },
  [SEO_PAGE.HEAD_TO_HEAD]: {
    title: { key: 'seo.head_to_head.title', label: 'Face-à-face entre deux joueurs' },
    description: { key: 'seo.head_to_head.description', label: 'Comparez deux joueurs du Championnat de Caps : le bilan de leurs rencontres, l’historique des scores et leurs statistiques globales.' }
  },
  [SEO_PAGE.RULES]: {
    title: { key: 'seo.rules.title', label: 'Règles du Championnat de Caps' },
    description: { key: 'seo.rules.description', label: 'Les règles du Championnat de Caps : le jeu, le tournoi et les variantes.' }
  },
  [SEO_PAGE.HALL_OF_FAME]: {
    title: { key: 'seo.hall_of_fame.title', label: 'Palmarès du Championnat de Caps' },
    description: { key: 'seo.hall_of_fame.description', label: 'Le palmarès du Championnat de Caps.' }
  },
  [SEO_PAGE.LEGAL_NOTICE]: {
    title: { key: 'seo.legal_notice.title', label: 'Mentions légales' },
    description: { key: 'seo.legal_notice.description', label: 'Mentions légales : éditeur, directeur de la publication, hébergeur, contact, propriété intellectuelle et crédits.' }
  },
  [SEO_PAGE.PRIVACY]: {
    title: { key: 'seo.privacy.title', label: 'Politique de confidentialité' },
    description: { key: 'seo.privacy.description', label: 'Politique de confidentialité : données collectées, finalités et bases légales, durées de conservation, destinataires, droits et réclamation, cookies.' }
  },
  [SEO_PAGE.TERMS]: {
    title: { key: 'seo.terms.title', label: 'Conditions d’utilisation' },
    description: { key: 'seo.terms.description', label: 'Conditions d’utilisation : objet et éditeur, accès au service, comptes, contenus déposés, règles de conduite, responsabilité, droit applicable.' }
  },
  [SEO_PAGE.ACCESSIBILITY]: {
    title: { key: 'seo.accessibility.title', label: 'Déclaration d’accessibilité' },
    description: { key: 'seo.accessibility.description', label: 'Déclaration d’accessibilité : état de conformité, ce qui est fait, ce qui n’est pas fait, défauts connus, contact et voies de recours.' }
  }
}
