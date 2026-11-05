export const LEGAL_PUBLISHER_NAME = 'Elysera'

export const LEGAL_PUBLISHER_URL = 'https://elysera.net'

export const LEGAL_DESIGN_SYSTEM_NAME = 'Origam'

/** Séparateur entre deux liens légaux d'une même ligne (écran d'invitation). */
export const LEGAL_LINKS_SEPARATOR = '·'

/** Marqueur d'une information que l'utilisateur n'a pas encore fournie ou confirmée : `[À FOURNIR : …]`, `[À CONFIRMER : …]`. */
export const LEGAL_MARKER_PATTERN = /(\[À (?:FOURNIR|CONFIRMER) : [^\]]*\])/

/** En dessous de cette largeur, le sommaire est replié au chargement. */
export const LEGAL_TOC_COLLAPSE_QUERY = '(max-width: 1000px)'
