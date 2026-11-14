<template>
  <section
    class="participant-list"
    :aria-labelledby="titleId"
    data-cy="participant-list"
  >
    <header class="participant-list__head">
      <origam-title
        :id="titleId"
        tag="h2"
        letter-spacing="normal"
        class="participant-list__title"
        :text="title"
      />
      <origam-chip
        size="small"
        color="secondary"
        bg-color="secondary"
        class="participant-list__count"
        :text="String(participants.length)"
        data-cy="participant-count"
      />
    </header>
    <async-state
      :pending="pending"
      :empty="isEmpty"
      :empty-title="emptyTitle"
    >
      <template #default>
        <section
          class="participant-list__scroll"
          :aria-label="caption"
          tabindex="0"
          data-cy="participant-scroll"
        >
          <app-data-table
            class="participant-list__table"
            hide-default-footer
            :caption="caption"
            :headers="headers"
            :items="pageRows"
            :items-per-page="pageSize"
            data-cy="participant-table"
          >
            <template #[`item.displayName`]="{ item }">
              <span class="participant-list__cell">
                <player-avatar
                  :display-name="item.displayName"
                  :avatar-url="item.avatarUrl"
                />
                <strong>{{ item.displayName }}</strong>
              </span>
            </template>
            <template #[`item.nickname`]="{ item }">
              <span class="participant-list__muted">{{ nicknameOf(item.nickname) }}</span>
            </template>
            <template #[`item.editionsPlayed`]="{ item }">
              <span class="participant-list__num">{{ item.editionsPlayed }}</span>
            </template>
            <template #[`item.accountState`]="{ item }">
              <origam-chip
                v-if="item.accountState"
                size="small"
                :color="chipOf(item.accountState).color"
                :bg-color="chipOf(item.accountState).bgColor"
                :text="chipOf(item.accountState).label"
                :data-cy="`participant-account-${item.accountState}`"
              />
              <span
                v-else
                class="participant-list__muted"
                data-cy="participant-account-none"
              >{{ noAccountLabel }}</span>
            </template>
            <template #[`item.actions`]="{ item }">
              <span class="participant-list__actions">
                <origam-btn
                  v-if="canResend(item.accountState)"
                  variant="text"
                  color="primary"
                  font-size="sm"
                  padding-inline="4"
                  :disabled="isBusy"
                  :text="resendLabel"
                  :aria-label="resendAria(item.displayName)"
                  data-cy="participant-resend"
                  @click="handleResend(item.competitorId)"
                />
                <origam-btn
                  v-if="editable"
                  variant="text"
                  font-size="sm"
                  padding-inline="4"
                  :loading="busyParticipationId === item.participationId"
                  :disabled="isBusy"
                  :text="removeLabel"
                  :aria-label="removeAria(item.displayName)"
                  data-cy="participant-remove"
                  @click="handleRemove(item.participationId)"
                />
              </span>
            </template>
          </app-data-table>
        </section>
        <app-pagination
          :page="page"
          :total="participants.length"
          :page-size="pageSize"
          data-cy="participant-pagination"
          @update:page="handlePage"
        />
      </template>
    </async-state>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { OrigamBtn, OrigamChip, OrigamTitle } from 'origam/components'
import { ALIGN } from 'origam/enums'
import type { IDataTableHeader } from 'origam/interfaces'
import AppDataTable from '~/components/common/AppDataTable.vue'
import AppPagination from '~/components/common/AppPagination.vue'
import AsyncState from '~/components/common/AsyncState.vue'
import PlayerAvatar from '~/components/players/PlayerAvatar.vue'
import { useT } from '~/composables/useT'
import { ADMIN_PARTICIPANTS_PAGE_SIZE, PARTICIPANT_ACCOUNT_CHIPS, PARTICIPANT_COLUMN_MIN_WIDTHS, PARTICIPANT_COLUMN_WIDTHS, PARTICIPANT_NO_ACCOUNT_TEXT } from '~/consts/admin-participants.const'
import { PARTICIPANT_COLUMN } from '~/enums/participant-column.enum'
import { ACCOUNT_STATE } from '~/enums/user.enum'
import type { IParticipantListEmits, IParticipantListProps, IParticipantRow } from '~/interfaces/admin-participants.interface'
import { toParticipantRow } from '~/utils/admin-participants.util'

/*********************************************************
 * Global
 *
 * @description
 * Inscrits de l'édition active : joueur, pseudo, éditions jouées, état du compte (Invité, Actif, Invitation expirée),
 * action. Le retrait n'est proposé que si l'édition l'autorise ; une invitation expirée ou en attente peut être
 * renvoyée. Aucun email ni téléphone n'est lu ici : l'API admin ne les expose pas.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IParticipantListProps>(), {})
const emits = defineEmits<IParticipantListEmits>()
defineSlots<{}>()
const titleId = useId()
const pageSize = ADMIN_PARTICIPANTS_PAGE_SIZE

/*********************************************************
 * Lignes et pagination
 *
 * @description
 * Les inscrits sont paginés côté écran (8 par page) ; revenir à la page 1 quand la liste change évite une page vide
 * après un retrait.
 ********************************************************/
