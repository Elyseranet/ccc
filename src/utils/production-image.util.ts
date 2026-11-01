import { existsSync } from 'node:fs'
import { PRODUCTION_IMAGE_MARKER_PATH } from '../consts/runtime-config.const.js'

/**
 * Vrai dans l'image de production : le Dockerfile y pose le marqueur, qu'une variable d'environnement ne retire pas.
 * Partagé par le plugin Nitro et par `user:create-admin` (autonome, sans dépendance Nitro).
 */
export const isProductionImage = (markerPath: string = PRODUCTION_IMAGE_MARKER_PATH): boolean => existsSync(markerPath)
