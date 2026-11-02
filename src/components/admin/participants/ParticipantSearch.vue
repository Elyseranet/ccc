<template>
  <div
    class="participant-search"
    data-cy="participant-search"
  >
    <origam-label
      class="participant-search__label"
      :for="fieldId"
      :text="label"
    />
    <origam-select
      :id="fieldId"
      autocomplete
      no-filter
      single-line
      hide-details
      rounded="full"
      :items="items"
      :search="query"
      :model-value="selected"
      :menu-icon="CaretDown"
      :loading="loading"
      :disabled="disabled"
      :no-data-text="noDataText"
      :close-text="closeLabel"
      :open-text="openLabel"
      data-cy="participant-search-field"
      @update:search="handleSearch"
      @update:model-value="handleSelect"
    >
      <template #[`item`]="slot">
        <origam-list-item
          v-bind="slot.props"
          :class="itemClass(valueOf(slot))"
          :data-cy="itemDataCy(valueOf(slot))"
        >
          <template #prepend>
            <origam-avatar
              :text="initialsOf(valueOf(slot))"
              :image="avatarOf(valueOf(slot))"
              size="small"
              rounded="full"
            />
          </template>
          <template
            v-if="!isCreate(valueOf(slot))"
            #append
          >
            <origam-chip
              size="small"
              :text="existingProfileLabel"
            />
          </template>
        </origam-list-item>
      </template>
    </origam-select>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { OrigamAvatar, OrigamChip, OrigamLabel, OrigamListItem, OrigamSelect } from 'origam/components'
import CaretDown from '~/components/icons/CaretDown.vue'
import { useT } from '~/composables/useT'
import { PARTICIPANT_CREATE_VALUE } from '~/consts/admin-participants.const'
import type { IParticipantSearchEmits, IParticipantSearchProps, IParticipantSuggestion } from '~/interfaces/admin-participants.interface'

/*********************************************************
 * Global
 *
 * @description
 * Recherche d'un profil existant à rattacher, ou entrée « Créer un nouveau participant » en dernier item du menu (un
 * seul flux : chercher, rattacher ou créer, inviter). La liste vient du serveur : le filtre du champ est coupé
 * (`no-filter`), sinon « Remi » ne retrouverait pas « Rémi ». Choisir un profil le rattache ; choisir la création
 * transmet la saisie courante au parent.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IParticipantSearchProps>(), {})
const emits = defineEmits<IParticipantSearchEmits>()
defineSlots<{}>()
const fieldId = useId()
const selected = ref<string | null>(null)

/*********************************************************
 * Libellés
 *
 * @description
 * Tout texte passe par `t()`. Le texte de l'item « Créer » reprend la saisie courante.
 ********************************************************/
const label = computed(() => t('admin.participants.search_label', 'Nom, prénom ou pseudo'))
const noDataText = computed(() => t('admin.participants.search_no_data', 'Aucun profil ne correspond.'))
const existingProfileLabel = computed(() => t('admin.participants.existing_profile', 'Profil existant'))
const openLabel = computed(() => t('admin.participants.search_open', 'Ouvrir la liste des profils'))
const closeLabel = computed(() => t('admin.participants.search_close', 'Fermer la liste des profils'))

/*********************************************************
 * Items
 *
 * @description
 * Le champ reçoit des items minimaux (titre, valeur, sous-titre, photo) ; l'avatar, la pastille et le style de l'item
 * « Créer » sont posés dans le slot `item`, à partir de la suggestion de même valeur.
 ********************************************************/
const suggestionByValue = computed(() => new Map(props.suggestions.map(suggestion => [suggestion.value, suggestion])))
const toItem = (suggestion: IParticipantSuggestion) => ({
  value: suggestion.value,
  title: suggestion.isCreate
    ? t('admin.participants.create_title', 'Créer un nouveau participant « {query} »', { query: suggestion.title })
    : suggestion.title,
  subtitle: t(suggestion.subtitle.key, suggestion.subtitle.fallback, suggestion.subtitle.params)
})
const items = computed(() => props.suggestions.map(toItem))
/** Le slot `item` d'Origam n'est pas typé : la valeur de l'item est lue ici, une seule fois. */
const valueOf = (slot: unknown): string => String((slot as { item: { value: unknown } }).item.value)
const isCreate = (value: string): boolean => value === PARTICIPANT_CREATE_VALUE
const initialsOf = (value: string): string => suggestionByValue.value.get(value)?.initials ?? ''
const avatarOf = (value: string): string | undefined => suggestionByValue.value.get(value)?.avatarUrl ?? undefined
const itemClass = (value: string): string => isCreate(value) ? 'participant-search__create' : 'participant-search__profile'
const itemDataCy = (value: string): string => isCreate(value) ? 'participant-search-create' : 'participant-search-profile'

/*********************************************************
 * Saisie
 *
 * @description
 * Le parent possède la saisie (la requête part de lui). Le champ ne garde pas de valeur choisie : le profil est
 * rattaché, ou la création ouverte, puis le champ se vide pour la recherche suivante.
 ********************************************************/
const handleSearch = (value: string | null) => {
  emits('update:query', value ?? '')
}
const handleSelect = (value: string | null) => {
  if (value === null || value === undefined) {
    return
  }
  if (isCreate(value)) {
    emits('create', props.query.trim())
  } else {
    emits('attach', value)
  }
  selected.value = null
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
.participant-search {
  display: grid;
  gap: var(--participant-search---gap, var(--origam-space---1));

  &__label {
    font-size: var(--origam-font__size---xs);
    font-weight: var(--origam-font__weight---bold);
    letter-spacing: var(--origam-font__letterSpacing---wide);
    text-transform: uppercase;
    color: var(--origam-color__text---tertiary);
  }

  &__create {
    border-top: var(--origam-border__width---thin) dashed var(--origam-color__border---default);
  }
}
</style>

<style>
:root {
  --participant-search---gap: var(--origam-space---1);
}
</style>
