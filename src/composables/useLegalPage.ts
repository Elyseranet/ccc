import { computed, onMounted, ref } from 'vue'
import type { Ref } from 'vue'
import { useT } from '~/composables/useT'
import { LEGAL_TOC_COLLAPSE_QUERY } from '~/consts/legal.const'
import { ROUTES } from '~/consts/routes.const'
import { LEGAL_BLOCK } from '~/enums/legal-block.enum'
import type { ITranslatableText } from '~/interfaces/common-components.interface'
import type { ILegalBlock, ILegalPageContent } from '~/interfaces/legal.interface'

/*********************************************************
 * useLegalPage
 *
 * @description
 * Traduit le contenu d'une page légale (`ILegalPageContent`, décrit par des clés) en modèle prêt à afficher :
 * le gabarit n'a ni comparaison ni appel à `t()`. Les marqueurs `[À FOURNIR : …]` restent dans les textes, c'est
 * `LegalText` qui les met en évidence.
 *
 * Le sommaire est ouvert au rendu serveur, puis replié au montage sous 1000 px : un état initial, sans animation,
 * comme `<details>` le fait nativement.
 ********************************************************/
export const useLegalPage = (content: Ref<ILegalPageContent> | (() => ILegalPageContent)) => {
  const { t } = useT()
  const source = computed(() => typeof content === 'function' ? content() : content.value)
  const text = (entry: ITranslatableText): string => t(entry.key, entry.fallback, entry.params)

  const blockOf = (block: ILegalBlock, index: number) => ({
    id: index,
    isParagraph: block.kind === LEGAL_BLOCK.PARAGRAPH,
    isSubheading: block.kind === LEGAL_BLOCK.SUBHEADING,
    isList: block.kind === LEGAL_BLOCK.LIST,
    isTable: block.kind === LEGAL_BLOCK.TABLE,
    isDefinitions: block.kind === LEGAL_BLOCK.DEFINITIONS,
    isExternalLink: block.kind === LEGAL_BLOCK.LINK && block.link?.href !== undefined,
    isInternalLink: block.kind === LEGAL_BLOCK.LINK && block.link?.to !== undefined,
    text: block.text ? text(block.text) : '',
    items: (block.items ?? []).map((item, itemIndex) => ({ id: itemIndex, text: text(item) })),
    definitions: (block.definitions ?? []).map(entry => ({ key: text(entry.term), value: text(entry.description) })),
    table: block.table
      ? {
          caption: text(block.table.caption),
          columns: block.table.columns.map((column, columnIndex) => ({ id: columnIndex, text: text(column) })),
          rows: block.table.rows.map((row, rowIndex) => ({
            id: rowIndex,
            cells: row.map((cell, cellIndex) => ({
              id: cellIndex,
              isCode: cell.code !== undefined,
              text: cell.code ?? (cell.text ? text(cell.text) : '')
            }))
          }))
        }
      : undefined,
    link: block.link
      ? { text: text(block.link.text), href: block.link.href, to: block.link.to }
      : undefined
  })

  const title = computed(() => text(source.value.title))
  const updated = computed(() => text(source.value.updated))
  const sections = computed(() => source.value.sections.map(section => ({
    id: section.id,
    headingId: `${section.id}-title`,
    anchor: `#${section.id}`,
    title: text(section.title),
    blocks: section.blocks.map(blockOf)
  })))
  const related = computed(() => source.value.related.map(link => ({ to: link.to, text: text(link.label) })))
  const breadcrumb = computed(() => [
    { title: t('legal.common.breadcrumb_home', 'Accueil'), to: ROUTES.HOME },
    { title: title.value, disabled: true }
  ])
  const tocLabel = computed(() => t('legal.common.toc_label', 'Sommaire'))
  const updatedLabel = computed(() => t('legal.common.updated_label', 'Dernière mise à jour :'))
  const relatedTitle = computed(() => t('legal.common.related_title', 'Voir aussi'))
  const breadcrumbLabel = computed(() => t('components.page_hero.breadcrumb_label', 'Fil d’Ariane'))

  const tocOpen = ref(true)
  onMounted(() => {
    tocOpen.value = !window.matchMedia(LEGAL_TOC_COLLAPSE_QUERY).matches
  })

  return { title, updated, sections, related, breadcrumb, tocLabel, updatedLabel, relatedTitle, breadcrumbLabel, tocOpen }
}
