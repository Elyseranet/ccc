<template>
  <origam-card
    tag="section"
    padding="6"
    :aria-labelledby="titleId"
    class="control-center"
    data-cy="admin-control-center"
  >
    <template #default>
      <header class="control-center__head">
        <origam-title
          :id="titleId"
          tag="h2"
          class="control-center__title"
          :text="title"
        />
        <span
          class="control-center__progress"
          data-cy="admin-control-center-progress"
        >{{ progress }}</span>
      </header>
      <origam-stepper
        orientation="vertical"
        :clickable="false"
        show-connectors
        :model-value="activeIndex"
        :items="items"
        data-cy="admin-control-center-steps"
      />
    </template>
  </origam-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamCard, OrigamStepper, OrigamTitle } from 'origam/components'
import { useT } from '~/composables/useT'
import { ADMIN_DASHBOARD_STEP_STATUS } from '~/enums/admin-dashboard.enum'
import type { IAdminControlCenterEmits, IAdminControlCenterProps, IAdminControlCenterSlots } from '~/interfaces/admin-dashboard.interface'

/*********************************************************
 * Global
 *
 * @description
 * Centre de contrôle : les neuf étapes du workflow d'une édition, l'étape active étant déduite par `useAdminDashboard`.
 * Le stepper n'est pas cliquable : il informe, les actions sont dans « À traiter ».
 * Origam dessine indicateurs et connecteurs à partir de `items` (`title`, `subtitle`, `status`) : aucun CSS local sur ses parties.
 * `origam-stepper-item` n'a pas de slot, le statut en texte (Fait, En cours, À venir) est donc le début du sous-titre.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IAdminControlCenterProps>(), {})
const emits = defineEmits<IAdminControlCenterEmits>()
defineSlots<IAdminControlCenterSlots>()
const titleId = 'admin-control-center-title'
const title = computed(() => t('admin.dashboard.control_center_title', 'Centre de contrôle'))

/*********************************************************
 * Étape en cours
 *
 * @description
 * Origam calcule l'état des connecteurs depuis `model-value` (index de l'étape en cours), pas depuis le `status` des items : sans lui,
 * tous les connecteurs restent « à venir ». Sans étape en cours (édition clôturée), toutes les étapes sont faites : on pointe après la dernière.
 ********************************************************/
const activeIndex = computed(() => {
  const index = props.items.findIndex(item => item.status === ADMIN_DASHBOARD_STEP_STATUS.ACTIVE)
  return index === -1 ? props.items.length : index
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
.control-center {
  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--origam-space---3);
    margin-block-end: var(--origam-space---4);
  }

  &__title {
    font-size: var(--origam-font__size---xl);
    font-weight: var(--origam-font__weight---bold);
    line-height: var(--origam-font__lineHeight---tight);
  }

  &__progress {
    color: var(--origam-color__text---secondary);
    font-variant-numeric: tabular-nums;
  }
}
</style>
