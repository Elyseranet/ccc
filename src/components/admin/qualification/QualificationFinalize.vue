<template>
  <origam-card
    tag="section"
    rounded="xl"
    border
    elevation="md"
    padding="6"
    :aria-labelledby="titleId"
    class="qualification-finalize"
    data-cy="qualification-finalize"
  >
    <template #default>
      <header class="qualification-finalize__head">
        <h2
          :id="titleId"
          class="qualification-finalize__title"
        >
          {{ title }}
        </h2>
      </header>
      <div
        v-if="hasRows"
        class="qualification-finalize__scroll"
        data-cy="qualification-qualified"
      >
        <app-data-table
          :headers="headers"
          :items="rowViews"
          :caption="caption"
          hide-default-footer
          class="qualification-finalize__table"
        >
          <template #item.player="{ item }">
            <strong>{{ item.competitor.displayName }}</strong>
          </template>
          <template #item.route="{ item }">
            <edition-chip
              :family="item.family"
              :text="item.routeText"
            />
          </template>
        </app-data-table>
      </div>
      <p
        v-else
        class="qualification-finalize__empty"
        data-cy="qualification-qualified-empty"
      >
        {{ emptyText }}
      </p>
      <div
        v-if="!finalized"
        class="qualification-finalize__action"
      >
        <origam-btn
          variant="flat"
          bg-color="primary"
          elevation="lg"
          size="large"
          aria-haspopup="dialog"
          :disabled="isBlocked"
          :loading="busy"
          :text="buttonLabel"
          data-cy="qualification-finalize-open"
          @click="handleOpen"
        />
        <p
          v-if="blockerText"
          class="qualification-finalize__why"
          data-cy="qualification-finalize-why"
        >
          {{ blockerText }}
        </p>
      </div>
      <confirm-dialog
        :open="dialogOpen"
        :busy="busy"
        :title="dialogTitle"
        :text="dialogText"
        :cancel-label="cancelLabel"
        :confirm-label="confirmLabel"
        cy-prefix="qualification-finalize"
        confirm-color="primary"
        confirm-elevation="lg"
        @cancel="handleCancel"
        @confirm="handleConfirm"
      />
    </template>
  </origam-card>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { ALIGN } from 'origam/enums'
import type { IDataTableHeader } from 'origam/interfaces'
import { OrigamBtn, OrigamCard } from 'origam/components'
import AppDataTable from '~/components/common/AppDataTable.vue'
import ConfirmDialog from '~/components/common/ConfirmDialog.vue'
import EditionChip from '~/components/edition/EditionChip.vue'
import { useT } from '~/composables/useT'
import { QUALIFICATION_ROUTE_VIEW } from '~/consts/qualification-view.const'
import { EDITION_CHIP_FAMILY } from '~/enums/edition-tab.enum'
import { QUALIFIED_COLUMN } from '~/enums/qualification.enum'
import { blockerText as describeBlocker } from '~/utils/qualification-text.util'
import type { IQualificationFinalizeEmits, IQualificationFinalizeProps } from '~/interfaces/qualification-view.interface'

