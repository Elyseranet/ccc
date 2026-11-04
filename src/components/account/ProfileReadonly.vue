<template>
  <origam-data-list
    mode="kv"
    :items="items"
    :border="false"
    density="compact"
    rounded="lg"
    class="profile-readonly"
    data-cy="profile-readonly"
  >
    <template #value="{ item }">
      <span class="profile-readonly__cell">
        <span>{{ item.value }}</span>
        <small class="profile-readonly__note">{{ item.note }}</small>
      </span>
    </template>
  </origam-data-list>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamDataList } from 'origam/components'
import { useT } from '~/composables/useT'
import { PROFILE_EMPTY_GLYPH } from '~/consts/account.const'
import type { IProfileReadonlyItem, IProfileReadonlyProps } from '~/interfaces/account.interface'
import { maskEmail } from '~/utils/profile-form.util'

/*********************************************************
 * Global
 *
 * @description
 * Ce que le participant voit mais ne modifie pas (A4) : nom et prénom, pseudo, email. Chaque tuile dit qui peut le changer. L'email
 * est masqué à l'affichage : c'est une donnée privée qui n'apparaît jamais en clair, même sur le profil de son titulaire.
 * Les lignes de `origam-data-list` sont stylées par des `:deep` (tuile en colonne, fond, rayon, capitales de la clé) : ces
 * propriétés n'ont pas de variable dans Origam, défaut suivi dans Elyseranet/origam#1267 (même cas que les bilans du
 * face-à-face). Tout ce qui a une variable passe par elle.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IProfileReadonlyProps>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const items = computed((): IProfileReadonlyItem[] => {
  const competitor = props.me.competitor
  const nickname = competitor?.nickname
  return [
    {
      key: t('account.profile.read_name', 'Nom, prénom'),
      value: competitor?.displayName ?? PROFILE_EMPTY_GLYPH,
      note: t('account.profile.read_name_note', 'Modifié par l’organisation')
    },
    {
      key: t('account.profile.read_nickname', 'Pseudo'),
      value: nickname ? t('account.profile.nickname_value', '« {nickname} »', { nickname }) : PROFILE_EMPTY_GLYPH,
      note: t('account.profile.read_nickname_note', 'Réservé à l’organisation')
    },
    {
      key: t('account.profile.read_email', 'Email'),
      value: maskEmail(props.me.email),
      note: t('account.profile.read_email_note', 'Privé, jamais public')
    }
  ]
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
.profile-readonly {
  --origam-data-list---padding: 0;
  --origam-data-list__kv---display: grid;
  --origam-data-list__kv---row-padding-block: var(--origam-space---3);
  --origam-data-list__kv---key-font-size: var(--origam-font__size---xs);
  --origam-data-list__kv---key-font-weight: var(--origam-font__weight---bold);
  --origam-data-list__kv---key-color: var(--origam-color__text---tertiary);
  --origam-data-list__kv---value-font-size: var(--origam-font__size---md);

  margin: 0;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--origam-space---2);

  &__cell {
    display: grid;
    gap: calc(var(--origam-space---1) / 2);
  }

  &__note {
    display: block;
    font-size: var(--origam-font__size---sm);
    font-weight: var(--origam-font__weight---regular);
    color: var(--origam-color__text---tertiary);
  }

  :deep(.origam-data-list__kv-row) {
    grid-template-columns: 1fr;
    row-gap: calc(var(--origam-space---1) / 2);
    border-bottom: 0;
    padding-inline: var(--origam-space---4);
    border-radius: var(--origam-radius---lg);
    background: var(--origam-color__surface---sunken);
  }

  :deep(.origam-data-list__kv-key) {
    letter-spacing: var(--origam-font__letterSpacing---wide);
    text-transform: uppercase;
  }

  :deep(.origam-data-list__kv-value) {
    font-weight: var(--origam-font__weight---bold);
  }

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
}
</style>
