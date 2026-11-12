<template>
  <div
    class="legal-page page-wrap"
    data-cy="legal-page"
  >
    <div class="legal-page__layout">
      <aside class="legal-page__aside">
        <nav
          :aria-label="tocLabel"
          data-cy="legal-toc"
        >
          <details
            class="legal-page__toc"
            :open="tocOpen"
          >
            <summary class="legal-page__toc-summary">
              {{ tocLabel }}
            </summary>
            <ol class="legal-page__toc-list">
              <li
                v-for="section in sections"
                :key="section.id"
              >
                <a
                  class="legal-page__toc-link"
                  :href="section.anchor"
                  :data-cy="`legal-toc-${section.id}`"
                >{{ section.title }}</a>
              </li>
            </ol>
          </details>
        </nav>
      </aside>
      <article class="legal-page__body">
        <origam-breadcrumb
          :items="breadcrumb"
          density="compact"
          :aria-label="breadcrumbLabel"
          data-cy="legal-breadcrumb"
        />
        <origam-title
          tag="h1"
          font-size="4xl"
          line-height="none"
          class="legal-page__title font-display neon--sm"
          data-cy="page-title"
          :text="title"
        />
        <p
          class="legal-page__meta"
          data-cy="legal-updated"
        >
          {{ updatedLabel }}
          <legal-text :text="updated" />
        </p>
        <section
          v-for="section in sections"
          :key="section.id"
          class="legal-page__section"
          :aria-labelledby="section.headingId"
          :data-cy="`legal-section-${section.id}`"
        >
          <origam-title
            :id="section.headingId"
            tag="h2"
            font-size="2xl"
            font-weight="bold"
            line-height="tight"
            letter-spacing="normal"
            :text="section.title"
          />
          <div
            :id="section.id"
            class="legal-page__content"
          >
            <template
              v-for="block in section.blocks"
              :key="block.id"
            >
              <p v-if="block.isParagraph">
                <legal-text :text="block.text" />
              </p>
              <origam-title
                v-else-if="block.isSubheading"
                tag="h3"
                font-size="lg"
                font-weight="bold"
                line-height="normal"
                letter-spacing="normal"
                :text="block.text"
              />
              <ul v-else-if="block.isList">
                <li
                  v-for="item in block.items"
                  :key="item.id"
                >
                  <legal-text :text="item.text" />
                </li>
              </ul>
              <origam-table
                v-else-if="block.isTable"
                class="legal-page__table"
                :caption="block.table?.caption"
                caption-visible
              >
                <template #default>
                  <thead>
                    <tr>
                      <th
                        v-for="column in block.table?.columns"
                        :key="column.id"
                        scope="col"
                      >
                        {{ column.text }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="row in block.table?.rows"
                      :key="row.id"
                    >
                      <td
                        v-for="cell in row.cells"
                        :key="cell.id"
                      >
                        <code v-if="cell.isCode">{{ cell.text }}</code>
                        <legal-text
                          v-else
                          :text="cell.text"
                        />
                      </td>
                    </tr>
                  </tbody>
                </template>
              </origam-table>
              <origam-data-list
                v-else-if="block.isDefinitions"
                mode="kv"
                :items="block.definitions"
                :border="false"
                margin="0"
                bg-color="transparent"
                class="legal-page__definitions"
                data-cy="legal-definitions"
              >
                <template #value="{ value }">
                  <legal-text :text="String(value)" />
                </template>
              </origam-data-list>
              <p v-else-if="block.isExternalLink">
                <a
                  class="legal-page__link"
                  :href="block.link?.href"
                  rel="noopener"
                  data-cy="legal-external-link"
                >{{ block.link?.text }}</a>
              </p>
              <p v-else-if="block.isInternalLink">
                <nuxt-link
                  class="legal-page__link"
                  :to="block.link?.to"
                  data-cy="legal-internal-link"
                >
                  {{ block.link?.text }}
                </nuxt-link>
              </p>
            </template>
          </div>
        </section>
        <origam-card
          tag="nav"
          class="legal-page__card"
          rounded="xl"
          border
          border-color="var(--origam-color__border---subtle)"
          elevation="md"
          padding="6"
          aria-labelledby="legal-related-title"
          data-cy="legal-related"
        >
          <template #default>
            <origam-title
              id="legal-related-title"
              tag="h2"
              font-size="2xl"
              font-weight="bold"
              line-height="tight"
              letter-spacing="normal"
              :text="relatedTitle"
            />
            <ul class="legal-page__related">
              <li
                v-for="link in related"
                :key="link.to"
              >
                <origam-btn
                  :to="link.to"
                  variant="outlined"
                  rounded="full"
                  :data-cy="`legal-related-${link.to}`"
                  :text="link.text"
                />
              </li>
            </ul>
          </template>
        </origam-card>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { OrigamBreadcrumb, OrigamBtn, OrigamCard, OrigamDataList, OrigamTable, OrigamTitle } from 'origam/components'
import LegalText from '~/components/legal/LegalText.vue'
import { useLegalPage } from '~/composables/useLegalPage'
import type { ILegalPageProps } from '~/interfaces/legal.interface'

/*********************************************************
 * Global
 *
 * @description
 * Page de lecture longue des pages légales : fil d'Ariane, titre, date de mise à jour, sections, carte « Voir aussi »,
 * et sommaire d'ancres natives (`nav` + `details`/`summary`, sans JS ni ARIA : c'est de la navigation, pas un accordéon).
 * Le contenu vient d'une constante (`LEGAL_*_CONTENT`), traduit par `useLegalPage`.
 *
 * @description
 * Éditeur (`origam-data-list` mode `kv`) : tout ce qui a une variable passe par elle (affichage grille, gras et couleur
 * de la clé, tailles). Il reste deux `:deep()` sur la grille (lignes en `display: contents`, pour aligner les clés entre
 * elles) et sur la valeur (en bloc, sinon le texte et le marqueur deviennent deux éléments flex), plus un en mobile pour
 * l'espacement entre deux paires. Ces propriétés n'ont pas de variable dans Origam : défaut suivi dans
 * Elyseranet/origam#1267 (précédent : `HeadToHeadSummary.vue`, F-05).
 ********************************************************/
const props = withDefaults(defineProps<ILegalPageProps>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const { title, updated, sections, related, breadcrumb, tocLabel, updatedLabel, relatedTitle, breadcrumbLabel, tocOpen } = useLegalPage(() => props.content)

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.legal-page {
  padding-top: var(--legal-page---padding-top, var(--origam-space---10));
  padding-bottom: var(--legal-page---padding-bottom, var(--origam-space---16));

  &__layout {
    display: grid;
    grid-template-columns: var(--legal-page__aside---width, 15rem) minmax(0, var(--legal-page__body---max-width, 68ch));
    justify-content: start;
    align-items: start;
    gap: var(--legal-page---gap, var(--origam-space---12));
  }

  &__aside {
    position: sticky;
    top: calc(var(--origam-space---20) + var(--origam-space---4));
  }

  &__toc {
    padding: var(--origam-space---4);
    border: var(--origam-border__width---thin) solid var(--origam-color__border---default);
    border-radius: var(--origam-radius---xl);
    background: var(--origam-color__surface---raised);
  }

  &__toc-summary {
    display: flex;
    align-items: center;
    min-height: var(--origam-space---11);
    padding-inline: var(--origam-space---3);
    border-radius: var(--origam-radius---lg);
    font-weight: var(--origam-font__weight---bold);
    cursor: pointer;

    &::after {
      content: '▾';
      margin-inline-start: auto;
      color: var(--origam-color__text---secondary);
    }
  }

  &__toc[open] > &__toc-summary::after {
    content: '▴';
  }

  &__toc-list {
    display: grid;
    gap: var(--origam-space---1);
    margin: var(--origam-space---2) 0 0;
    padding: 0;
    list-style: none;
  }

  &__toc-link {
    display: flex;
    align-items: center;
    min-height: var(--origam-space---11);
    padding-inline: var(--origam-space---3);
    border-radius: var(--origam-radius---lg);
    color: var(--origam-color__text---secondary);
    font-size: var(--origam-font__size---sm);
    text-decoration: none;

    &:hover {
      background: var(--origam-color__action--ghost---bgHover);
      color: var(--origam-color__text---primary);
    }
  }

  &__body {
    display: grid;
    gap: var(--origam-space---8);
    min-width: 0;
  }

  &__title {
    margin-top: var(--origam-space---4);
  }

  &__meta {
    margin: calc(-1 * var(--origam-space---4)) 0 0;
    color: var(--origam-color__text---secondary);
    font-size: var(--origam-font__size---sm);
  }

  &__section {
    display: grid;
    gap: var(--origam-space---3);
  }

  &__content {
    display: grid;
    gap: var(--origam-space---3);
    scroll-margin-top: calc(var(--origam-space---20) + var(--origam-space---4));

    p,
    li {
      margin: 0;
      line-height: var(--origam-font__lineHeight---normal);
    }

    h3 {
      margin: var(--legal-page__subheading---margin-top, var(--origam-space---2)) 0 0;
    }

    ul {
      display: grid;
      gap: var(--origam-space---1);
      margin: 0;
      padding-left: 1.25em;
      list-style: disc;
    }

    code {
      padding-inline: var(--origam-space---1);
      border-radius: var(--origam-radius---sm);
      background: var(--origam-color__surface---sunken);
      font-family: var(--origam-font__family---mono);
      font-size: var(--origam-font__size---sm);
    }
  }

  &__definitions {
    --origam-data-list__kv---display: grid;
    --origam-data-list__kv---key-font-size: var(--origam-font__size---md);
    --origam-data-list__kv---key-font-weight: var(--origam-font__weight---bold);
    --origam-data-list__kv---key-color: var(--origam-color__text---secondary);
    --origam-data-list__kv---value-font-size: var(--origam-font__size---md);

    grid-template-columns: max-content minmax(0, 1fr);
    gap: var(--origam-space---2) var(--origam-space---5);
  }

  &__definitions :deep(.origam-data-list__kv-row) {
    display: contents;
  }

  &__definitions :deep(.origam-data-list__kv-value) {
    display: block;
  }

  &__table :deep(th),
  &__table :deep(td) {
    white-space: normal;
    vertical-align: var(--legal-page__table---vertical-align, middle);
  }

  &__link {
    color: var(--origam-color__text---primary);
    text-underline-offset: var(--legal-page__link---underline-offset, 3px);
  }

  &__related {
    display: flex;
    flex-wrap: wrap;
    gap: var(--origam-space---2);
    margin: var(--origam-space---3) 0 0;
    padding: 0;
    list-style: none;
  }
}

@media (max-width: 760px) {
  .legal-page__card {
    padding: var(--origam-space---5);
  }
}

@media (max-width: 1000px) {
  .legal-page {
    &__layout {
      grid-template-columns: minmax(0, 1fr);
      gap: var(--origam-space---6);
    }

    &__aside {
      position: static;
    }

    &__definitions {
      grid-template-columns: minmax(0, 1fr);
      gap: var(--origam-space---1);
    }

    &__definitions :deep(.origam-data-list__kv-row + .origam-data-list__kv-row .origam-data-list__kv-key) {
      margin-top: var(--origam-space---2);
    }
  }
}
</style>

<style>
:root {
  --legal-page---padding-top: var(--origam-space---10);
  --legal-page---padding-bottom: var(--origam-space---16);
  --legal-page---gap: var(--origam-space---12);
  --legal-page__aside---width: 15rem;
  --legal-page__body---max-width: 68ch;
}
</style>
