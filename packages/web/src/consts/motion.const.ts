/** Cookie de la préférence « animations en pause » (T-A11Y-01, M5) : la seule valeur écrite est `paused` ; absent, les animations tournent. */
export const MOTION_COOKIE = 'ccc_motion'

export const MOTION_PAUSED_VALUE = 'paused'

/** 12 mois, en secondes (décision du chef de projet, 2026-11-12). */
export const MOTION_COOKIE_MAX_AGE_SECONDS = 365 * 24 * 60 * 60

/** Attribut posé sur `<html>` quand les animations sont en pause : la règle de `main.css` et la boucle du canvas le lisent. */
export const MOTION_HTML_ATTRIBUTE = 'data-motion'

export const MOTION_STATE_KEY = 'motion-paused'
