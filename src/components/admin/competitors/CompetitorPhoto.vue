<template>
  <fieldset
    class="competitor-photo"
    :disabled="pending"
    data-cy="competitor-photo"
  >
    <legend class="competitor-photo__legend">
      {{ legend }}
    </legend>
    <div class="competitor-photo__row">
      <origam-avatar
        class="competitor-photo__avatar font-display"
        :size="avatarSize"
        rounded="full"
        bg-color="primary"
        elevation="lg"
        font-size="2xl"
        role="img"
        :aria-label="avatarLabel"
        :image="avatarUrl ?? undefined"
        :text="initials"
        data-cy="competitor-photo-avatar"
      />
      <div class="competitor-photo__actions">
        <div class="competitor-photo__field">
          <origam-label
            :for="fileId"
            class="competitor-photo__label"
            :text="fileLabel"
          />
          <origam-file-field
            :id="fileId"
            v-model="file"
            single-line
            show-size
            rounded="full"
            hide-details
            :accept="accept"
            :max-file-size="maxBytes"
            :placeholder="placeholder"
            :error="hasError"
            :aria-describedby="describedBy"
            data-cy="competitor-photo-input"
            @error:max-size="handleTooLarge"
          />
        </div>
        <p
          :id="hintId"
          class="competitor-photo__hint"
        >
          {{ hint }}
        </p>
        <origam-btn
          variant="outlined"
          size="small"
          class="competitor-photo__remove"
          :disabled="!canRemove"
          :text="removeLabel"
          data-cy="competitor-photo-remove"
          @click="handleRemove"
        />
      </div>
    </div>
    <origam-alert
      v-if="errorText"
      :id="errorId"
      status="error"
      density="compact"
      rounded="lg"
      :text="errorText"
      data-cy="competitor-photo-error"
    />
    <p class="competitor-photo__hint">
      {{ initialsHint }}
    </p>
  </fieldset>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { OrigamAlert, OrigamAvatar, OrigamBtn, OrigamFileField, OrigamLabel } from 'origam/components'
import { useAccountError } from '~/composables/useAccountError'
import { useT } from '~/composables/useT'
import { ADMIN_COMPETITOR_PHOTO_SIZE } from '~/consts/admin-competitors.const'
import { ACCOUNT_AVATAR_ACCEPT, ACCOUNT_AVATAR_MAX_BYTES } from '~/consts/account.const'
import { ACCOUNT_ERROR } from '~/enums/account.enum'
import type { ICompetitorPhotoEmits, ICompetitorPhotoProps } from '~/interfaces/admin-competitors.interface'
import { validateAvatarFile } from '~/utils/avatar-file.util'
import { getInitials } from '~/utils/player.util'

/*********************************************************
 * Global
 *
 * @description
 * Photo d'un compétiteur (B-16) : l'image, ou les initiales à défaut, le champ d'envoi (`origam-file-field`, 2 Mo, JPEG, PNG ou WebP)
 * et « Supprimer la photo ». Le composant n'envoie rien : il relaie le fichier choisi (`select`), la raison du refus local
 * (`invalid`) ou le retrait (`remove`). Le serveur fait foi ; le contrôle local ne donne qu'un retour immédiat. Les erreurs 413, 415
 * et 422 s'affichent en alerte compacte, annoncée.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<ICompetitorPhotoProps>(), { avatarUrl: null, error: null, pending: false })
const emits = defineEmits<ICompetitorPhotoEmits>()
defineSlots<{}>()
const fileId = useId()
const hintId = useId()
const errorId = useId()
const accept = ACCOUNT_AVATAR_ACCEPT
const maxBytes = ACCOUNT_AVATAR_MAX_BYTES
const avatarSize = ADMIN_COMPETITOR_PHOTO_SIZE
const initials = computed(() => getInitials(props.displayName))
const canRemove = computed(() => props.avatarUrl !== null && !props.pending)

/*********************************************************
 * Fichier choisi
 *
 * @description
 * Le champ garde le fichier tant que le parent ne l'a pas traité. Un fichier refusé par le contrôle local (type) est retiré du champ
 * pour ne pas laisser croire qu'il partira ; la taille est déjà filtrée par `max-file-size`, qui émet `error:max-size`. Une fois
 * le fichier relayé, le champ est vidé : il est prêt pour un autre.
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
  file.value = null
  if (rejected) {
    emits('invalid', rejected)
    return
  }
  emits('select', selected)
})
const handleRemove = () => {
  emits('remove')
}

/*********************************************************
 * Libellés et erreur
 *
 * @description
 * Tout texte passe par `t()`. L'erreur est la phrase traduite d'une cause du compte (mêmes messages que le profil).
 ********************************************************/
