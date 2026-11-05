import type { SEO_PAGE } from '../enums/seo.enum.js'
import type { IAccountMessage } from './account.interface.js'

/** Titre et description d'une page publique : clé de traduction et libellé de repli. */
export interface ISeoPageMessages {
  title: IAccountMessage
  description: IAccountMessage
}

export interface ISeoOptions {
  /** Page publique référencée : fournit titre et description (`seo.<page>.*`). Absente, la page ne pose que `robots` (pages privées). */
  page?: SEO_PAGE
  /** Chemin de la page pour la canonique et `og:url` (sans query). Défaut : le chemin de la route courante. */
  path?: string | (() => string)
  /** Paramètres des textes (`{code}`, `{name}`). */
  params?: Record<string, string | number> | (() => Record<string, string | number>)
  /** Page privée : `noindex, nofollow` quelle que soit la variable d'indexation du site. */
  noindex?: boolean
}
