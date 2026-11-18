<template>
  <section
    class="qualification-ties"
    :aria-labelledby="titleId"
    data-cy="qualification-ties"
  >
    <header class="qualification-ties__head">
      <h2
        :id="titleId"
        class="qualification-ties__title"
      >
        {{ title }}
      </h2>
      <p
        v-if="hasTies"
        class="qualification-ties__count"
        role="status"
        data-cy="qualification-ties-count"
      >
        {{ countText }}
      </p>
    </header>
    <origam-alert
      v-if="settled"
      status="info"
      density="compact"
      rounded="lg"
      role="status"
      :text="settledText"
      data-cy="qualification-no-ties"
    />
    <ul
      v-if="hasTies"
      class="qualification-ties__list"
    >
      <li
        v-for="tie in views"
        :key="tie.key"
        class="qualification-ties__item"
      >
        <origam-card
          rounded="xl"
          border
          elevation="md"
          class="qualification-ties__card"
          :data-cy="tie.dataCy"
        >
          <template #default>
            <p class="qualification-ties__eyebrow">
              {{ tie.eyebrow }}
            </p>
            <p class="qualification-ties__who">
              {{ tie.who }}
            </p>
            <p class="qualification-ties__muted">
              {{ tie.description }}
            </p>
            <p
              v-if="tie.showSlots"
              class="qualification-ties__muted"
            >
              {{ tie.slotsText }}
            </p>
            <p class="qualification-ties__status">
              <edition-chip
                v-for="chip in tie.chips"
                :key="chip.id"
                :family="chip.family"
                :text="chip.text"
              />
            </p>
            <template v-if="tie.openTiebreak">
              <div class="qualification-ties__acts">
                <origam-btn
                  variant="text"
                  color="primary"
                  font-size="sm"
                  padding-inline="4"
                  :to="scoreRoute"
                  :text="scoreLabel"
                  :data-cy="tie.scoreDataCy"
                />
                <origam-btn
                  variant="outlined"
                  font-size="sm"
                  padding-inline="calc(var(--origam-space---4) - var(--origam-border__width---2))"
                  aria-haspopup="dialog"
                  :disabled="tie.deleteDisabled"
                  :loading="tie.deleting"
                  :text="deleteLabel"
                  :data-cy="tie.deleteDataCy"
                  @click="handleAskDelete(tie.source)"
                />
              </div>
              <p
                class="qualification-ties__why"
                :data-cy="tie.deleteWhyDataCy"
              >
                {{ tie.deleteWhy }}
              </p>
            </template>
            <template v-else>
              <origam-btn
                variant="flat"
                :bg-color="tie.buttonColor"
                :elevation="tie.buttonElevation"
                font-size="sm"
                class="qualification-ties__create"
                padding-inline="4"
                :disabled="tie.disabled"
                :loading="tie.busy"
                :text="tie.buttonLabel"
                :data-cy="tie.buttonDataCy"
                @click="handleCreate(tie.source)"
              />
              <p
                v-if="tie.blockerText"
                class="qualification-ties__why"
                :data-cy="tie.whyDataCy"
              >
                {{ tie.blockerText }}
              </p>
            </template>
          </template>
        </origam-card>
      </li>
    </ul>
    <confirm-dialog
      :open="dialogOpen"
      :busy="isDeleting"
      :title="dialogTitle"
      :text="dialogText"
      :cancel-label="cancelLabel"
      :confirm-label="deleteLabel"
      cy-prefix="qualification-delete-tiebreak"
      confirm-color="danger"
      :appearance="dialogAppearance"
      @cancel="handleCancelDelete"
      @confirm="handleConfirmDelete"
    >
      <template #default>
        <p
          class="qualification-ties__effect"
          data-cy="qualification-delete-tiebreak-effect"
        >
          {{ dialogEffect }}
        </p>
      </template>
    </confirm-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { OrigamAlert, OrigamBtn, OrigamCard } from 'origam/components'