const legend = computed(() => t('admin.competitors.photo_legend', 'Photo'))
const fileLabel = computed(() => t('admin.competitors.photo_upload', 'Envoyer une photo'))
const placeholder = computed(() => t('admin.competitors.photo_placeholder', 'Choisir une image'))
const hint = computed(() => t('admin.competitors.photo_hint', 'JPEG, PNG ou WebP, 2 Mo maximum. Les métadonnées (EXIF, position GPS) sont supprimées à l’envoi.'))
const removeLabel = computed(() => t('admin.competitors.photo_remove', 'Supprimer la photo'))
const initialsHint = computed(() => t('admin.competitors.photo_initials_hint', 'Sans photo, l’avatar affiche les initiales. « Supprimer la photo » ramène aux initiales.'))
const avatarLabel = computed(() => props.avatarUrl
  ? t('admin.competitors.photo_alt', 'Photo de {name}', { name: props.displayName })
  : t('admin.competitors.photo_alt_initials', 'Aucune photo : initiales {initials}', { initials: initials.value }))
const errorRef = computed(() => props.error)
const errorText = useAccountError(errorRef)
const hasError = computed(() => errorText.value !== null)
const describedBy = computed(() => hasError.value ? `${hintId} ${errorId}` : hintId)

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.competitor-photo {
  display: grid;
  gap: var(--competitor-photo---gap, var(--origam-space---3));
  min-width: 0;
  margin: 0;
  padding: var(--competitor-photo---padding, var(--origam-space---4));
  border: var(--origam-border__width---thin) solid var(--origam-color__border---default);
  border-radius: var(--origam-radius---lg);

  &__legend {
    padding-inline: var(--origam-space---2);
    font-size: var(--origam-font__size---xs);
    font-weight: var(--origam-font__weight---bold);
    letter-spacing: var(--origam-font__letterSpacing---wide);
    text-transform: uppercase;
    color: var(--origam-color__text---tertiary);
  }

  &__row {
    display: flex;
    align-items: start;
    gap: var(--origam-space---4);
  }

  &__avatar {
    flex: none;
  }

  &__actions {
    display: grid;
    flex: 1;
    gap: var(--origam-space---2);
    justify-items: start;
    min-width: 0;
  }

  &__field {
    display: grid;
    gap: var(--origam-space---1);
    width: 100%;
  }

  &__label {
    font-size: var(--origam-font__size---xs);
    font-weight: var(--origam-font__weight---bold);
    letter-spacing: var(--origam-font__letterSpacing---wide);
    text-transform: uppercase;
    color: var(--origam-color__text---tertiary);
  }

  &__remove {
    --origam-btn---height: var(--origam-space---11);
    --origam-btn---padding-sm: var(--origam-space---4);
    --origam-btn---font-size: var(--origam-font__size---sm);
  }

  &__hint {
    margin: 0;
    font-size: var(--origam-font__size---sm);
    color: var(--competitor-photo__hint---color, var(--origam-color__text---secondary));
  }

  @media (max-width: 760px) {
    &__row {
      flex-direction: column;
    }
  }
}
</style>

<style>
:root {
  --competitor-photo---gap: var(--origam-space---3);
  --competitor-photo---padding: var(--origam-space---4);
  --competitor-photo__hint---color: var(--origam-color__text---secondary);
}
</style>
