export const IF_MATCH_HEADER = 'if-match'

/** Version dans `If-Match` : entier, avec ou sans guillemets ni préfixe `W/` (le front envoie `"<n>"`). */
export const IF_MATCH_VERSION_PATTERN = /^(?:W\/)?"?(\d{1,9})"?$/