import ConfirmDialog from '~/components/common/ConfirmDialog.vue'
import EditionChip from '~/components/edition/EditionChip.vue'
import { useT } from '~/composables/useT'
import { ADMIN_MATCH_TIEBREAK_ON_VALUE, ADMIN_MATCH_TIEBREAK_QUERY_PARAM } from '~/consts/admin-match-filters.const'
import { PRIMARY_ACTION_BUTTON } from '~/consts/primary-action.const'
import { CONFIRM_DIALOG_APPEARANCE } from '~/enums/confirm-dialog.enum'
import { ROUTES } from '~/consts/routes.const'
import { TIEBREAK_FORMAT } from '~/enums/domain.enum'
import { EDITION_CHIP_FAMILY } from '~/enums/edition-tab.enum'
import { TIEBREAK_SCOPE } from '~/enums/qualification.enum'
import { blockerText, countTies } from '~/utils/qualification-text.util'
import type { IQualificationTieView, IQualificationTiesEmits, IQualificationTiesProps } from '~/interfaces/qualification-view.interface'

/*********************************************************
 * Global
 *
 * @description
 * Une carte par égalité à départager, dans l'ordre du serveur (source de vérité : égalités, départage suivant et places restantes viennent de
 * `GET …/qualification`, rien n'est calculé ici). 2 joueurs : un match 1 contre 1 à 5. 3 joueurs ou plus : un seul match à N côtés, premier à 3
 * (A11, R-1). La création est inactive tant que des matchs de poule restent à valider, ou qu'un départage de ce groupe attend son score ; la raison
 * est écrite sous le bouton. Le score se saisit dans « Poules et matchs », filtre « Départages seulement » (décision c9790abd (2)) : lien direct, aucune saisie ici.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IQualificationTiesProps>(), {})
const emits = defineEmits<IQualificationTiesEmits>()
defineSlots<{}>()
const titleId = useId()
const scoreRoute = `${ROUTES.ADMIN_MATCHES}?${ADMIN_MATCH_TIEBREAK_QUERY_PARAM}=${ADMIN_MATCH_TIEBREAK_ON_VALUE}`
const hasTies = computed(() => props.ties.length > 0)
const title = computed(() => t('admin.qualification.ties_title', '2 · Égalités à départager'))
const countText = computed(() => t('admin.qualification.ties_count', '{ties} pour une place qualificative', { ties: countTies(t, props.ties.length) }))
const settledText = computed(() => t('admin.qualification.ties_none', 'Aucune égalité à départager. Vous pouvez passer aux paramètres.'))
const scoreLabel = computed(() => t('admin.qualification.ties_score_link', 'Saisir le score dans « Poules et matchs » →'))

/*********************************************************
 * Cartes
 *
 * @description
 * Tous les textes sont calculés ici ; le gabarit ne fait que les afficher. Le rang d'une place s'écrit « 2e », « 1re » (clés dédiées : la langue décide).
 ********************************************************/
const ordinal = (rank: number): string => rank === 1
  ? t('admin.qualification.ordinal_first', '{n}re', { n: rank })
  : t('admin.qualification.ordinal_other', '{n}e', { n: rank })