const page = ref(1)
const rows = computed<IParticipantRow[]>(() => props.participants.map(toParticipantRow))
const pageRows = computed(() => rows.value.slice((page.value - 1) * pageSize, page.value * pageSize))
const isEmpty = computed(() => !props.pending && props.participants.length === 0)
const isBusy = computed(() => props.busyParticipationId !== null)
watch(() => props.participants.length, (length) => {
  const lastPage = Math.max(1, Math.ceil(length / pageSize))
  if (page.value > lastPage) {
    page.value = lastPage
  }
})
const handlePage = (value: number) => {
  page.value = value
}

/*********************************************************
 * Libellés
 *
 * @description
 * Tout texte passe par `t()` ; chaque bouton d'action a un nom accessible complet (« Retirer Lisa André »).
 ********************************************************/
const title = computed(() => t('admin.participants.list_title', 'Inscrits'))
const caption = computed(() => t('admin.participants.list_caption', 'Participants inscrits à l’édition active'))
const emptyTitle = computed(() => ({ key: 'admin.participants.list_empty', fallback: 'Aucun inscrit pour le moment.' }))
const noAccountLabel = computed(() => t(PARTICIPANT_NO_ACCOUNT_TEXT.key, PARTICIPANT_NO_ACCOUNT_TEXT.fallback))
const removeLabel = computed(() => t('admin.participants.remove', 'Retirer'))
const resendLabel = computed(() => t('admin.participants.resend', 'Renvoyer'))
const removeAria = (name: string): string => t('admin.participants.remove_for', 'Retirer {name}', { name })
const resendAria = (name: string): string => t('admin.participants.resend_for', 'Renvoyer l’invitation à {name}', { name })
const nicknameOf = (nickname: string): string => nickname === ''
  ? t('players.no_value', '—')
  : t('admin.participants.nickname', '« {nickname} »', { nickname })
const chipOf = (state: ACCOUNT_STATE) => {
  const chip = PARTICIPANT_ACCOUNT_CHIPS[state]
  return { color: chip.color, bgColor: chip.bgColor, label: t(chip.text.key, chip.text.fallback) }
}
const canResend = (state: ACCOUNT_STATE | null): boolean => state === ACCOUNT_STATE.INVITED || state === ACCOUNT_STATE.INVITATION_EXPIRED

/*********************************************************
 * En-têtes
 *
 * @description
 * La clé de colonne est celle du champ de la ligne.
 ********************************************************/
const headers = computed<IDataTableHeader[]>(() => [
  { key: PARTICIPANT_COLUMN.DISPLAY_NAME, width: PARTICIPANT_COLUMN_WIDTHS.displayName, minWidth: PARTICIPANT_COLUMN_MIN_WIDTHS.displayName, title: t('admin.participants.col_player', 'Joueur'), sortable: false, nowrap: true },
  { key: PARTICIPANT_COLUMN.NICKNAME, width: PARTICIPANT_COLUMN_WIDTHS.nickname, minWidth: PARTICIPANT_COLUMN_MIN_WIDTHS.nickname, title: t('admin.participants.col_nickname', 'Pseudo'), sortable: false, nowrap: true },
  { key: PARTICIPANT_COLUMN.EDITIONS_PLAYED, width: PARTICIPANT_COLUMN_WIDTHS.editionsPlayed, minWidth: PARTICIPANT_COLUMN_MIN_WIDTHS.editionsPlayed, title: t('admin.participants.col_editions', 'Éditions'), sortable: false, nowrap: true, align: ALIGN.END },
  { key: PARTICIPANT_COLUMN.ACCOUNT_STATE, width: PARTICIPANT_COLUMN_WIDTHS.accountState, minWidth: PARTICIPANT_COLUMN_MIN_WIDTHS.accountState, title: t('admin.participants.col_account', 'Compte'), sortable: false, nowrap: true },
  { key: PARTICIPANT_COLUMN.ACTIONS, width: PARTICIPANT_COLUMN_WIDTHS.actions, minWidth: PARTICIPANT_COLUMN_MIN_WIDTHS.actions, title: t('admin.participants.col_action', 'Action'), sortable: false, align: ALIGN.END }
])

/*********************************************************
 * Actions
 *
 * @description
 * Le parent exécute l'action et recharge la liste.
 ********************************************************/
const handleRemove = (participationId: string) => {
  emits('remove', participationId)
}
const handleResend = (competitorId: string) => {
  emits('resend', competitorId)
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
.participant-list {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--participant-list---gap, var(--origam-space---4));
  min-width: 0;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--origam-space---3);
  }

  &__title {
    font-size: var(--origam-font__size---xl);
    font-weight: var(--origam-font__weight---bold);
    line-height: var(--origam-font__lineHeight---tight);
  }

  &__scroll {
    overflow-x: auto;

    :deep(.origam-table__wrapper) {
      overflow: visible;
    }
  }

  &__cell {
    display: inline-flex;
    align-items: center;
    gap: var(--origam-space---3);
  }

  &__muted {
    color: var(--origam-color__text---secondary);
  }

  &__num {
    font-variant-numeric: tabular-nums;
  }

  &__actions {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: var(--origam-space---1);
  }
}
</style>

<style>
:root {
  --participant-list---gap: var(--origam-space---4);
}
</style>
