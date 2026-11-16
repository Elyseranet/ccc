import { API_ERROR_CODE } from '../enums/api-error-code.enum.js'
import { DRAW_KIND } from '../enums/draw.enum.js'
import type { ITranslatableText } from '../interfaces/common-components.interface.js'

/** Déclencheur du tirage : le focus lui revient à la fermeture de l'écran projecteur si l'élément focalisé a disparu. */
export const RANDOM_DRAW_TRIGGER_SELECTOR = '[data-cy="draw-random"]'

/** Éclat de capsules du moment fort de l'écran projecteur (maquette F-52) : angle en degrés, portée en vmin. */
export const RANDOM_DRAW_BURST: ReadonlyArray<{ angle: number, range: number }> = [
  { angle: 0, range: 40 }, { angle: 26, range: 30 }, { angle: 52, range: 44 }, { angle: 78, range: 34 }, { angle: 104, range: 38 }, { angle: 130, range: 28 }, { angle: 156, range: 46 },
  { angle: 182, range: 32 }, { angle: 208, range: 42 }, { angle: 234, range: 36 }, { angle: 260, range: 30 }, { angle: 286, range: 44 }, { angle: 312, range: 34 }, { angle: 338, range: 40 }
]

/** Refus du tirage au sort (B-26) par type de tirage : le tour se saisit alors à la main, ou la tête de série manquante se place d'abord. */
export const RANDOM_DRAW_ERROR_MESSAGES: Record<DRAW_KIND, Partial<Record<API_ERROR_CODE, ITranslatableText>>> = {
  [DRAW_KIND.POOLS]: {
    [API_ERROR_CODE.DRAW_INCONSISTENT]: { key: 'admin.random_draw.errors.pools_inconsistent', fallback: 'Le tirage au sort est impossible : une tête de série n’est pas encore placée dans une poule, ou les poules saisies n’ont plus de place. Corrigez à la main.' }
  },
  [DRAW_KIND.ROUND]: {
    [API_ERROR_CODE.DRAW_INCONSISTENT]: { key: 'admin.random_draw.errors.round_inconsistent', fallback: 'Le tirage au sort est impossible : le vivier est impair ou la taille du tour n’est pas tenue, saisissez ce tour à la main.' }
  }
}
