<template>
  <origam-data-table
    v-bind="forwardedProps"
  >
    <template
      v-for="slotName in slotNames"
      :key="slotName"
      #[slotName]="slotProps"
    >
      <slot
        :name="slotName"
        v-bind="slotProps ?? {}"
      />
    </template>
    <template
      v-for="header in sortHeaders"
      :key="`sort-${header.key}`"
      #[`header.${header.key}`]="slotProps"
    >
      <button
        type="button"
        class="app-data-table__sort"
        :data-cy="`sort-${header.key}`"
      >
        <span class="origam-data-table-header-cell__content">
          <span>{{ header.title }}</span>
          <origam-icon
            :icon="slotProps.getSortIcon(slotProps.column)"
            :class="{ 'origam-data-table-header-cell__sort-icon--active': slotProps.isSorted(slotProps.column) }"
            class="origam-data-table-header-cell__sort-icon"
          />
        </span>
      </button>
    </template>
  </origam-data-table>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, useSlots } from 'vue'
import { OrigamDataTable, OrigamIcon } from 'origam/components'
import type { IDataTableProps } from 'origam/interfaces'
import type { IAppDataTableEmits, IAppDataTableProps, IAppDataTableSlots } from '~/interfaces/app-data-table.interface'
import { pickPassedListeners, pickPassedProps } from '~/utils/passed-props.util'

/*********************************************************
 * Global
 *
 * @description
 * `origam-data-table` utilisé tel quel : même composant racine, donc même DOM et mêmes classes (le style global des
 * tableaux, F-00g, s'applique sans changement). Ce wrapper n'existe que pour le typage (Origam #1246, voir plus bas).
 * Les props, les écouteurs et tous les slots sont retransmis ; seules les props réellement passées le sont, pour ne pas
 * écraser les valeurs par défaut du thème.
 ********************************************************/
const props = withDefaults(defineProps<IAppDataTableProps>(), {})
const emits = defineEmits<IAppDataTableEmits>()
defineSlots<IAppDataTableSlots>()
const instance = getCurrentInstance()
const slots = useSlots()
const slotNames = computed(() => Object.keys(slots) as Array<keyof IAppDataTableSlots>)

/*********************************************************
 * Origam #1246 : prop `item` requise
 *
 * @description
 * `IDataTableProps` hérite de `IDataTableRowProps`, dont la prop `item` (une ligne) est requise : tout usage typé de la
 * table sans `item` échoue au typecheck (et Vue avertit « Missing required prop: item » en dev). Cette table ne
 * porte aucune ligne : on retire `item` du contrat de ce wrapper (`Omit`), et c'est ICI, et nulle part ailleurs dans
 * le projet, que l'on reconvertit les props retransmises vers `IDataTableProps`.
 * Origam #1250 : `items` mal typé. Origam le type `IDataTableItem[]` (la ligne interne : `key`, `index`, `columns`),
 * alors que la table reçoit des objets libres ; le wrapper l'accepte en `any[]` (items.interface.ts:15 et
 * data-table-header.interface.ts:22 côté Origam).
 * Condition de suppression : Origam publie les corrections de #1246 (`item` absent de `IDataTableProps`) ET de #1250
 * (`items` libre). Ce fichier devient alors inutile : les écrans reprennent `origam-data-table`.
 ********************************************************/
const forwardedProps = computed(() => ({
  ...pickPassedProps(instance?.vnode.props, props as Record<string, unknown>),
  ...pickPassedListeners(instance?.vnode.props)
}) as unknown as IDataTableProps)

/*********************************************************
 * Origam : tri des colonnes au clavier (T-A11Y-01, M2)
 *
 * @description
 * Le `th` d'une colonne triable n'est ni focalisable ni activable au clavier (fiche `docs/tickets/origam/data-table-tri-colonnes-clavier.md`, à
 * déposer) : mesuré, 25 Tab depuis le champ de recherche de `/joueurs` n'atteignent aucun en-tête. Pour chaque colonne triable sans slot
 * `header.<clé>` fourni par l'écran, un `<button>` natif est rendu dans le `th` (même contenu et mêmes classes qu'Origam : titre et icône de tri) :
 * Entrée et Espace produisent un clic qui remonte au `th`, dont le gestionnaire trie et met `aria-sort` à jour ; Origam n'est pas modifié.
 * Condition de suppression : Origam rend ce bouton dans l'en-tête des colonnes triables.
 ********************************************************/
const sortHeaders = computed(() => props.disableSort
  ? []
  : (props.headers ?? []).filter(header => header.sortable === true && header.key !== undefined && header.children === undefined && !(`header.${String(header.key)}` in slots)))

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
// Défaut Origam (fiche docs/tickets/origam/data-table-th-align-end-sans-effet.md, à déposer) : `text-align: end` de `--align-end` n'atteint pas le `th` (calculé à `start`).
:deep(th.origam-data-table-cell--align-end) {
  text-align: end;
}

.app-data-table__sort {
  display: block;
  width: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  letter-spacing: inherit;
  text-align: inherit;
  text-transform: inherit;
  cursor: pointer;
}
</style>
