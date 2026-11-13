<template>
  <origam-card
    tag="section"
    rounded="xl"
    border
    elevation="md"
    :aria-labelledby="titleId"
    class="round-draw-choice"
    data-cy="round-draw-choice"
  >
    <template #default>
      <round-kind-radios
        :model-value="selected"
        :kinds="allowedRoundKinds"
        data-cy="round-draw-choice-radios"
        @update:model-value="handleSelect"
      >
        <span :id="titleId">{{ legend }}</span> <span class="round-draw-choice__muted">{{ pairingsText }}</span>
      </round-kind-radios>
      <p class="round-draw-choice__why">
        {{ why }}
      </p>
      <origam-btn
        variant="flat"
        :bg-color="buttonColor"
        :elevation="buttonElevation"
        size="x-large"
        :disabled="isBlocked"
        :loading="busy"
        :text="startLabel"
        data-cy="round-draw-start"
        @click="handleStart"
      />
    </template>
  </origam-card>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { OrigamBtn, OrigamCard } from 'origam/components'
import RoundKindRadios from '~/components/admin/round-draw/RoundKindRadios.vue'
import { usePrimaryActionButton } from '~/composables/usePrimaryActionButton'
import { useT } from '~/composables/useT'
import { ROUND_DRAW_TEXTS } from '~/consts/round-draw.const'
import type { ROUND_KIND } from '~/enums/round.enum'
import type { IRoundDrawChoiceEmits, IRoundDrawChoiceProps } from '~/interfaces/round-draw.interface'
import { defaultRoundKind, pairingTotal } from '~/utils/round-draw.util'

/*********************************************************
 * Global
 *
 * @description
 * Vivier hors 2, 4, 8 ou 16 : `roundKind` est nul et le choix revient à l'administrateur, AVANT la première affiche, parmi les tours que le serveur autorise (décision 673e5b4b).
 * Le tour est fixé à la création du brouillon (« Commencer le tirage… ») ; il se change ensuite par « Changer de tour » tant que le tirage n'est pas validé.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IRoundDrawChoiceProps>(), {})
const emits = defineEmits<IRoundDrawChoiceEmits>()
defineSlots<{}>()
const titleId = useId()
const selected = ref<ROUND_KIND | null>(defaultRoundKind(props.allowedRoundKinds))
watch(() => props.allowedRoundKinds, (kinds) => {
  if (selected.value === null || !kinds.includes(selected.value)) {
    selected.value = defaultRoundKind(kinds)
  }
})
const legend = computed(() => t('admin.round_draw.choice_legend', 'Quel tour tirez-vous avec ces {count} joueurs ?', { count: props.playerCount }))
const pairingsText = computed(() => t('admin.round_draw.choice_pairings', '({count} affiches)', { count: pairingTotal(props.playerCount) }))
const why = computed(() => t('admin.round_draw.choice_why', 'Seuls les tours autorisés pour ce vivier sont proposés.'))
const canStart = computed(() => selected.value !== null && !props.busy)
const startLabel = computed(() => selected.value
  ? t('admin.round_draw.start', 'Commencer le tirage {round}', { round: t(ROUND_DRAW_TEXTS[selected.value].of.key, ROUND_DRAW_TEXTS[selected.value].of.fallback) })
  : t('admin.round_draw.start_none', 'Commencer le tirage'))
const handleSelect = (value: ROUND_KIND) => {
  selected.value = value
}
const handleStart = () => {
  if (selected.value) {
    emits('start', selected.value)
  }
}

const isBlocked = computed(() => !canStart.value)
const { buttonColor, buttonElevation } = usePrimaryActionButton(isBlocked)

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.round-draw-choice {
  padding: var(--round-draw-choice---padding, var(--origam-space---6));

  @media (max-width: 760px) {
    padding: var(--origam-space---5);
  }

  &__muted {
    color: var(--origam-color__text---secondary);
    font-weight: var(--origam-font__weight---regular);
  }

  &__why {
    margin: var(--origam-space---3) 0;
    color: var(--origam-color__text---secondary);
    font-size: var(--origam-font__size---sm);
  }
}
</style>

<style>
:root {
  --round-draw-choice---padding: var(--origam-space---6);
}
</style>