const eyebrowOf = (tie: IQualificationTieView): string => {
  const params = { place: ordinal(tie.placeRank), count: tie.members.length }
  return tie.scope === TIEBREAK_SCOPE.POOL
    ? t('admin.qualification.tie_pool_eyebrow', 'Poule {rank} · {place} place · {count} joueurs', { ...params, rank: tie.poolRank ?? 0 })
    : t('admin.qualification.tie_boundary_eyebrow', 'Meilleur {place} entre poules · {count} joueurs', params)
}
const descriptionOf = (tie: IQualificationTieView): string => {
  if (tie.format === TIEBREAK_FORMAT.ONE_VS_ONE) {
    return t('admin.qualification.tie_one_vs_one', 'Match 1 contre 1, cible 5 points.')
  }
  return tie.scope === TIEBREAK_SCOPE.POOL
    ? t('admin.qualification.tie_pool_multi', 'Mini-poule d’abord (confrontation directe), puis match à {count} côtés, premier à 3 points.', { count: tie.members.length })
    : t('admin.qualification.tie_boundary_multi', 'Un seul match à {count} côtés, premier à 3 points.', { count: tie.members.length })
}
const chipsOf = (tie: IQualificationTieView) => [
  ...(tie.openTiebreak
    ? [
        { id: 'created', family: EDITION_CHIP_FAMILY.TINTED_INFO, text: t('admin.qualification.tie_status_created', 'Départage créé · {number}', { number: tie.openTiebreak.number }) },
        tie.openTiebreak.played
          ? { id: 'played', family: EDITION_CHIP_FAMILY.TINTED_WARNING, text: t('admin.qualification.tie_status_recorded', 'Saisi · à valider') }
          : { id: 'scheduled', family: EDITION_CHIP_FAMILY.NEUTRAL, text: t('admin.qualification.tie_status_scheduled', 'À jouer') }
      ]
    : [{ id: 'none', family: EDITION_CHIP_FAMILY.NEUTRAL, text: t('admin.qualification.tie_status_none', 'Départage non créé') }]),
  ...(tie.isFollowUp ? [{ id: 'previous', family: EDITION_CHIP_FAMILY.TINTED_SUCCESS, text: t('admin.qualification.tie_status_previous', 'Départage précédent validé') }] : [])
]
const deleteLabel = computed(() => t('admin.qualification.tie_delete', 'Supprimer le départage'))
const deleteWhyOf = (tie: IQualificationTieView): string => {
  if (tie.openTiebreak?.played) {
    return t('admin.qualification.tie_delete_played', 'Indisponible : départage joué.')
  }
  return tie.poolRank === null
    ? t('admin.qualification.tie_delete_why_boundary', 'Tant que ce départage existe, les scores des poules ne peuvent pas être corrigés.')
    : t('admin.qualification.tie_delete_why_pool', 'Tant que ce départage existe, les scores de la poule {rank} ne peuvent pas être corrigés.', { rank: tie.poolRank })
}
const views = computed(() => props.ties.map((tie, index) => {
  const blocker = tie.blocker
  return {
    source: tie,
    key: tie.key,
    dataCy: `qualification-tie-${index}`,
    eyebrow: eyebrowOf(tie),
    who: tie.members.map(member => member.displayName).join(', '),
    description: descriptionOf(tie),
    showSlots: tie.slots > 0,
    slotsText: t('admin.qualification.tie_slots', 'Places restantes : {slots}.', { slots: tie.slots }),
    chips: chipsOf(tie),
    openTiebreak: tie.openTiebreak,
    deleteDisabled: tie.openTiebreak?.played === true || props.deletingTie !== null || props.busyTie !== null,
    deleting: props.deletingTie === tie.key,
    deleteDataCy: `qualification-delete-tiebreak-${index}`,
    deleteWhy: deleteWhyOf(tie),
    deleteWhyDataCy: `qualification-tie-delete-why-${index}`,
    disabled: blocker !== null || props.busyTie !== null,
    busy: props.busyTie === tie.key,
    buttonColor: blocker !== null || props.busyTie !== null ? undefined : PRIMARY_ACTION_BUTTON.color,
    buttonElevation: blocker !== null || props.busyTie !== null ? undefined : PRIMARY_ACTION_BUTTON.elevation,
    buttonLabel: tie.isFollowUp ? t('admin.qualification.tie_create_next', 'Créer le départage suivant') : t('admin.qualification.tie_create', 'Créer le départage'),
    buttonDataCy: `qualification-create-tiebreak-${index}`,
    blockerText: blocker === null ? null : blockerText(t, blocker, props.pendingCount, props.ties.length),
    whyDataCy: `qualification-tie-why-${index}`,
    scoreDataCy: `qualification-tie-score-link-${index}`
  }
}))
const handleCreate = (tie: IQualificationTieView) => {
  emits('create', tie)
}

/*********************************************************
 * Suppression d'un départage
 *
 * @description
 * « Supprimer le départage » ouvre une confirmation (maquette F-44, DIALOG-THEME) : le dialogue dit quel départage (joueurs, numéro du match) et ce que la suppression
 * rend possible. Il reste ouvert pendant l'envoi et se ferme à la fin, succès ou échec ; le message d'échec est celui de la page. Un départage joué n'est pas supprimable
 * (bouton inactif, raison dessous) ; si le serveur répond quand même 409 `TIEBREAK_PLAYED`, la page l'écrit et propose de recharger.
 ********************************************************/
