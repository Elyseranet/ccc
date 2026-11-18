<template>
  <section
    class="administrator-list"
    :aria-labelledby="titleId"
    data-cy="administrator-list"
  >
    <header class="administrator-list__head">
      <origam-title
        :id="titleId"
        tag="h2"
        letter-spacing="normal"
        class="administrator-list__title"
        :text="title"
      />
      <origam-chip
        size="small"
        color="secondary"
        bg-color="secondary"
        class="administrator-list__count"
        :text="String(administrators.length)"
        data-cy="administrator-count"
      />
    </header>
    <section
      class="administrator-list__scroll"
      :aria-label="caption"
      tabindex="0"
      data-cy="administrator-scroll"
    >
      <app-data-table
        class="administrator-list__table"
        hide-default-footer
        :caption="caption"
        :headers="headers"
        :items="rows"
        :items-per-page="rows.length"
        data-cy="administrator-table"
      >
        <template #[`item.email`]="{ item }">
          <span class="administrator-list__cell">
            <player-avatar :display-name="item.avatarName" />
            <span class="administrator-list__who">
              <strong class="administrator-list__email">{{ item.email }}</strong>
              <small class="administrator-list__detail">{{ detailOf(item) }}</small>
            </span>
          </span>
        </template>
        <template #[`item.state`]="{ item }">
          <span class="administrator-list__chips">
            <origam-chip
              :color="chipOf(item.state).color"
              :bg-color="chipOf(item.state).bgColor"
              :text="chipOf(item.state).label"
              :data-cy="`administrator-state-${item.state}`"
            />
            <origam-chip
              v-if="item.isSelf"
              color="secondary"
              :text="selfLabel"
              data-cy="administrator-self"
            />
          </span>
        </template>
        <template #[`item.actions`]="{ item }">
          <span
            v-if="item.isSelf"
            class="administrator-list__muted"
            data-cy="administrator-no-action"
          >{{ noActionLabel }}</span>
          <span
            v-else
            class="administrator-list__actions"
          >
            <origam-btn
              v-if="item.canResend"
              variant="text"
              color="primary"
              font-size="sm"
              padding-inline="4"
              :disabled="busy"
              :text="resendLabel"
              :aria-label="resendAria(item.email)"
              data-cy="administrator-resend"
              @click="handleResend(item.id)"
            />
            <origam-btn
              v-if="item.canFix"
              variant="text"
              color="primary"
              font-size="sm"
              padding-inline="4"
              aria-haspopup="dialog"
              :disabled="busy"
              :text="fixLabel"
              :aria-label="fixAria(item.email)"
              data-cy="administrator-fix"
              @click="handleFix(item.id)"
            />
            <origam-btn
              variant="text"
              font-size="sm"
              padding-inline="4"
              aria-haspopup="dialog"
              :disabled="busy || item.lastActive"
              :aria-describedby="item.lastActive ? lastActiveId : undefined"
              :text="revokeLabel"
              :aria-label="revokeAria(item.email)"
              data-cy="administrator-revoke"
              @click="handleRevoke(item.id)"
            />
          </span>
        </template>
      </app-data-table>
    </section>
    <p
      v-if="isAlone"
      class="administrator-list__why"
      data-cy="administrator-alone"
    >
      {{ aloneText }}
    </p>
    <p
      v-if="hasLastActive"
      :id="lastActiveId"
      class="administrator-list__why"
      data-cy="administrator-last-active"
    >
      {{ lastActiveText }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import { OrigamBtn, OrigamChip, OrigamTitle } from 'origam/components'
import { ALIGN } from 'origam/enums'
import type { IDataTableHeader } from 'origam/interfaces'
import AppDataTable from '~/components/common/AppDataTable.vue'
import PlayerAvatar from '~/components/players/PlayerAvatar.vue'
import { useT } from '~/composables/useT'
import { ADMINISTRATOR_COLUMN_MIN_WIDTHS, ADMINISTRATOR_COLUMN_WIDTHS } from '~/consts/admin-administrators.const'
import { PARTICIPANT_ACCOUNT_CHIPS } from '~/consts/admin-participants.const'
import { ADMINISTRATOR_COLUMN } from '~/enums/administrator.enum'
import type { ACCOUNT_STATE } from '~/enums/user.enum'
import type { IAdministratorListEmits, IAdministratorListProps, IAdministratorRow } from '~/interfaces/administrator.interface'
import { toAdministratorRows } from '~/utils/admin-administrators.util'

/*********************************************************
 * Global
 *
 * @description
 * Administrateurs (F-68) : email avec, dessous, la fiche reliée ou la validité de l'invitation ; état du compte (pastilles de F-62, plus « Vous »
 * sur sa propre ligne) ; actions. Aucune action sur sa propre ligne (pas d'auto-retrait) ; « Renvoyer » seulement pour une invitation expirée,
 * « Corriger » tant que le compte n'est pas activé ; « Retirer l'accès » est inactif, avec sa raison, pour le dernier administrateur actif. Le
 * parent exécute l'action et recharge la liste.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IAdministratorListProps>(), {})
const emits = defineEmits<IAdministratorListEmits>()
defineSlots<{}>()
const titleId = useId()
const lastActiveId = useId()

/*********************************************************
 * Lignes
 *
 * @description
 * Un seul administrateur, soi-même : la phrase « Invitez-en un autre » prend la place d'une liste vide.
 ********************************************************/
const rows = computed<IAdministratorRow[]>(() => toAdministratorRows(props.administrators))
const isAlone = computed(() => rows.value.length === 1 && rows.value[0]?.isSelf === true)
const hasLastActive = computed(() => rows.value.some(row => row.lastActive && !row.isSelf))

/*********************************************************
 * Libellés
 *
 * @description
 * Tout texte passe par `t()` ; chaque bouton d'action a un nom accessible complet (« Retirer l'accès de {email} »).
 ********************************************************/
const title = computed(() => t('admin.administrators.list_title', 'Administrateurs'))
const caption = computed(() => t('admin.administrators.list_caption', 'Comptes administrateurs'))
const selfLabel = computed(() => t('admin.administrators.self', 'Vous'))
const noActionLabel = computed(() => t('players.no_value', '—'))
const resendLabel = computed(() => t('admin.administrators.resend', 'Renvoyer'))
const fixLabel = computed(() => t('admin.administrators.fix', 'Corriger'))
const revokeLabel = computed(() => t('admin.administrators.revoke', 'Retirer l’accès'))
const aloneText = computed(() => t('admin.administrators.alone', 'Vous êtes le seul administrateur. Invitez-en un autre pour partager l’organisation.'))
const lastActiveText = computed(() => t('admin.administrators.last_active', 'Indisponible : il doit toujours rester au moins un administrateur actif.'))
const resendAria = (email: string): string => t('admin.administrators.resend_for', 'Renvoyer l’invitation à {email}', { email })
const fixAria = (email: string): string => t('admin.administrators.fix_for', 'Corriger l’invitation de {email}', { email })
const revokeAria = (email: string): string => t('admin.administrators.revoke_for', 'Retirer l’accès de {email}', { email })
const detailOf = (row: IAdministratorRow): string => t(row.detail.key, row.detail.fallback, row.detail.params)
const chipOf = (state: ACCOUNT_STATE) => {
  const chip = PARTICIPANT_ACCOUNT_CHIPS[state]
  return { color: chip.color, bgColor: chip.bgColor, label: t(chip.text.key, chip.text.fallback) }
}

/*********************************************************
 * En-têtes
 *
 * @description
 * La clé de colonne est celle du champ de la ligne.
 ********************************************************/
const headers = computed<IDataTableHeader[]>(() => [
  { key: ADMINISTRATOR_COLUMN.EMAIL, width: ADMINISTRATOR_COLUMN_WIDTHS.email, minWidth: ADMINISTRATOR_COLUMN_MIN_WIDTHS.email, title: t('admin.administrators.col_administrator', 'Administrateur'), sortable: false, nowrap: true },
  { key: ADMINISTRATOR_COLUMN.STATE, width: ADMINISTRATOR_COLUMN_WIDTHS.state, minWidth: ADMINISTRATOR_COLUMN_MIN_WIDTHS.state, title: t('admin.administrators.col_account', 'Compte'), sortable: false, nowrap: true },
  { key: ADMINISTRATOR_COLUMN.ACTIONS, minWidth: ADMINISTRATOR_COLUMN_MIN_WIDTHS.actions, title: t('admin.administrators.col_action', 'Action'), sortable: false, align: ALIGN.END }
])

/*********************************************************
 * Actions
 *
 * @description
 * Le parent exécute l'action et recharge la liste.
 ********************************************************/
const handleResend = (id: string) => {
  emits('resend', id)
}
const handleFix = (id: string) => {
  emits('fix', id)
}
const handleRevoke = (id: string) => {
  emits('revoke', id)
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
.administrator-list {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--administrator-list---gap, var(--origam-space---4));
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

  &__who {
    display: grid;
    gap: var(--origam-space---0-5, 2px);
  }

  &__email {
    overflow-wrap: anywhere;
  }

  &__detail,
  &__muted {
    color: var(--origam-color__text---secondary);
  }

  &__detail {
    font-size: var(--origam-font__size---sm);
  }

  &__chips {
    display: inline-flex;
    flex-wrap: wrap;
    gap: var(--origam-space---1);
  }

  &__actions {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
  }

  &__why {
    margin: 0;
    font-size: var(--origam-font__size---sm);
    color: var(--origam-color__text---secondary);
  }
}
</style>

<style>
:root {
  --administrator-list---gap: var(--origam-space---4);
}
</style>
