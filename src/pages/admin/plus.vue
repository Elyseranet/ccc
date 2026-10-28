<template>
  <div class="admin-more">
    <header class="admin-more__head">
      <p class="admin-more__eyebrow">
        {{ eyebrow }}
      </p>
      <origam-title
        tag="h1"
        class="admin-more__title font-display neon--sm"
        data-cy="page-title"
        :text="title"
      />
    </header>
    <nav
      :aria-label="navLabel"
      data-cy="admin-more-nav"
    >
      <origam-list
        nav
        :items="links"
        :item-props="true"
        density="comfortable"
        rounded="xl"
        class="admin-more__links"
      />
    </nav>
    <section
      class="admin-more__edition"
      :aria-labelledby="editionTitleId"
    >
      <origam-title
        :id="editionTitleId"
        tag="h2"
        class="admin-more__card-title"
        :text="editionTitle"
      />
      <div class="admin-more__field">
        <origam-label
          :for="editionFieldId"
          class="admin-more__hint"
          :text="editionHint"
        />
        <admin-edition-select
          :id="editionFieldId"
          :label="editionHint"
          class="admin-more__select"
          data-cy="admin-more-edition-select"
        />
      </div>
    </section>
    <origam-alert
      v-if="failed"
      status="error"
      :text="logoutError"
      data-cy="admin-more-logout-error"
    />
    <origam-btn
      variant="outlined"
      block
      font-size="md"
      font-weight="bold"
      class="admin-more__logout"
      :loading="pending"
      :text="logoutLabel"
      data-cy="admin-more-logout"
      @click="handleLogout"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import { OrigamAlert, OrigamBtn, OrigamLabel, OrigamList, OrigamTitle } from 'origam/components'
import AdminEditionSelect from '~/components/admin/AdminEditionSelect.vue'
import IconChevronRight from '~/components/icons/IconChevronRight.vue'
import { useLogout } from '~/composables/useLogout'
import { useT } from '~/composables/useT'
import { ADMIN_MORE_ITEMS } from '~/consts/admin-more.const'

/*********************************************************
 * Page
 *
 * @description
 * Entrée « Plus » de la barre basse admin (FA-08) : ce qui n'a pas de place dans les quatre entrées de la barre.
 * L'édition active est celle du store `admin-edition`, la même que celle du sélecteur de la coque.
 ********************************************************/
definePageMeta({ layout: 'admin', middleware: 'admin' })
const { t } = useT()
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const { logout, pending, failed } = useLogout()
const editionFieldId = useId()
const editionTitleId = useId()
const title = computed(() => t('pages.admin_more.title', 'Plus'))
useHead({ title })

/*********************************************************
 * Libellés
 *
 * @description
 * Tout texte passe par `t()`.
 ********************************************************/
const eyebrow = computed(() => t('admin.more.eyebrow', 'Organisation'))
const navLabel = computed(() => t('admin.more.nav_label', 'Plus d’options'))
const editionTitle = computed(() => t('admin.more.edition_title', 'Édition active'))
const editionHint = computed(() => t('admin.more.edition_hint', 'Toutes les pages travaillent sur cette édition'))
const logoutLabel = computed(() => t('admin.more.logout', 'Se déconnecter'))
const logoutError = computed(() => t('admin.more.logout_error', 'La déconnexion a échoué. Réessayez.'))

/*********************************************************
 * Liens
 *
 * @description
 * Participants, site public et compte. Bracket, Compétiteurs et Éditions restent masqués (FA-09).
 ********************************************************/
const links = computed(() => ADMIN_MORE_ITEMS.map(item => ({
  title: t(item.key, item.label),
  subtitle: t(item.description.key, item.description.label),
  to: item.to,
  prependIcon: item.icon,
  appendIcon: IconChevronRight,
  rounded: 'xl'
})))

/*********************************************************
 * Déconnexion
 *
 * @description
 * Le composable appelle `POST /auth/logout`, vide la session puis renvoie vers l'espace public.
 ********************************************************/
const handleLogout = () => {
  logout()
}