/*********************************************************
 * Global
 *
 * @description
 * « Arrêter la liste des qualifiés » : l'aperçu (poule, rang, joueur, voie), puis le bouton « Arrêter la liste… » qui ouvre une confirmation. Définitif, et
 * le dialogue le dit (« il n'est pas possible de revenir en arrière », décision c9790abd (3)). Inactif avec sa raison écrite dessous tant qu'un match de poule
 * ou une égalité reste. Le dialogue n'est pas `persistent` hors envoi : Échap et le clic extérieur annulent (ux 0ea5092e). L'aperçu est vide tant qu'une égalité
 * bloque (le serveur ne calcule pas de qualifiés alors). Une fois la liste arrêtée, l'aperçu reste et le bouton disparaît.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IQualificationFinalizeProps>(), {})
const emits = defineEmits<IQualificationFinalizeEmits>()
defineSlots<{}>()
const titleId = useId()
const dialogOpen = ref(false)
const title = computed(() => t('admin.qualification.finalize_title', '4 · Arrêter la liste des qualifiés'))
const caption = computed(() => t('admin.qualification.finalize_caption', 'Aperçu des qualifiés'))
const emptyText = computed(() => t('admin.qualification.finalize_empty', 'L’aperçu apparaît quand plus aucune égalité ne bloque.'))
const buttonLabel = computed(() => t('admin.qualification.finalize_button', 'Arrêter la liste…'))
const hasRows = computed(() => props.rows.length > 0)
const isBlocked = computed(() => props.blocker !== null || props.busy)
const blockerText = computed(() => props.blocker === null ? '' : describeBlocker(t, props.blocker, props.pendingCount, props.tieCount))
const headers = computed<IDataTableHeader[]>(() => [
  { key: QUALIFIED_COLUMN.POOL, title: t('admin.qualification.finalize_col_pool', 'Poule'), sortable: false },
  { key: QUALIFIED_COLUMN.RANK, title: t('admin.qualification.finalize_col_rank', 'Rang'), sortable: false, align: ALIGN.END },
  { key: QUALIFIED_COLUMN.PLAYER, title: t('admin.qualification.finalize_col_player', 'Joueur'), sortable: false },
  { key: QUALIFIED_COLUMN.ROUTE, title: t('admin.qualification.finalize_col_route', 'Voie'), sortable: false }
])
const rowViews = computed(() => props.rows.map((row) => {
  const route = row.afterTiebreak
    ? { text: t('admin.qualification.route_after_tiebreak', 'Après départage'), family: EDITION_CHIP_FAMILY.TINTED_INFO }
    : { text: t(QUALIFICATION_ROUTE_VIEW[row.route].label.key, QUALIFICATION_ROUTE_VIEW[row.route].label.fallback), family: QUALIFICATION_ROUTE_VIEW[row.route].family }
  return { ...row, routeText: route.text, family: route.family }
}))

/*********************************************************
 * Confirmation
 *
 * @description
 * Le dialogue dit la conséquence : le nombre de qualifiés, le nouvel état de l'édition, la fin des corrections de score de poule, et que c'est définitif.
 * Il reste ouvert pendant l'envoi (bouton en chargement) et se ferme à la fin, succès ou échec ; le message d'échec est celui de la page.
 ********************************************************/
const dialogTitle = computed(() => t('admin.qualification.dialog_title', 'Arrêter la liste des qualifiés ?'))
const dialogText = computed(() => t('admin.qualification.dialog_text', '{count} joueurs seront qualifiés pour la phase finale. L’édition passe à l’état « Qualifiés validés ». La correction d’un score de poule ne sera plus possible. Cette action est définitive : il n’est pas possible de revenir en arrière.', { count: props.qualifiedCount }))
const cancelLabel = computed(() => t('admin.qualification.dialog_cancel', 'Annuler'))
const confirmLabel = computed(() => t('admin.qualification.dialog_confirm', 'Arrêter la liste'))
const handleOpen = () => {
  dialogOpen.value = true
}
const handleCancel = () => {
  dialogOpen.value = false
}
const handleConfirm = () => {
  emits('finalize')
}
watch(() => props.busy, (now, was) => {
  if (was && !now) {
    dialogOpen.value = false
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
.qualification-finalize {
  margin-top: var(--qualification-finalize---margin-top, var(--origam-space---6));

  &__head {
    margin-bottom: var(--origam-space---4);
  }

  &__title {
    margin: 0;
    font-size: var(--origam-font__size---xl);
    font-weight: var(--origam-font__weight---bold);
    line-height: var(--origam-font__lineHeight---tight);
  }

  &__table :deep(th),
  &__table :deep(td) {
    white-space: normal;
  }

  &__empty {
    margin: 0;
    color: var(--origam-color__text---secondary);
  }

  &__action {
    display: grid;
    justify-items: start;
    margin-top: var(--origam-space---4);
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
  --qualification-finalize---margin-top: var(--origam-space---6);
}
</style>
