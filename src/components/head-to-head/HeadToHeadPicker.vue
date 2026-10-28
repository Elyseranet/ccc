<template>
  <origam-card
    class="head-to-head-picker"
    rounded="xl"
    border
    elevation="md"
    padding="5"
    data-cy="head-to-head-picker"
  >
    <template #default>
      <origam-form
        role="search"
        class="head-to-head-picker__form"
        @submit.prevent
      >
          <fieldset class="head-to-head-picker__fields">
            <legend class="sr-only">
              {{ legend }}
            </legend>
            <div class="head-to-head-picker__field">
              <origam-label
                :for="fieldIdA"
                :text="labelA"
                class="head-to-head-picker__label"
              />
              <origam-select
                :model-value="playerA"
                :search="searchA"
                :items="optionsA"
                :id="fieldIdA"
                :label="labelA"
                :error="hasErrorA"
                :error-messages="messagesA"
                :no-data-text="noDataText"
                autocomplete
                no-filter
                clearable
                single-line
                menu-icon=""
                hide-details="auto"
                rounded="full"
                class="head-to-head-picker__select"
                data-cy="head-to-head-player-a"
                @update:model-value="handleSelectA"
                @update:search="handleSearchA"
              />
            </div>
            <origam-btn
              icon
              variant="outlined"
              rounded="full"
              class="head-to-head-picker__swap"
              :aria-label="swapLabel"
              data-cy="head-to-head-swap"
              @click="handleSwap"
            >
              <template #default>
                <span aria-hidden="true">{{ swapGlyph }}</span>
              </template>
            </origam-btn>
            <div class="head-to-head-picker__field">
              <origam-label
                :for="fieldIdB"
                :text="labelB"
                class="head-to-head-picker__label"
              />
              <origam-select
                :model-value="playerB"
                :search="searchB"
                :items="optionsB"
                :id="fieldIdB"
                :label="labelB"
                :error="hasErrorB"
                :error-messages="messagesB"
                :no-data-text="noDataText"
                autocomplete
                no-filter
                clearable
                single-line
                menu-icon=""
                hide-details="auto"
                rounded="full"
                class="head-to-head-picker__select"
                data-cy="head-to-head-player-b"
                @update:model-value="handleSelectB"
                @update:search="handleSearchB"
              />
            </div>
          </fieldset>
      </origam-form>
    </template>
  </origam-card>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import { OrigamBtn, OrigamCard, OrigamForm, OrigamLabel, OrigamSelect } from 'origam/components'
import { useT } from '~/composables/useT'
import { HEAD_TO_HEAD_FIELD_ERROR_TEXTS, HEAD_TO_HEAD_SWAP_GLYPH } from '~/consts/head-to-head.const'
import { HEAD_TO_HEAD_FIELD_ERROR } from '~/enums/head-to-head.enum'
import type { IHeadToHeadPickerEmits, IHeadToHeadPickerProps } from '~/interfaces/head-to-head-page.interface'

/*********************************************************
 * Global
 *
 * @description
 * Choix des deux joueurs : deux listes à autocomplétion serveur dans un `fieldset` nommé, et le bouton « Inverser ».
 * Le composant ne touche ni l'URL ni le réseau : il reçoit les options et émet les choix.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IHeadToHeadPickerProps>(), {
  playerA: null,
  playerB: null
})
const emits = defineEmits<IHeadToHeadPickerEmits>()
defineSlots<{}>()
const swapGlyph = HEAD_TO_HEAD_SWAP_GLYPH

/*********************************************************
 * Libellés
 *
 * @description
 * Toutes les chaînes viennent des locales. L'erreur d'un champ passe par `error` + `error-messages` : Origam rend le message
 * sous le champ et le relie au champ par `aria-describedby`.
 ********************************************************/
const baseId = useId()
const fieldIdA = `${baseId}-a`
const fieldIdB = `${baseId}-b`
const legend = computed(() => t('head_to_head.picker.legend', 'Choix des deux joueurs'))
const labelA = computed(() => t('head_to_head.picker.player_a', 'Joueur 1'))
const labelB = computed(() => t('head_to_head.picker.player_b', 'Joueur 2'))
const swapLabel = computed(() => t('head_to_head.picker.swap', 'Inverser les deux joueurs'))
const noDataText = computed(() => t('head_to_head.picker.no_data', 'Aucun joueur ne correspond.'))
const messagesOf = (error: HEAD_TO_HEAD_FIELD_ERROR): string[] => {
  if (error === HEAD_TO_HEAD_FIELD_ERROR.NONE) {
    return []
  }
  const entry = HEAD_TO_HEAD_FIELD_ERROR_TEXTS[error]
  return [t(entry.key, entry.label)]
}
const messagesA = computed(() => messagesOf(props.errorA))
const messagesB = computed(() => messagesOf(props.errorB))
const hasErrorA = computed(() => messagesA.value.length > 0)
const hasErrorB = computed(() => messagesB.value.length > 0)

/*********************************************************
 * Interactions
 *
 * @description
 * Chaque handler est un simple point d'entrée événementiel : le parent possède la logique.
 ********************************************************/
const handleSelectA = (value: string | null) => {
  emits('update:playerA', value ?? null)
}
const handleSelectB = (value: string | null) => {
  emits('update:playerB', value ?? null)
}
const handleSearchA = (value: string) => {
  emits('update:searchA', value ?? '')
}
const handleSearchB = (value: string) => {
  emits('update:searchB', value ?? '')
}
const handleSwap = () => {
  emits('swap')
}

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.head-to-head-picker {
  &__fields {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: end;
    gap: var(--head-to-head-picker---gap, var(--origam-space---4));
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
  }

  &__field {
    display: grid;
    gap: var(--origam-space---1);
    min-width: 0;
  }

  &__swap {
    font-size: var(--origam-font__size---lg);
    width: var(--head-to-head-picker__swap---size, var(--origam-space---12));
    height: var(--head-to-head-picker__swap---size, var(--origam-space---12));
  }

  &__label {
    font-size: var(--origam-font__size---xs);
    font-weight: var(--origam-font__weight---bold);
    letter-spacing: var(--origam-font__letterSpacing---wide);
    text-transform: uppercase;
    color: var(--origam-color__text---secondary);
  }

  @media (max-width: 48rem) {
    &__fields {
      grid-template-columns: 1fr;
    }

    &__swap {
      justify-self: center;
      rotate: 90deg;
    }
  }
}
</style>

<style>
:root {
  --head-to-head-picker---gap: var(--origam-space---4);
  --head-to-head-picker__swap---size: var(--origam-space---12);
}
</style>
