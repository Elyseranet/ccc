<template>
  <origam-card
    class="players-search"
    rounded="xl"
    border
    elevation="md"
    data-cy="players-search"
  >
    <template #default>
      <origam-form
        class="players-search__form"
        role="search"
        validate-on="submit"
        :aria-label="searchLabel"
        @submit="handleSubmit"
      >
        <div class="players-search__grid">
          <div class="players-search__field players-search__q">
            <origam-label
              class="players-search__label"
              for="players-search-query"
              :text="queryLabel"
            />
            <origam-text-field
              id="players-search-query"
              type="search"
              single-line
              hide-details
              clearable
              :placeholder="queryPlaceholder"
              :model-value="q"
              data-cy="players-search-query"
              @update:model-value="handleQuery"
            />
          </div>
          <div class="players-search__field">
            <origam-label
              class="players-search__label"
              for="players-search-edition"
              :text="editionLabel"
            />
            <origam-select
              id="players-search-edition"
              single-line
              hide-details
              :items="editionOptions"
              :menu-icon="CaretDown"
              :model-value="edition"
              data-cy="players-search-edition"
              @update:model-value="handleEdition"
            />
          </div>
          <origam-btn
            type="submit"
            variant="flat"
            bg-color="primary"
            elevation="lg"
            :hover="ctaHover"
            size="x-large"
            font-size="md"
            :text="submitLabel"
            data-cy="players-search-submit"
          />
          <origam-btn
            class="players-search__compare"
            variant="outlined"
            size="x-large"
            font-size="md"
            :to="compareRoute"
            :text="compareLabel"
            data-cy="players-search-compare"
          />
        </div>
      </origam-form>
    </template>
  </origam-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamBtn, OrigamCard, OrigamForm, OrigamLabel, OrigamSelect, OrigamTextField } from 'origam/components'
import CaretDown from '~/components/icons/CaretDown.vue'
import { useT } from '~/composables/useT'
import { PLAYERS_CTA_HOVER, PLAYERS_HEAD_TO_HEAD_ROUTE } from '~/consts/players.const'
import type { IPlayersSearchEmits, IPlayersSearchProps } from '~/interfaces/players.interface'

/*********************************************************
 * Global
 *
 * @description
 * Recherche publique (décision E-e) : nom ou pseudo, édition jouée. Le libellé du champ est visible,
 * le placeholder n'est qu'un exemple. Le filtre d'édition ne restreint que les inscrits.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IPlayersSearchProps>(), {})
const emits = defineEmits<IPlayersSearchEmits>()
defineSlots<{}>()

/*********************************************************
 * Libellés
 *
 * @description
 * Tous les textes passent par `t()` ; le formulaire a un nom accessible (région `search`).
 ********************************************************/
const searchLabel = computed(() => t('players.search.label', 'Rechercher un joueur'))
const queryLabel = computed(() => t('players.search.query_label', 'Nom ou pseudo'))
const queryPlaceholder = computed(() => t('players.search.query_placeholder', 'Ex. Rebond, Dupont…'))
const editionLabel = computed(() => t('players.search.edition_label', 'Édition jouée'))
const submitLabel = computed(() => t('players.search.submit', 'Rechercher'))
const compareLabel = computed(() => t('players.search.compare', 'Comparer deux joueurs'))
const compareRoute = PLAYERS_HEAD_TO_HEAD_ROUTE
const ctaHover = PLAYERS_CTA_HOVER

/*********************************************************
 * Saisie
 *
 * @description
 * Le parent possède l'état (l'URL) ; ce composant ne fait que relayer la saisie et la validation.
 ********************************************************/
const handleQuery = (value: string | null) => {
  emits('update:q', value ?? '')
}
const handleEdition = (value: string | null) => {
  emits('update:edition', value ?? '')
}
const handleSubmit = (event: Event) => {
  event.preventDefault()
  emits('submit')
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
.players-search {
  padding: var(--players-search---padding, var(--origam-space---5));

  &__grid {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) auto auto;
    align-items: end;
    gap: var(--players-search---gap, var(--origam-space---3));
  }

  &__compare {
    --origam-btn---padding-xl: calc(var(--origam-space---6) - var(--origam-border__width---2));
  }

  &__field {
    display: grid;
    gap: var(--origam-space---1);
  }

  &__label {
    font-size: var(--origam-font__size---xs);
    font-weight: var(--origam-font__weight---bold);
    letter-spacing: var(--origam-font__letterSpacing---wide);
    text-transform: uppercase;
    color: var(--origam-color__text---tertiary);
  }

  @media (max-width: 1100px) {
    &__grid {
      grid-template-columns: 1fr 1fr;
    }
  }

  @media (max-width: 760px) {
    &__grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>

<style>
:root {
  --players-search---padding: var(--origam-space---5);
  --players-search---gap: var(--origam-space---3);
}
</style>
