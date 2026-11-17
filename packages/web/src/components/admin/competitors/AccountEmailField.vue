<template>
  <div class="account-email-field">
    <origam-label
      :for="fieldId"
      class="account-email-field__label"
      :text="label"
    />
    <origam-text-field
      :id="fieldId"
      :model-value="modelValue"
      type="email"
      single-line
      rounded="full"
      autocomplete="off"
      :autofocus="autofocus"
      hide-details="auto"
      :error="taken || invalid"
      :aria-invalid="taken || invalid ? 'true' : undefined"
      :error-messages="errors"
      :data-cy="`${cyPrefix}-email`"
      @update:model-value="handleInput"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { OrigamLabel, OrigamTextField } from 'origam/components'
import { useT } from '~/composables/useT'
import type { IAccountEmailFieldEmits, IAccountEmailFieldProps } from '~/interfaces/admin-competitors.interface'
import { isAccountEmailValid } from '~/utils/admin-competitors.util'

/*********************************************************
 * Global
 *
 * @description
 * Saisie de l'email d'un compte (F-62), commune au bloc « Compte » de la fiche et à la boîte « Inviter » de la liste. Libellé visible
 * (`origam-label` + `for`, la prop `label` du champ ne s'affiche pas). `validate()` : le parent la lance à l'envoi ; l'erreur « adresse invalide »
 * apparaît alors, et s'efface à la frappe. « Email déjà pris » vient du serveur (`taken`). Le serveur reste l'autorité.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IAccountEmailFieldProps>(), { taken: false, autofocus: false })
const emits = defineEmits<IAccountEmailFieldEmits>()
defineSlots<{}>()
const fieldId = useId()
const attempted = ref(false)
const label = computed(() => t('admin.account.field_email', 'Email · privé'))
const invalid = computed(() => attempted.value && !isAccountEmailValid(props.modelValue))
const errors = computed(() => {
  if (props.taken) {
    return [t('admin.account.error_email_used_text', 'Cet email est déjà rattaché à un autre compte : saisissez-en un autre.')]
  }
  return invalid.value ? [t('admin.account.rule_email', 'Adresse email invalide')] : []
})
const handleInput = (value: string) => {
  attempted.value = false
  emits('update:modelValue', value ?? '')
}

/*********************************************************
 * Expose
 *
 * @description
 * `validate` : affiche l'erreur éventuelle et dit si la saisie est recevable.
 ********************************************************/
const validate = (): boolean => {
  attempted.value = true
  return isAccountEmailValid(props.modelValue)
}
defineExpose({ validate })
</script>

<style scoped lang="scss">
.account-email-field {
  display: grid;
  align-content: start;
  gap: var(--origam-space---1);
  min-width: 0;

  &__label {
    font-size: var(--origam-font__size---xs);
    font-weight: var(--origam-font__weight---bold);
    letter-spacing: var(--origam-font__letterSpacing---wide);
    text-transform: uppercase;
    color: var(--origam-color__text---tertiary);
  }
}
</style>