/*********************************************************
 * Expose
 *
 * @description
 * Une page n'expose rien à un parent.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.admin-more {
  display: grid;
  gap: var(--admin-more---gap, var(--origam-space---5));

  &__head {
    display: grid;
    gap: var(--origam-space---2);
    margin-bottom: var(--origam-space---1);
  }

  &__eyebrow {
    margin: 0;
    font-size: var(--origam-font__size---xs);
    font-weight: var(--origam-font__weight---bold);
    letter-spacing: var(--origam-font__letterSpacing---wider);
    text-transform: uppercase;
    color: var(--origam-color__text---tertiary);
  }

  &__title {
    font-size: var(--origam-font__size---4xl);
    line-height: 1;
  }

  &__links {
    --origam-list---padding-inline-start: 0;
    --origam-list---padding-inline-end: 0;
    --origam-list---padding-block-start: 0;
    --origam-list---padding-block-end: 0;
    --origam-list---background: transparent;

    display: grid;
    gap: var(--origam-space---2);

    :deep(.origam-list-children) {
      display: grid;
      gap: var(--origam-space---2);
    }

    :deep(.origam-list-item) {
      --origam-list-item---min-height: calc(var(--origam-space---16) - var(--origam-list---density, 0px));
      --origam-list-item---padding-inline-start: calc(var(--origam-space---5) - var(--origam-list---density, 0px));
      --origam-list-item---padding-inline-end: calc(var(--origam-space---5) - var(--origam-list---density, 0px));
      --origam-list-item---padding-block-start: var(--origam-space---3);
      --origam-list-item---padding-block-end: var(--origam-space---3);
      --origam-list-item---border-width: var(--origam-border__width---thin);
      --origam-list-item---border-style: solid;
      --origam-list-item---border-color: var(--origam-color__border---default);

      background: var(--origam-color__surface---raised);
    }

    :deep(.origam-list-item__prepend) {
      margin-inline-end: var(--origam-space---4);
      color: var(--origam-color__action--secondary---fgSubtle);
    }

    :deep(.origam-list-item__prepend .stroke-icon) {
      --stroke-icon---size: var(--origam-space---6);
    }

    :deep(.origam-list-item__append) {
      color: var(--origam-color__text---primary);
      --origam-list-item__append---min-width: 0;
      --origam-list-item__append---min-height: 0;
    }

    :deep(.origam-list-item__append .stroke-icon) {
      --stroke-icon---size: var(--origam-space---3);
    }

    :deep(.origam-list-item__title) {
      font-size: var(--origam-font__size---md);
      font-weight: var(--origam-font__weight---bold);
      letter-spacing: normal;
      line-height: var(--origam-font__lineHeight---normal);
      color: var(--origam-color__text---primary);
    }

    :deep(.origam-list-item__subtitle) {
      --origam-list-item__subtitle---font-size: var(--origam-font__size---sm);
      --origam-list-item__subtitle---line-height: var(--origam-font__lineHeight---normal);
      --origam-list-item__subtitle---opacity: 1;
      --origam-list-item__subtitle---letter-spacing: normal;

      color: var(--origam-color__text---secondary);
    }
  }

  &__hint {
    font-size: var(--origam-font__size---xs);
    font-weight: var(--origam-font__weight---bold);
    letter-spacing: var(--origam-font__letterSpacing---wide);
    text-transform: uppercase;
    color: var(--origam-color__text---tertiary);
  }

  &__logout {
    --origam-btn---min-height: var(--origam-space---12);
    --origam-btn---color: var(--origam-color__text---primary);
    --origam-btn---border-color: var(--origam-color__border---strong);
    --origam-btn---border-width-outlined: var(--origam-border__width---2);
  }

  &__field {
    display: grid;
    gap: var(--origam-space---1);
  }

  &__select {
    --admin-edition-select---height: var(--origam-space---12);
    --admin-edition-select---text-shift: var(--origam-border__width---0);
  }

  &__edition {
    display: grid;
    padding: var(--origam-space---6);
    border: var(--origam-border__width---thin) solid var(--origam-color__border---default);
    border-radius: var(--origam-radius---xl);
    background: var(--origam-color__surface---raised);
    box-shadow: var(--origam-shadow---md);
  }

  @media (max-width: 760px) {
    &__edition {
      padding: var(--origam-space---5);
    }
  }

  &__card-title {
    letter-spacing: normal;
    font-size: var(--origam-font__size---xl);
    font-weight: var(--origam-font__weight---bold);
    line-height: var(--origam-font__lineHeight---tight);
  }
}
</style>

<style>
:root {
  --admin-more---gap: var(--origam-space---5);
}
</style>
