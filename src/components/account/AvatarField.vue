<template>
  <div
    class="avatar-field"
    data-cy="avatar-field"
  >
    <account-avatar
      :initials="initials"
      :avatar-url="avatarUrl"
    />
    <form-field
      class="avatar-field__field"
      :field-id="fieldId"
      :label="label"
    >
      <template #default>
        <origam-file-field
          :id="fieldId"
          v-model="file"
          :accept="accept"
          :max-file-size="maxBytes"
          show-size
          hide-details
          single-line
          :disabled="pending"
          :placeholder="placeholder"
          :error="hasError"
          :aria-describedby="describedBy"
          data-cy="avatar-field-input"
          @error:max-size="handleTooLarge"
        />
      </template>
    </form-field>
    <origam-btn
      v-if="canRemove"
      variant="text"
      color="primary"
      padding-inline="3"
      class="avatar-field__remove"
      :disabled="pending"
      :text="removeLabel"
      data-cy="avatar-field-remove"
      @click="handleRemove"
    />
    <p
      v-if="errorText"
      :id="errorId"
      class="avatar-field__error"
      role="alert"
      data-cy="avatar-field-error"
    >
      {{ errorText }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { OrigamBtn, OrigamFileField } from 'origam/components'
import AccountAvatar from '~/components/account/AccountAvatar.vue'
import FormField from '~/components/common/FormField.vue'
import { useAccountError } from '~/composables/useAccountError'
import { useT } from '~/composables/useT'
import { ACCOUNT_AVATAR_ACCEPT, ACCOUNT_AVATAR_MAX_BYTES } from '~/consts/account.const'
import { ACCOUNT_ERROR } from '~/enums/account.enum'
import type { IAvatarFieldEmits, IAvatarFieldProps } from '~/interfaces/account.interface'
import { validateAvatarFile } from '~/utils/avatar-file.util'

/*********************************************************
 * Global
 *
 * @description
 * L'avatar du compte et son champ de téléversement (AV-1, B-16) : `origam-file-field` limité à 2 Mo (`max-file-size`), qui affiche
 * la taille du fichier choisi. Sans image, on voit les initiales. Le composant ne téléverse rien : il relaie le fichier choisi
 * (`select`) ou la raison du refus local (`invalid`), et c'est le parent qui décide de l'envoyer tout de suite (profil) ou
 * avec le formulaire (invitation). Le serveur fait foi ; ce contrôle ne donne qu'un retour immédiat.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IAvatarFieldProps>(), {
  avatarUrl: null,
  error: null,
  pending: false,
  removable: false
})
const emits = defineEmits<IAvatarFieldEmits>()
defineSlots<{}>()
const accept = ACCOUNT_AVATAR_ACCEPT
const maxBytes = ACCOUNT_AVATAR_MAX_BYTES
const placeholder = computed(() => t('account.avatar.placeholder', 'Choisir une image'))
const removeLabel = computed(() => t('account.avatar.remove', 'Retirer l’avatar'))

/*********************************************************
 * Fichier choisi
 *
 * @description
 * Le champ garde le fichier tant que le parent ne le remplace pas. Un fichier refusé par le contrôle local (type) est retiré du
 * champ pour ne pas laisser croire qu'il partira ; la taille est déjà filtrée par `max-file-size`, qui émet `error:max-size`.
 ********************************************************/
const file = ref<File | null>(null)
const handleTooLarge = () => {
  emits('invalid', ACCOUNT_ERROR.AVATAR_TOO_LARGE)
}
watch(file, (selected) => {
  if (!selected) {
    return
  }
  const rejected = validateAvatarFile(selected)
  if (rejected) {
    file.value = null
    emits('invalid', rejected)
    return
  }
  emits('select', selected)
})

/*********************************************************
 * Erreur et retrait
 *
 * @description
 * L'erreur s'affiche sous le champ, annoncée (`role="alert"`), et marque le champ en erreur. Le retrait n'est proposé que pour
 * l'avatar courant d'un profil.
 ********************************************************/
const errorRef = computed(() => props.error)
const errorText = useAccountError(errorRef)
const errorId = computed(() => `${props.fieldId}-error`)
const hasError = computed(() => errorText.value !== null)
const describedBy = computed(() => hasError.value ? errorId.value : undefined)
const canRemove = computed(() => props.removable && props.avatarUrl !== null)
const handleRemove = () => {
  emits('remove')
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
.avatar-field {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: var(--avatar-field---gap, var(--origam-space---4));

  &__field {
    flex: 1;
    min-width: 0;
  }

  &__error {
    flex-basis: 100%;
    margin: 0;
    font-size: var(--origam-font__size---sm);
    font-weight: var(--origam-font__weight---semibold);
    color: var(--origam-color__feedback--danger---fgSubtle);
  }
}
</style>

<style>
:root {
  --avatar-field---gap: var(--origam-space---4);
}
</style>
