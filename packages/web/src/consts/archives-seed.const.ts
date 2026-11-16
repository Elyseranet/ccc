/** Dump SQL figé des archives 2012-2026 (ARCH-5), relatif au répertoire courant : racine du dépôt ou `/app` dans l'image. */
export const ARCHIVES_SEED_PATH = 'src/assets/seeds/archives.sql'

/** Tables du domaine dont le contenu, s'il existe déjà, interdit d'appliquer les archives. */
export const ARCHIVES_SEED_GUARD_TABLES = ['editions', 'competitors', 'legacy_workbook_imports'] as const

export const ARCHIVES_SEED_NOT_EMPTY_MESSAGE = 'La base contient déjà des données d\'archives ou du domaine : les archives ne s\'appliquent que sur une base migrée et vide.'
export const ARCHIVES_SEED_FAILED_MESSAGE = 'Échec de l\'application des archives.'
