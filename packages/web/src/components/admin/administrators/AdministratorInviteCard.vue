<template>
  <origam-card
    tag="section"
    class="administrator-invite"
    rounded="xl"
    border
    elevation="md"
    :aria-labelledby="titleId"
    data-cy="administrator-invite"
  >
    <origam-title
      :id="titleId"
      tag="h2"
      class="administrator-invite__title"
      font-size="xl"
      font-weight="bold"
      line-height="tight"
      letter-spacing="normal"
      :text="title"
    />
    <origam-form
      class="administrator-invite__form"
      validate-on="submit"
      :aria-labelledby="titleId"
      data-cy="administrator-invite-form"
      @submit="handleSubmit"
    >
      <div class="administrator-invite__fields">
        <account-email-field
          ref="fieldRef"
          :model-value="modelValue"
          cy-prefix="administrator-invite"
          :taken="alreadyAdmin"
          :taken-text="alreadyAdminText"
          @update:model-value="handleInput"
        />
        <origam-alert
          v-if="failure === null"
          status="info"
          rounded="lg"
          font-size="md"
          font-weight="bold"
          letter-spacing="normal"
          line-height="normal"
          :title="infoTitle"
          :text="infoText"
          data-cy="administrator-invite-info"
        />
        <origam-alert
          v-else
          status="error"
          rounded="lg"
          font-size="md"
          font-weight="bold"
          letter-spacing="normal"
          line-height="normal"
          :title="failureTitle"
          :text="failureText"
          data-cy="administrator-invite-error"
        />
        <div class="administrator-invite__cta">
          <origam-btn
            type="submit"
            variant="flat"
            :bg-color="buttonColor"
            :elevation="buttonElevation"
            size="x-large"
            font-size="md"
            :loading="pending"
            :text="submitLabel"
            data-cy="administrator-invite-submit"
          />
        </div>
      </div>
    </origam-form>
  </origam-card>
</template>

<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { OrigamAlert, OrigamBtn, OrigamCard, OrigamForm, OrigamTitle } from 'origam/components'
import AccountEmailField from '~/components/admin/competitors/AccountEmailField.vue'
import { usePrimaryActionButton } from '~/composables/usePrimaryActionButton'
import { useT } from '~/composables/useT'
import { ADMINISTRATOR_FAILURE_MESSAGES } from '~/consts/admin-administrators.const'
import { INVITATION_TTL_DAYS } from '~/consts/invitation.const'
import { API_ERROR_CODE } from '~/enums/api-error-code.enum'
import type { IAdministratorInviteCardEmits, IAdministratorInviteCardProps } from '~/interfaces/administrator.interface'

/*********************************************************
 * Global
 *
 * @description
 * Carte « Inviter un administrateur » (F-68, B-31) : la même saisie d'email que F-62 (`AccountEmailField`), l'information sur l'invitation
 * (réglages A14 : lien valable 7 jours, un renvoi annule l'ancien) et « Envoyer l'invitation ». L'email d'un compte joueur n'est pas un refus :
 * le serveur le promeut (200). Seul « déjà administrateur » (409) est refusé : message sous le champ et alerte, qui remplace l'information.
 * `modelValue` appartient au parent, qui le vide après un envoi réussi.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IAdministratorInviteCardProps>(), {})
const emits = defineEmits<IAdministratorInviteCardEmits>()
defineSlots<{}>()
const titleId = useId()
const fieldRef = ref<{ validate: () => boolean } | null>(null)

/*********************************************************
 * Saisie
 *
 * @description
 * La validation d'adresse est celle du champ ; le serveur reste l'autorité.
 ********************************************************/
const alreadyAdmin = computed(() => props.failure?.code === API_ERROR_CODE.ALREADY_ADMIN)
const alreadyAdminText = computed(() => ({ key: 'admin.administrators.error_already_admin_field', fallback: 'Cet email est déjà celui d’un administrateur.' }))
const handleInput = (value: string) => {
  emits('update:modelValue', value)
}
const handleSubmit = (event: Event) => {
  event.preventDefault()
  if (props.pending || !fieldRef.value?.validate()) {
    return
  }
  emits('submit')
}

/*********************************************************
 * Libellés
 *
 * @description
 * Tout texte passe par `t()`.
 ********************************************************/
const title = computed(() => t('admin.administrators.invite_title', 'Inviter un administrateur'))
const infoTitle = computed(() => t('admin.administrators.invite_info_title', 'Invitation'))
const infoText = computed(() => t('admin.administrators.invite_info_text', 'Un email d’invitation part aussitôt. Le lien est valable {days} jours ; un renvoi annule l’ancien.', { days: INVITATION_TTL_DAYS }))
const submitLabel = computed(() => t('admin.account.submit_invite', 'Envoyer l’invitation'))
const failureTitle = computed(() => props.failure ? t(props.failure.title.key, props.failure.title.fallback, props.failure.title.params) : '')
const failureText = computed(() => props.failure ? t(props.failure.text.key, props.failure.text.fallback, props.failure.text.params) : '')
const isBlocked = computed(() => props.pending)
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
.administrator-invite {
  display: grid;
  gap: var(--administrator-invite---gap, var(--origam-space---4));
  padding: var(--administrator-invite---padding, var(--origam-space---6));

  &__form,
  &__fields {
    display: grid;
    gap: var(--administrator-invite---gap, var(--origam-space---4));
  }

  &__cta {
    display: flex;
    justify-content: flex-end;
  }

  @media (max-width: 760px) {
    padding: var(--origam-space---5);

    &__cta :deep(.origam-btn) {
      width: 100%;
    }
  }
}
</style>

<style>
:root {
  --administrator-invite---gap: var(--origam-space---4);
  --administrator-invite---padding: var(--origam-space---6);
}
</style>
