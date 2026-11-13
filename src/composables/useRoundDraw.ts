import { computed, ref, watch } from 'vue'
import { useAdminEditionStore } from '~/composables/useAdminEditionStore'
import { useEditions } from '~/composables/useEditions'
import { ROUND_DRAW_DETAIL_CACHE_KEY, ROUND_DRAW_DRAFTS_CACHE_KEY, ROUND_DRAW_PREVIEW_CACHE_KEY } from '~/consts/round-draw.const'
import { DRAW_STATUS } from '~/enums/draw.enum'
import { EDITION_STATUS } from '~/enums/edition.enum'
import { FEEDBACK_STATUS } from '~/enums/feedback.enum'
import { POOL_DRAW_SAVE_STATE } from '~/enums/pool-draw.enum'
import { ROUND_DRAW_VIEW } from '~/enums/round-draw.enum'
import type { ROUND_KIND } from '~/enums/round.enum'
import type { ITranslatableText } from '~/interfaces/common-components.interface'
import type { IAdminDraw } from '~/interfaces/draw.interface'
import type { IRoundDrawFeedback, IRoundDrawPairing } from '~/interfaces/round-draw.interface'
import type { IRoundDrawPreview } from '~/interfaces/qualification.interface'
import type { TSidePosition } from '~/types/draw.type'
import { fromAsyncDataError, toAsyncDataError } from '~/utils/async-data-error.util'
import { DrawService } from '~/services/draw.service'
import { EditionService } from '~/services/edition.service'
import {
  buildEmptyPairings,
  buildPairingsFromDraft,
  buildRoundAssignments,
  clearPairing,
  currentRoundKind,
  drawablePlayers,
  inProgressRound,
  isStaleRoundDrawError,
  latestRoundDraw,
  leaderIdsOf,
  pairingTotal,
  placePlayer,
  recapRows,
  roundDrawProgress,
  roundSteps,
  toRoundDrawError,
  toRoundPlayers,
  unplacedPlayers,
  validationBlocker,
  viewOf
} from '~/utils/round-draw.util'

/*********************************************************
 * useRoundDraw
 *
 * @description
 * Tirage physique d'un tour de phase finale de l'édition active (F-25, A1, RG13, RG14) : l'aperçu du serveur (`GET …/tirages/tour`) décide de la vue, le brouillon est
 * enregistré à chaque affiche saisie (un `PUT` à la fois, remplacement complet), la validation crée le tour et ses matchs. Aucun tirage au sort : on enregistre ce que
 * l'administrateur saisit. Le brouillon n'est créé qu'au premier joueur placé quand le tour est déduit, ou par « Commencer le tirage » quand il se choisit.
 * Les `useAsyncData` partent avant le premier `await`. Une saisie non enregistrée reste signalée et se renvoie : l'état local est la référence tant que le serveur ne l'a pas reçue.
 ********************************************************/
