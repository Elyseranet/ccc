import { computed, ref, watch } from 'vue'
import { useAdminEditionStore } from '~/composables/useAdminEditionStore'
import { useEditions } from '~/composables/useEditions'
import { PARTICIPANT_EDITABLE_STATUSES } from '~/consts/edition.const'
import { POOL_DRAW_DRAFTS_CACHE_KEY, POOL_DRAW_PROPOSAL_CACHE_KEY, POOL_DRAW_RESTART_CODES } from '~/consts/pool-draw.const'
import { DRAW_KIND, DRAW_STATUS } from '~/enums/draw.enum'
import { POOL_DRAW_FEEDBACK_STATUS, POOL_DRAW_SAVE_STATE, POOL_DRAW_STEP } from '~/enums/pool-draw.enum'
import type { IAdminDraw, ISeedProposal } from '~/interfaces/draw.interface'
import type { ITranslatableText } from '~/interfaces/common-components.interface'
import type { IPoolDrawFeedback, IPoolDrawLastSaved, IPoolDrawPool } from '~/interfaces/pool-draw.interface'
import { DrawService } from '~/services/draw.service'
import { EditionService } from '~/services/edition.service'
import {
  buildAssignments,
  buildEmptyPools,
  buildPoolsFromDraft,
  buildSteps,
  defaultTieChoices,
  drawProgress,
  findTieGroups,
  hasPoolDrawErrorCode,
  isDrawComplete,
  parameterIssue,
  placePlayer,
  replacePlayer,
  selectedSeedIds,
  suggestPoolCount,
  tieChoicesComplete,
  toPlayers,
  toPoolDrawError,
  unplacedPlayers
} from '~/utils/pool-draw.util'

/*********************************************************
 * usePoolDraw
 *
 * @description
 * Tirage physique des poules de l'édition active de l'admin (F-11, A1, RG9 à RG12) : étapes, têtes de série (avec le choix de
 * l'administrateur sur une égalité non tranchée, RG10), saisie poule après poule, brouillon enregistré à chaque affectation et
 * validation. Toute la logique pure est dans `pool-draw.util` ; ce composable branche les appels, l'état et les retours.
 * Aucun tirage au sort ici : on enregistre ce que l'administrateur saisit. Les `useAsyncData` sont appelés avant tout `await`.
 * Une seule écriture du brouillon à la fois : les affectations rapprochées partent à la suite, chacune avec l'état de la saisie
 * à son moment (exactement un `PUT` par affectation). Une affectation non enregistrée reste signalée et se renvoie.
 ********************************************************/
