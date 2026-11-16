import type { DRAW_KIND } from '../enums/draw.enum.js'
import type { ITranslatableText } from './common-components.interface.js'
import type { IAdminDraw, IDrawAssignmentInput } from './draw.interface.js'
import type { IRandomDrawResult } from './random-draw.interface.js'

/** Ce que l'écran projecteur révèle (F-52) : une affiche (deux noms puis « VS ») ou un joueur et sa poule. */
export interface IDrawProjectorView {
  kind: DRAW_KIND
  /** Un nom en poules, deux en tour (côté 1 puis côté 2). */
  names: string[]
  poolNumber: number | null
  pairingIndex: number | null
  /** Rang de l'étape (joueur tiré ou affiche) et nombre d'étapes du tirage, pour le compteur « Affiche 4 / 8 ». */
  position: number
  total: number
}

/** Ce que le brouillon rend à l'élément qui vient d'être tiré (surbrillance au retour de la projection). */
export interface IDrawArrival {
  participationIds: string[]
  poolNumber: number | null
  pairingIndex: number | null
}

/** Branchement du tirage au sort sur l'écran de saisie (poules ou tour) : l'état local reste celui de l'écran. */
export interface IRandomDrawOptions {
  kind: DRAW_KIND
  draft: { value: IAdminDraw | null }
  /** Joueurs à tirer au total en poules (têtes de série comprises) ; affiches du tour en tour. */
  total: { readonly value: number }
  readOnly: { readonly value: boolean }
  /** Le brouillon, créé au besoin (un tour déduit n'a pas de brouillon avant la première saisie). */
  ensureDraft: () => Promise<IAdminDraw | null>
  /** Attend les enregistrements manuels en cours : le serveur repart de l'état complet du brouillon. */
  flush: () => Promise<void>
  /** Reprend le brouillon rendu par le serveur dans l'état de l'écran. */
  apply: (draw: IAdminDraw) => void
  refresh: () => Promise<void>
  fail: (cause: unknown) => void
  /** Message d'erreur propre au tirage au sort (refus 409 DRAW_INCONSISTENT). */
  notifyError: (message: ITranslatableText) => void
  randomDraw: (drawId: string) => Promise<IRandomDrawResult>
  saveAssignments: (drawId: string, body: { assignments: IDrawAssignmentInput[] }) => Promise<IAdminDraw>
}

export interface IDrawRandomBandProps {
  kind: DRAW_KIND
  /** Brouillon complet : plus de tirage, la validation existante est proposée. */
  complete: boolean
  /** « Recommencer le tirage… » est proposé : brouillon complet ou élément tiré par l'appli depuis l'ouverture de l'écran (maquette F-52 : pas pour une saisie purement manuelle). */
  restartable: boolean
  /** Nombre d'éléments du tirage (joueurs à placer ou affiches), pour le titre de l'état complet. */
  total: number
  drawing: boolean
  /** Premier tirage : « Tirer le premier joueur » ; ensuite « Tirer le joueur suivant ». */
  started: boolean
  /** Écran en lecture seule : pas de tirage. */
  disabled: boolean
}

export interface IDrawProjectorProps {
  view: IDrawProjectorView
  /** Marque et année de l'édition (« CCC 2026 »). */
  brand: string
  title: string
}

export interface IDrawRestartDialogProps {
  open: boolean
  busy: boolean
  kind: DRAW_KIND
  count: number
  /** Libellé du tour (« des huitièmes ») dans le titre ; vide en poules. */
  roundText: string
}
