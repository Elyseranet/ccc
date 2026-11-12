<template>
  <div class="competitors-screen">
    <reference-head :title="title" />
    <competitors-toolbar
      v-model:query="draft"
      :total="total"
    />
    <div class="competitors-screen__grid">
      <async-state
        class="competitors-screen__list"
        :pending="listPending"
        :error="listFailure"
        :empty="isEmpty"
        :empty-title="emptyTitle"
        @retry="refreshList"
      >
        <competitors-table
          :competitors="competitors"
          :selected-id="competitorId"
          :page="page"
          :page-size="pageSize"
          :total="total"
          @update:page="setPage"
        />
      </async-state>
      <div
        class="competitors-screen__panel"
        data-cy="competitors-panel"
      >
        <p
          v-if="!competitorId"
          class="competitors-screen__hint"
          data-cy="competitors-select-hint"
        >
          {{ selectHint }}
        </p>
        <async-state
          v-else
          :pending="loading"
          :error="loadFailure"
          @retry="refresh"
        >
          <competitor-identity-form
            v-if="competitor"
            :competitor="competitor"
            :values="values"
            :pending="saving"
            :failure="failure"
            :saved="saved"
            @submit="handleSubmit"
          >
            <template #photo>
              <competitor-photo
                :display-name="competitor.displayName"
                :avatar-url="competitor.avatarUrl"
                :error="photoError"
                :pending="photoPending"
                @select="handleSelect"
                @invalid="handleInvalid"
                @remove="handleRemove"
              />
            </template>
          </competitor-identity-form>
        </async-state>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import CompetitorPhoto from '~/components/admin/competitors/CompetitorPhoto.vue'
import CompetitorIdentityForm from '~/components/admin/competitors/CompetitorIdentityForm.vue'
import CompetitorsTable from '~/components/admin/competitors/CompetitorsTable.vue'
import CompetitorsToolbar from '~/components/admin/competitors/CompetitorsToolbar.vue'
import ReferenceHead from '~/components/admin/ReferenceHead.vue'
import AsyncState from '~/components/common/AsyncState.vue'
import { useAdminCompetitors } from '~/composables/useAdminCompetitors'
import { useCompetitorIdentity } from '~/composables/useCompetitorIdentity'
import { useCompetitorPhoto } from '~/composables/useCompetitorPhoto'
import { useT } from '~/composables/useT'
import { ADMIN_COMPETITORS_PAGE_SIZE } from '~/consts/admin-competitors.const'
import type { ACCOUNT_ERROR } from '~/enums/account.enum'
import type { ICompetitorFormValues, ICompetitorsScreenProps } from '~/interfaces/admin-competitors.interface'
import { toCompetitorFormValues } from '~/utils/admin-competitors.util'

/*********************************************************
 * Global
 *
 * @description
 * Écran « Compétiteurs » de l'admin (F-13) : l'annuaire (recherche, pagination, dans l'URL) et, à côté, la correction
 * d'identité du compétiteur choisi (`competitorId`, l'identifiant de l'URL). Les deux pages de l'écran (`/admin/competiteurs` et
 * `/admin/competiteurs/{id}`) ne font que lui passer cet identifiant.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<ICompetitorsScreenProps>(), { competitorId: null })
const emits = defineEmits<{}>()
defineSlots<{}>()
const pageSize = ADMIN_COMPETITORS_PAGE_SIZE
const title = computed(() => t('pages.admin_competitors.title', 'Compétiteurs'))
useHead({ title })
const emptyTitle = computed(() => ({ key: 'admin.competitors.empty', fallback: 'Aucun compétiteur ne correspond' }))
const selectHint = computed(() => t('admin.competitors.select_hint', 'Choisissez « Corriger » sur une ligne pour modifier l’identité d’un compétiteur.'))

/*********************************************************
 * Annuaire
 *
 * @description
 * La recherche (`draft`) et la page vivent dans l'URL.
 ********************************************************/
const {
  draft, competitors, total, page, pending: listPending, failure: listFailure, isEmpty, setPage, refresh: refreshList
} = useAdminCompetitors()

/*********************************************************
 * Identité
 *
 * @description
 * La fiche porte la version de l'identité ; le composable l'envoie en `If-Match`. Les valeurs du formulaire suivent la fiche.
 ********************************************************/
const competitorId = computed(() => props.competitorId)
const { competitor, loading, loadFailure, save, saving, saved, failure, reload, refresh } = useCompetitorIdentity(competitorId)
const values = computed<ICompetitorFormValues>(() => competitor.value
  ? toCompetitorFormValues(competitor.value)
  : { displayName: '', firstName: '', lastName: '', nickname: '' })
const handleSubmit = (submitted: ICompetitorFormValues) => {
  save(submitted)
}

/*********************************************************
 * Photo
 *
 * @description
 * Second appel, indépendant de l'identité (B-16) : la photo ne fait pas avancer la version. Après un envoi ou un retrait, la fiche
 * et l'annuaire sont rechargés (l'URL de l'image change).
 ********************************************************/
const { upload, remove, reject, error: photoError, pending: photoPending } = useCompetitorPhoto(competitorId, reload)
const handleSelect = (file: File) => {
  upload(file)
}
const handleInvalid = (reason: ACCOUNT_ERROR) => {
  reject(reason)
}
const handleRemove = () => {
  remove()
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
.competitors-screen {
  display: grid;
  gap: var(--competitors-screen---gap, var(--origam-space---5));
  padding-block: var(--competitors-screen---padding-block, var(--origam-space---12) var(--origam-space---10));

  &__grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) var(--competitors-screen__panel---width, 23.9375rem);
    align-items: start;
    gap: var(--competitors-screen__grid---gap, var(--origam-space---5));
  }

  &__list,
  &__panel {
    min-width: 0;
  }

  &__hint {
    margin: 0;
    color: var(--competitors-screen__hint---color, var(--origam-color__text---tertiary));
  }

  @media (max-width: 1424px) {
    &__grid {
      grid-template-columns: minmax(0, 1fr);
    }
  }
}
</style>

<style>
:root {
  --competitors-screen---gap: var(--origam-space---5);
  --competitors-screen---padding-block: var(--origam-space---12) var(--origam-space---10);
  --competitors-screen__grid---gap: var(--origam-space---5);
  --competitors-screen__panel---width: 23.9375rem;
  --competitors-screen__hint---color: var(--origam-color__text---tertiary);
}
</style>