export const usePoolDraw = async () => {
  const fetcher = useRequestFetch()
  const drawService = new DrawService({ fetcher })
  const editionService = new EditionService({ fetcher })
  const store = useAdminEditionStore()
  const { data: editions } = useEditions()
  const editionId = computed(() => store.editionId)
  const edition = computed(() => (editions.value ?? []).find(item => item.id === editionId.value) ?? null)

  const detailRequest = useAsyncData(
    `${POOL_DRAW_PROPOSAL_CACHE_KEY}-edition`,
    async () => (editionId.value ? editionService.detail(editionId.value) : null),
    { watch: [editionId], default: () => null }
  )
  const draftsRequest = useAsyncData(
    POOL_DRAW_DRAFTS_CACHE_KEY,
    async () => (editionId.value ? drawService.adminList(editionId.value) : []),
    { watch: [editionId], default: () => [] }
  )
  await Promise.all([detailRequest, draftsRequest])

  const players = computed(() => toPlayers(detailRequest.data.value?.participants ?? []))
  const total = computed(() => players.value.length)
  const poolsDraw = computed<IAdminDraw | null>(() => (draftsRequest.data.value ?? []).filter(draw => draw.kind === DRAW_KIND.POOLS).at(-1) ?? null)
  const isValidated = computed(() => poolsDraw.value?.status === DRAW_STATUS.VALIDATED)
  const isClosed = computed(() => edition.value !== null && !PARTICIPANT_EDITABLE_STATUSES.includes(edition.value.status) && !isValidated.value)
  const isReadOnly = computed(() => isValidated.value || isClosed.value)
  const loadError = computed(() => detailRequest.error.value ?? draftsRequest.error.value ?? null)

  /*********************************************************
   * État de la saisie
   ********************************************************/
  const step = ref<POOL_DRAW_STEP>(POOL_DRAW_STEP.PARAMETERS)
  const poolCount = ref(suggestPoolCount(total.value))
  const proposal = ref<ISeedProposal | null>(null)
  const tieChoices = ref<Record<number, string[]>>({})
  const draft = ref<IAdminDraw | null>(null)
  const pools = ref<IPoolDrawPool[]>([])
  const saveState = ref<POOL_DRAW_SAVE_STATE>(POOL_DRAW_SAVE_STATE.IDLE)
  const lastSaved = ref<IPoolDrawLastSaved | null>(null)
  const feedback = ref<IPoolDrawFeedback | null>(null)
  const busy = ref(false)
  const needsRestart = ref(false)

  const notify = (status: POOL_DRAW_FEEDBACK_STATUS, message: ITranslatableText) => {
    feedback.value = { status, message }
  }
  const dismissFeedback = () => {
    feedback.value = null
  }
  const fail = (cause: unknown) => {
    needsRestart.value = hasPoolDrawErrorCode(cause, POOL_DRAW_RESTART_CODES)
    notify(POOL_DRAW_FEEDBACK_STATUS.ERROR, toPoolDrawError(cause))
  }

  /** Reprend l'état du serveur : un brouillon rouvre la saisie, un tirage validé donne la lecture seule. */
  const hydrate = () => {
    const current = poolsDraw.value
    if (!current) {
      draft.value = null
      pools.value = []
      step.value = POOL_DRAW_STEP.PARAMETERS
      return
    }
    draft.value = current
    pools.value = buildPoolsFromDraft(current, total.value)
    poolCount.value = current.parameters.poolCount
    step.value = current.status === DRAW_STATUS.VALIDATED ? POOL_DRAW_STEP.VALIDATION : POOL_DRAW_STEP.ENTRY
  }
  hydrate()
  watch(editionId, () => {
    proposal.value = null
    hydrate()
  })

  /*********************************************************
   * Étapes 1 et 2 : paramètres, têtes de série
   ********************************************************/
  const tieGroups = computed(() => (proposal.value ? findTieGroups(proposal.value, players.value) : []))
  const seedIds = computed(() => (proposal.value ? selectedSeedIds(proposal.value, tieGroups.value, tieChoices.value) : []))
  const parametersIssue = computed(() => parameterIssue(poolCount.value, poolCount.value, total.value))
  const seedsIssue = computed(() => parameterIssue(poolCount.value, seedIds.value.length, total.value))
  const canConfirmSeeds = computed(() => proposal.value !== null && seedsIssue.value === null && tieChoicesComplete(tieGroups.value, tieChoices.value))

  const loadSeeds = async (): Promise<boolean> => {
    if (!editionId.value || parametersIssue.value !== null || busy.value) {
      return false
    }
    busy.value = true
    try {
      proposal.value = await drawService.seedProposal(editionId.value, poolCount.value)
      tieChoices.value = defaultTieChoices(proposal.value, findTieGroups(proposal.value, players.value))
      step.value = POOL_DRAW_STEP.SEEDS
      return true
    } catch (cause) {
      fail(cause)
      return false
    } finally {
      busy.value = false
    }
  }

  const toggleTieChoice = (groupIndex: number, participationId: string) => {
    const group = tieGroups.value.find(entry => entry.index === groupIndex)
    if (!group) {
      return
    }
    const current = tieChoices.value[groupIndex] ?? []
    const next = current.includes(participationId)
      ? current.filter(id => id !== participationId)
      : (current.length < group.needed ? [...current, participationId] : current)
    tieChoices.value = { ...tieChoices.value, [groupIndex]: next }
  }

  const confirmSeeds = async (): Promise<boolean> => {
    if (!editionId.value || !canConfirmSeeds.value || busy.value) {
      return false
    }
    busy.value = true
    try {
      const created = await drawService.createPoolDraft(editionId.value, { poolCount: poolCount.value, seedCount: seedIds.value.length, seeds: seedIds.value })
      draft.value = created
      pools.value = buildEmptyPools(seedIds.value, total.value)
      saveState.value = POOL_DRAW_SAVE_STATE.IDLE
      lastSaved.value = null
      needsRestart.value = false
      step.value = POOL_DRAW_STEP.ENTRY
      await draftsRequest.refresh()
      return true
    } catch (cause) {
      fail(cause)
      return false
    } finally {
      busy.value = false
    }
  }

  /*********************************************************
   * Étape 3 : saisie, un `PUT` par affectation
   ********************************************************/
  let queue: Promise<void> = Promise.resolve()

  const sendDraft = async (snapshot: IPoolDrawPool[], last: IPoolDrawLastSaved | null): Promise<void> => {
    const current = draft.value
    if (!current) {
      return
    }
    saveState.value = POOL_DRAW_SAVE_STATE.SAVING
    try {
      draft.value = await drawService.saveAssignments(current.id, { assignments: buildAssignments(snapshot) })
      saveState.value = POOL_DRAW_SAVE_STATE.SAVED
      lastSaved.value = last
      needsRestart.value = false
    } catch (cause) {
      saveState.value = POOL_DRAW_SAVE_STATE.FAILED
      fail(cause)
    }
  }

  const enqueueSave = (last: IPoolDrawLastSaved | null) => {
    const snapshot = pools.value.map(pool => ({ ...pool, members: [...pool.members] }))
    queue = queue.then(() => sendDraft(snapshot, last))
    return queue
  }

  const progressNow = () => drawProgress(pools.value, total.value)

  const assign = async (poolNumber: number, participationId: string): Promise<void> => {
    if (isReadOnly.value || step.value !== POOL_DRAW_STEP.ENTRY) {
      return
    }
    const next = placePlayer(pools.value, poolNumber, participationId)
    if (next === pools.value) {
      return
    }
    pools.value = next
    const pool = next.find(entry => entry.number === poolNumber)
    const progress = progressNow()
    await enqueueSave({ poolNumber, place: pool?.members.length ?? 0, placed: progress.placed, total: progress.total })
  }

  const change = async (poolNumber: number, place: number, participationId: string): Promise<void> => {
    if (isReadOnly.value || step.value !== POOL_DRAW_STEP.ENTRY) {
      return
    }
    const next = replacePlayer(pools.value, poolNumber, place, participationId)
    if (next === pools.value) {
      return
    }
    pools.value = next
    const progress = progressNow()
    await enqueueSave({ poolNumber, place, placed: progress.placed, total: progress.total })
  }

  /** Renvoie la saisie courante après un échec : l'état local est la référence tant que le serveur ne l'a pas reçue. */
  const retrySave = async (): Promise<void> => {
    const progress = progressNow()
    await enqueueSave({ poolNumber: 0, place: 0, placed: progress.placed, total: progress.total })
  }

  /*********************************************************
   * Étapes 4 et 5 : récapitulatif, validation, recommencer
   ********************************************************/
  const unplaced = computed(() => unplacedPlayers(players.value, pools.value))
  const progress = computed(() => drawProgress(pools.value, total.value))
  const isComplete = computed(() => isDrawComplete(pools.value, total.value))
  const canValidate = computed(() => isComplete.value && !isReadOnly.value && saveState.value !== POOL_DRAW_SAVE_STATE.FAILED && saveState.value !== POOL_DRAW_SAVE_STATE.SAVING)

  const goToRecap = () => {
    if (isComplete.value && step.value === POOL_DRAW_STEP.ENTRY) {
      step.value = POOL_DRAW_STEP.RECAP
    }
  }
  const goToValidation = () => {
    if (canValidate.value && step.value === POOL_DRAW_STEP.RECAP) {
      step.value = POOL_DRAW_STEP.VALIDATION
    }
  }
  const backToEntry = () => {
    if (!isReadOnly.value && (step.value === POOL_DRAW_STEP.RECAP || step.value === POOL_DRAW_STEP.VALIDATION)) {
      step.value = POOL_DRAW_STEP.ENTRY
    }
  }

  const validate = async (): Promise<boolean> => {
    const current = draft.value
    if (!current || !canValidate.value || busy.value) {
      return false
    }
    busy.value = true
    try {
      draft.value = await drawService.validate(current.id)
      notify(POOL_DRAW_FEEDBACK_STATUS.SUCCESS, { key: 'admin.draws.feedback_validated', fallback: 'Tirage validé : les poules et leurs matchs sont créés.' })
      await Promise.all([draftsRequest.refresh(), refreshNuxtData('editions')])
      hydrate()
      return true
    } catch (cause) {
      fail(cause)
      return false
    } finally {
      busy.value = false
    }
  }

  /** « Recommencer le tirage » : revient aux paramètres ; le brouillon du serveur est remplacé à la prochaine création. */
  const restart = () => {
    if (isReadOnly.value) {
      return
    }
    proposal.value = null
    pools.value = []
    needsRestart.value = false
    dismissFeedback()
    step.value = POOL_DRAW_STEP.PARAMETERS
  }

  const reload = async () => {
    await Promise.all([detailRequest.refresh(), draftsRequest.refresh()])
    hydrate()
  }

  const steps = computed(() => buildSteps(step.value))

  return {
    edition, step, steps, players, total, poolCount, proposal, tieGroups, tieChoices, seedIds, parametersIssue, seedsIssue, canConfirmSeeds,
    draft, pools, unplaced, progress, isComplete, canValidate, saveState, lastSaved, feedback, busy, needsRestart,
    isValidated, isClosed, isReadOnly, loadError,
    loadSeeds, toggleTieChoice, confirmSeeds, assign, change, retrySave, goToRecap, goToValidation, backToEntry, validate, restart, reload, dismissFeedback
  }
}
