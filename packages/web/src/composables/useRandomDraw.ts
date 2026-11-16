import { computed, nextTick, ref } from 'vue'
import { RANDOM_DRAW_ERROR_MESSAGES, RANDOM_DRAW_TRIGGER_SELECTOR } from '~/consts/random-draw.const'
import { API_ERROR_CODE } from '~/enums/api-error-code.enum'
import type { IDrawArrival, IDrawProjectorView, IRandomDrawOptions } from '~/interfaces/random-draw-screen.interface'
import { ApiRequestError } from '~/utils/api-request-error.util'
import { drawnCountOf, resetAssignmentsOf, toArrival, toFinalProjectorView, toProjectorView } from '~/utils/random-draw-view.util'

/*********************************************************
 * useRandomDraw
 *
 * @description
 * Tirage au sort pas à pas (F-52, B-26), commun aux poules et au tour : un clic tire UNE étape sur le serveur, l'écran projecteur la révèle, « Continuer » revient
 * à la liste où l'élément tiré est en surbrillance. Le brouillon reste celui de l'écran (`apply`) : la saisie manuelle et le tirage se mélangent, le serveur repart
 * toujours des joueurs restants. `flush` attend les enregistrements manuels en cours avant de tirer. « Recommencer » remet le brouillon à zéro par `PUT /affectations`
 * (têtes de série seules en poules, rien en tour) après confirmation. Aucune animation ici : la mise en scène est en CSS dans l'écran projecteur.
 ********************************************************/
export const useRandomDraw = (options: IRandomDrawOptions) => {
  const drawing = ref(false)
  const view = ref<IDrawProjectorView | null>(null)
  const arrival = ref<IDrawArrival | null>(null)
  const restartOpen = ref(false)
  const restarting = ref(false)
  let pending: IDrawArrival | null = null
  let trigger: HTMLElement | null = null

  const projectorOpen = computed(() => view.value !== null)
  const drawnCount = computed(() => drawnCountOf(options.kind, options.draft.value))

  const rememberTrigger = () => {
    trigger = import.meta.client && document.activeElement instanceof HTMLElement ? document.activeElement : null
  }

  /** Rend le focus au bouton de tirage (ou à son remplaçant si le brouillon complet l'a retiré de la page). */
  const restoreFocus = async () => {
    await nextTick()
    const target = trigger?.isConnected ? trigger : document.querySelector<HTMLElement>(RANDOM_DRAW_TRIGGER_SELECTOR)
    target?.focus()
    trigger = null
  }

  const reportFailure = async (cause: unknown): Promise<void> => {
    const known = cause instanceof ApiRequestError ? RANDOM_DRAW_ERROR_MESSAGES[options.kind][cause.error.code as API_ERROR_CODE] : undefined
    if (known) {
      options.notifyError(known)
    } else if (cause instanceof ApiRequestError && cause.error.code === API_ERROR_CODE.DRAW_DRAFT_COMPLETE) {
      await options.refresh()
    } else {
      options.fail(cause)
    }
  }

  const draw = async (): Promise<boolean> => {
    if (drawing.value || options.readOnly.value || projectorOpen.value) {
      return false
    }
    drawing.value = true
    rememberTrigger()
    try {
      await options.flush()
      const current = await options.ensureDraft()
      if (!current) {
        return false
      }
      const result = await options.randomDraw(current.id)
      options.apply(result.draw)
      arrival.value = null
      pending = toArrival(result)
      view.value = toProjectorView(options.kind, result, options.total.value)
      return true
    } catch (cause) {
      await reportFailure(cause)
      return false
    } finally {
      drawing.value = false
    }
  }

  /**
   * « Lancer la finale » (F-56) : tire l'affiche unique (sauf si le brouillon est déjà complet), valide le tirage par la route existante, puis ouvre l'écran projecteur.
   * Tout échec rend `false` et laisse le brouillon à l'écran, corrigeable.
   */
  const launchFinal = async (): Promise<boolean> => {
    if (drawing.value || options.readOnly.value || projectorOpen.value || !options.validate) {
      return false
    }
    drawing.value = true
    rememberTrigger()
    try {
      await options.flush()
      const current = await options.ensureDraft()
      if (!current) {
        return false
      }
      const drawn = options.draft.value?.assignments.length === 2 ? options.draft.value : (await options.randomDraw(current.id)).draw
      options.apply(drawn)
      if (!(await options.validate())) {
        return false
      }
      arrival.value = null
      pending = null
      view.value = toFinalProjectorView(drawn)
      return true
    } catch (cause) {
      await reportFailure(cause)
      return false
    } finally {
      drawing.value = false
    }
  }

  /** « Continuer » (et Échap) : retour à la liste, l'élément tiré s'allume une fois ; le focus revient au bouton. */
  const close = async (): Promise<void> => {
    if (!view.value) {
      return
    }
    view.value = null
    arrival.value = pending
    pending = null
    await restoreFocus()
  }

  const askRestart = () => {
    if (!options.readOnly.value && drawnCount.value > 0) {
      rememberTrigger()
      restartOpen.value = true
    }
  }
  const cancelRestart = async () => {
    restartOpen.value = false
    await restoreFocus()
  }

  const restart = async (): Promise<boolean> => {
    const current = options.draft.value
    if (!current || restarting.value || options.readOnly.value) {
      return false
    }
    restarting.value = true
    try {
      await options.flush()
      options.apply(await options.saveAssignments(current.id, { assignments: resetAssignmentsOf(options.kind, current) }))
      arrival.value = null
      restartOpen.value = false
      await restoreFocus()
      return true
    } catch (cause) {
      restartOpen.value = false
      options.fail(cause)
      return false
    } finally {
      restarting.value = false
    }
  }

  return { drawing, view, arrival, projectorOpen, drawnCount, restartOpen, restarting, draw, launchFinal, close, askRestart, cancelRestart, restart }
}