export const useRoundDraw = async () => {
  const fetcher = useRequestFetch()
  const drawService = new DrawService({ fetcher })
  const editionService = new EditionService({ fetcher })
  const store = useAdminEditionStore()
  const { data: editions } = useEditions()
  const editionId = computed(() => store.editionId)
  const edition = computed(() => (editions.value ?? []).find(item => item.id === editionId.value) ?? null)

  /** Les lectures rendent l'erreur au format d'`AsyncState` (même recette que les autres pages admin). */
  const guarded = async <T>(read: () => Promise<T>): Promise<T> => {
    try {
      return await read()
    } catch (cause) {
      throw toAsyncDataError(cause)
    }
  }
  const detailRequest = useAsyncData(ROUND_DRAW_DETAIL_CACHE_KEY, async () => (editionId.value ? guarded(() => editionService.detail(editionId.value!)) : null), { watch: [editionId], default: () => null })
  const previewRequest = useAsyncData(ROUND_DRAW_PREVIEW_CACHE_KEY, async () => (editionId.value ? guarded(() => drawService.roundPreview(editionId.value!)) : null), { watch: [editionId], default: () => null })
  const draftsRequest = useAsyncData(ROUND_DRAW_DRAFTS_CACHE_KEY, async () => (editionId.value ? guarded(() => drawService.adminList(editionId.value!)) : []), { watch: [editionId], default: () => [] })
  await Promise.all([detailRequest, previewRequest, draftsRequest])

  const detail = computed(() => detailRequest.data.value)
  const preview = computed<IRoundDrawPreview | null>(() => previewRequest.data.value)
  const rounds = computed(() => detail.value?.rounds ?? [])
  const latestDraw = computed<IAdminDraw | null>(() => latestRoundDraw(draftsRequest.data.value ?? []))
  const rawError = computed(() => detailRequest.error.value ?? previewRequest.error.value ?? draftsRequest.error.value ?? null)
  const pageError = computed(() => (rawError.value ? fromAsyncDataError(rawError.value) : null))
  const pending = computed(() => detailRequest.pending.value || previewRequest.pending.value || draftsRequest.pending.value)
  const isClosed = computed(() => edition.value?.status === EDITION_STATUS.CLOSED)

  const view = computed<ROUND_DRAW_VIEW | null>(() => (preview.value ? viewOf(preview.value, latestDraw.value, rounds.value) : null))
  const roundKind = computed<ROUND_KIND | null>(() => (preview.value ? currentRoundKind(preview.value, latestDraw.value) : null))
  const leaders = computed(() => leaderIdsOf(detail.value?.pools ?? []))
  const players = computed(() => toRoundPlayers(preview.value?.candidates ?? [], leaders.value))
  const drawable = computed(() => (roundKind.value ? drawablePlayers(players.value, roundKind.value) : players.value))
  const total = computed(() => pairingTotal(drawable.value.length))
  const isReadOnly = computed(() => isClosed.value || view.value === ROUND_DRAW_VIEW.DRAWN || view.value === ROUND_DRAW_VIEW.FINISHED)

  /*********************************************************
   * État de la saisie
   ********************************************************/
  const draft = ref<IAdminDraw | null>(null)
  const pairings = ref<IRoundDrawPairing[]>([])
  const saveState = ref<POOL_DRAW_SAVE_STATE>(POOL_DRAW_SAVE_STATE.IDLE)
  const feedback = ref<IRoundDrawFeedback | null>(null)
  const busy = ref(false)
  const stale = ref(false)

  const notify = (status: FEEDBACK_STATUS, message: ITranslatableText) => {
    feedback.value = { status, message }
  }
  const dismissFeedback = () => {
    feedback.value = null
  }
  const fail = (cause: unknown) => {
    stale.value = isStaleRoundDrawError(cause)
    notify(FEEDBACK_STATUS.ERROR, toRoundDrawError(cause))
  }

  /** Reprend l'état du serveur : un brouillon rouvre la saisie avec ses affiches, sinon des affiches vides. */
  const hydrate = () => {
    const current = latestDraw.value?.status === DRAW_STATUS.DRAFT ? latestDraw.value : null
    draft.value = current
    pairings.value = current ? buildPairingsFromDraft(current, total.value) : buildEmptyPairings(total.value)
  }
  hydrate()
  watch(editionId, () => {
    hydrate()
  })

  const refreshAll = async () => {
    await Promise.all([detailRequest.refresh(), previewRequest.refresh(), draftsRequest.refresh(), refreshNuxtData('editions')])
    hydrate()
  }

  /*********************************************************
   * Tour à choisir, changer de tour
   ********************************************************/
  const startRound = async (kind: ROUND_KIND): Promise<boolean> => {
    if (!editionId.value || busy.value || isReadOnly.value) {
      return false
    }
    busy.value = true
    try {
      draft.value = await drawService.createRoundDraft(editionId.value, { roundKind: kind })
      pairings.value = buildEmptyPairings(pairingTotal(drawablePlayers(players.value, kind).length))
      saveState.value = POOL_DRAW_SAVE_STATE.IDLE
      stale.value = false
      await draftsRequest.refresh()
      return true
    } catch (cause) {
      fail(cause)
      return false
    } finally {
      busy.value = false
    }
  }

  /** « Changer de tour » : un nouveau brouillon remplace l'actuel et ses affiches ; le serveur refuse (409) si le tirage du tour est validé. */
  const changeRound = async (kind: ROUND_KIND): Promise<boolean> => startRound(kind)

  /*********************************************************
   * Saisie, un `PUT` par affiche
   ********************************************************/
  let queue: Promise<void> = Promise.resolve()

  const sendDraft = async (snapshot: IRoundDrawPairing[]): Promise<void> => {
    if (!editionId.value) {
      return
    }
    saveState.value = POOL_DRAW_SAVE_STATE.SAVING
    try {
      if (!draft.value) {
        draft.value = await drawService.createRoundDraft(editionId.value, {})
      }
      draft.value = await drawService.saveAssignments(draft.value.id, { assignments: buildRoundAssignments(snapshot) })
      saveState.value = POOL_DRAW_SAVE_STATE.SAVED
      stale.value = false
    } catch (cause) {
      saveState.value = POOL_DRAW_SAVE_STATE.FAILED
      fail(cause)
    }
  }

  const enqueueSave = () => {
    const snapshot = pairings.value.map(pairing => ({ ...pairing }))
    queue = queue.then(() => sendDraft(snapshot))
    return queue
  }

  const place = async (pairingIndex: number, participationId: string, position?: TSidePosition): Promise<void> => {
    if (isReadOnly.value || view.value !== ROUND_DRAW_VIEW.ENTRY) {
      return
    }
    const next = placePlayer(pairings.value, pairingIndex, participationId, position)
    if (next === pairings.value) {
      return
    }
    pairings.value = next
    await enqueueSave()
  }

  const change = async (pairingIndex: number): Promise<void> => {
    if (isReadOnly.value || view.value !== ROUND_DRAW_VIEW.ENTRY) {
      return
    }
    pairings.value = clearPairing(pairings.value, pairingIndex)
    await enqueueSave()
  }

  /** Renvoie la saisie courante après un échec. */
  const retrySave = async (): Promise<void> => {
    await enqueueSave()
  }

  /*********************************************************
   * Récapitulatif et validation
   ********************************************************/
  const unplaced = computed(() => unplacedPlayers(drawable.value, pairings.value))
  const progress = computed(() => roundDrawProgress(pairings.value, drawable.value.length))
  const blocker = computed(() => (roundKind.value ? validationBlocker(pairings.value, roundKind.value, saveState.value) : null))
  const canValidate = computed(() => roundKind.value !== null && blocker.value === null && !isReadOnly.value && draft.value !== null && !busy.value)
  const recap = computed(() => recapRows(pairings.value, players.value))

  const validate = async (): Promise<boolean> => {
    const current = draft.value
    if (!current || !canValidate.value) {
      return false
    }
    busy.value = true
    try {
      await queue
      draft.value = await drawService.validate(current.id)
      notify(FEEDBACK_STATUS.SUCCESS, { key: 'admin.round_draw.feedback_validated', fallback: 'Tirage validé : le tour et ses matchs sont créés.' })
      await refreshAll()
      return true
    } catch (cause) {
      fail(cause)
      return false
    } finally {
      busy.value = false
    }
  }

  const reload = async () => {
    stale.value = false
    dismissFeedback()
    await refreshAll()
  }

  /*********************************************************
   * Lecture seule
   ********************************************************/
  const drawnRound = computed(() => inProgressRound(rounds.value))
  const validatedDraw = computed(() => (latestDraw.value?.status === DRAW_STATUS.VALIDATED ? latestDraw.value : null))
  const steps = computed(() => roundSteps(rounds.value, view.value === ROUND_DRAW_VIEW.ENTRY || view.value === ROUND_DRAW_VIEW.CHOICE ? roundKind.value : null))

  return {
    edition, view, preview, rounds, roundKind, players, drawable, total, steps, draft, pairings, unplaced, progress, blocker, canValidate, recap, saveState,
    feedback, busy, stale, isClosed, isReadOnly, pageError, pending, drawnRound, validatedDraw,
    startRound, changeRound, place, change, retrySave, validate, reload, dismissFeedback
  }
}
