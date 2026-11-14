import { computed, ref, toValue, watch } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import { SCORE_FAILURES_RELOADING } from '~/consts/score-entry.const'
import { MATCH_STATUS } from '~/enums/match.enum'
import { SCORE_ENTRY_PHASE, SCORE_ENTRY_SUCCESS } from '~/enums/score-entry.enum'
import type { SCORE_FAILURE } from '~/enums/score-entry.enum'
import type { IAdminMatch } from '~/interfaces/admin-match.interface'
import type { IScoreEntryRules, IUseScoreEntryOptions } from '~/interfaces/score-entry.interface'
import { MatchService } from '~/services/match.service'
import { initialScoreInputs } from '~/utils/admin-match.util'
import { toScoreFailure } from '~/utils/score-failure.util'
import { validateScoreEntry } from '~/utils/score-entry.util'

/*********************************************************
 * useScoreEntry
 *
 * @description
 * Saisie du score d'un match : à jouer -> saisi (« Enregistrer ») -> validé (« Valider »). RG22 est contrôlé avant tout envoi
 * (cible portée par le match). Les erreurs de champ n'apparaissent qu'après une première tentative (`validate-on="submit"`).
 * Double envoi bloqué : la phase quitte IDLE de façon synchrone, avant le premier `await`, donc un second clic rapide est
 * ignoré et un seul appel part.
 * Contrôle de version (SEC-Q) : chaque écriture envoie la version du match lu ; la version de la réponse remplace celle-ci,
 * ce qui permet d'enchaîner saisie puis validation sans relire. « Valider » enregistre d'abord un score nouveau ou modifié.
 * 412 / 409 : la ligne est périmée, `onStale` la fait recharger. 428 et 409 `SCORE_MISMATCH` sont des défauts du front.
 ********************************************************/
export const useScoreEntry = (match: MaybeRefOrGetter<IAdminMatch | null>, options: IUseScoreEntryOptions) => {
  const service = options.service ?? new MatchService({ fetcher: useRequestFetch() })
  const values = ref<string[]>([])
  const phase = ref<SCORE_ENTRY_PHASE>(SCORE_ENTRY_PHASE.IDLE)
  const failure = ref<SCORE_FAILURE | null>(null)
  const submitted = ref(false)

  // Un autre match remet tout à zéro. Une autre version du MÊME match (le rechargement que déclenche un 412 / 409) relit les scores mais garde l'échec affiché : sans cela le message
  // « modifié, rechargez » disparaît dès que la file est rechargée, parfois avant qu'on ait pu le lire (T-QA-10). Une saisie ou un envoi suivant l'efface (`setValue`, `run`).
  watch(() => [toValue(match)?.id, toValue(match)?.version], ([id], previous) => {
    const current = toValue(match)
    values.value = current ? initialScoreInputs(current) : []
    submitted.value = false
    if (id !== previous?.[0]) {
      failure.value = null
    }
  }, { immediate: true })

  const rules = computed<IScoreEntryRules | null>(() => {
    const current = toValue(match)
    return current ? { roundKind: current.roundKind, purpose: current.purpose, targetScore: current.targetScore } : null
  })
  const target = computed(() => rules.value?.targetScore ?? 0)
  const validation = computed(() => rules.value
    ? validateScoreEntry(rules.value, values.value)
    : { valid: false, fieldErrors: [], formError: null, scores: [] })
  const fieldErrors = computed(() => submitted.value ? validation.value.fieldErrors : values.value.map(() => null))
  const formError = computed(() => submitted.value ? validation.value.formError : null)
  const isBusy = computed(() => phase.value !== SCORE_ENTRY_PHASE.IDLE)
  const isWritable = computed(() => {
    const status = toValue(match)?.status
    return status === MATCH_STATUS.SCHEDULED || status === MATCH_STATUS.RECORDED
  })
  const canValidate = computed(() => isWritable.value && !isBusy.value)

  const setValue = (index: number, value: string) => {
    values.value = values.value.map((current, position) => position === index ? value : current)
    failure.value = null
  }

  const submissionOf = (current: IAdminMatch, scores: number[]) => ({
    scores: current.sides.map((side, index) => ({ participationId: side.participationId, score: scores[index]! }))
  })

  const isRecordedAs = (current: IAdminMatch, scores: number[]): boolean =>
    current.status === MATCH_STATUS.RECORDED && current.sides.every((side, index) => side.recordedScore === scores[index])

  const run = async (next: SCORE_ENTRY_PHASE, work: (current: IAdminMatch, scores: number[]) => Promise<void>): Promise<boolean> => {
    const current = toValue(match)
    if (!current || isBusy.value || !isWritable.value) {
      return false
    }
    phase.value = next
    submitted.value = true
    failure.value = null
    if (!validation.value.valid) {
      phase.value = SCORE_ENTRY_PHASE.IDLE
      return false
    }
    try {
      await work(current, validation.value.scores)
      return true
    } catch (cause) {
      failure.value = toScoreFailure(cause)
      if (SCORE_FAILURES_RELOADING.includes(failure.value)) {
        options.onStale()
      }
      return false
    } finally {
      phase.value = SCORE_ENTRY_PHASE.IDLE
    }
  }

  const save = () => run(SCORE_ENTRY_PHASE.SAVING, async (current, scores) => {
    const updated = await service.record(current.id, submissionOf(current, scores), current.version)
    options.onWritten(updated, SCORE_ENTRY_SUCCESS.SAVED)
  })

  const validate = () => run(SCORE_ENTRY_PHASE.VALIDATING, async (current, scores) => {
    let version = current.version
    if (!isRecordedAs(current, scores)) {
      const recorded = await service.record(current.id, submissionOf(current, scores), version)
      options.onWritten(recorded, SCORE_ENTRY_SUCCESS.SAVED)
      version = recorded.version
    }
    const result = await service.validate(current.id, submissionOf(current, scores), version)
    options.onWritten(result.match, SCORE_ENTRY_SUCCESS.VALIDATED)
  })

  return { values, phase, failure, target, fieldErrors, formError, isBusy, isWritable, canValidate, setValue, save, validate }
}