const dialogAppearance = CONFIRM_DIALOG_APPEARANCE.MOCKUP
const pendingDelete = ref<IQualificationTieView | null>(null)
const dialogOpen = computed(() => pendingDelete.value !== null)
const isDeleting = computed(() => props.deletingTie !== null)
const namesOf = (tie: IQualificationTieView): string => {
  const names = tie.members.map(member => member.displayName)
  return names.length < 2
    ? names.join('')
    : `${names.slice(0, -1).join(', ')}${t('admin.qualification.names_and', ' et ')}${names[names.length - 1]}`
}
const dialogTitle = computed(() => t('admin.qualification.tie_delete_title', 'Supprimer le départage ?'))
const dialogText = computed(() => pendingDelete.value?.openTiebreak
  ? t('admin.qualification.tie_delete_text', 'Le départage entre {names} (match {number}) n’a pas été joué. Il est supprimé et l’égalité redevient « à départager ».', { names: namesOf(pendingDelete.value), number: pendingDelete.value.openTiebreak.number })
  : '')
const dialogEffect = computed(() => {
  const tie = pendingDelete.value
  if (!tie) {
    return ''
  }
  return tie.poolRank === null
    ? t('admin.qualification.tie_delete_effect_boundary', 'Les scores des poules peuvent alors être corrigés.')
    : t('admin.qualification.tie_delete_effect_pool', 'Les scores de la poule {rank} peuvent alors être corrigés.', { rank: tie.poolRank })
})
const cancelLabel = computed(() => t('admin.qualification.dialog_cancel', 'Annuler'))
const handleAskDelete = (tie: IQualificationTieView) => {
  pendingDelete.value = tie
}
const handleCancelDelete = () => {
  pendingDelete.value = null
}
const handleConfirmDelete = () => {
  if (pendingDelete.value) {
    emits('delete', pendingDelete.value)
  }
}
watch(() => props.deletingTie, (now, was) => {
  if (was !== null && now === null) {
    pendingDelete.value = null
  }
})

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.qualification-ties {
  margin-top: var(--qualification-ties---margin-top, var(--origam-space---6));

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--origam-space---3);
    margin-bottom: var(--origam-space---4);
  }

  &__title {
    margin: 0;
    font-size: var(--origam-font__size---xl);
    font-weight: var(--origam-font__weight---bold);
    line-height: var(--origam-font__lineHeight---tight);
  }

  &__count {
    margin: 0;
    color: var(--origam-color__text---secondary);
  }

  &__list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--qualification-ties__list---gap, var(--origam-space---4));
    margin: 0;
    padding: 0;
    list-style: none;

    @media (max-width: 1000px) {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  &__card {
    display: grid;
    align-content: start;
    justify-items: start;
    gap: var(--origam-space---2);
    padding: var(--qualification-ties__card---padding, var(--origam-space---6));

    @media (max-width: 760px) {
      padding: var(--origam-space---5);
    }
  }

  &__eyebrow {
    margin: 0;
    color: var(--origam-color__text---tertiary);
    font-size: var(--origam-font__size---xs);
    font-weight: var(--origam-font__weight---bold);
    letter-spacing: var(--origam-font__letterSpacing---wider);
    text-transform: uppercase;
  }

  &__who {
    margin: 0;
    font-weight: var(--origam-font__weight---bold);
  }

  &__muted {
    margin: 0;
    color: var(--origam-color__text---secondary);
  }

  &__status {
    display: flex;
    flex-wrap: wrap;
    gap: var(--origam-space---2);
    margin: 0;
  }

  &__acts {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--origam-space---2) var(--origam-space---3);
  }

  &__effect {
    margin: 0;
  }

  &__why {
    margin: var(--origam-space---3) 0 0;
    color: var(--origam-color__text---secondary);
    font-size: var(--origam-font__size---sm);
  }
}
</style>

<style>
:root {
  --qualification-ties__card---padding: var(--origam-space---6);
  --qualification-ties---margin-top: var(--origam-space---6);
  --qualification-ties__list---gap: var(--origam-space---4);
}
</style>
