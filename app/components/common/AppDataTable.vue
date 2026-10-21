<template>
  <origam-data-table
    v-bind="forwardedProps()"
  >
    <template
      v-for="slotName in slotNames()"
      :key="slotName"
      #[slotName]="slotProps"
    >
      <slot
        :name="slotName"
        v-bind="slotProps ?? {}"
      />
    </template>
  </origam-data-table>
</template>

<script setup lang="ts">
import { getCurrentInstance, useSlots } from 'vue'
import { OrigamDataTable } from 'origam/components'
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
const slotNames = () => Object.keys(slots) as Array<keyof IAppDataTableSlots>

/*********************************************************
 * Origam #1246 : prop `item` requise
 *
 * @description
 * `IDataTableProps` hérite de `IDataTableRowProps`, dont la prop `item` (une ligne) est requise : tout usage typé de la
 * table sans `item` échoue au typecheck (et Vue avertit « Missing required prop: item » en dev). Cette table ne
 * porte aucune ligne : on retire `item` du contrat de ce wrapper (`Omit`), et c'est ICI, et nulle part ailleurs dans
 * le projet, que l'on reconvertit les props retransmises vers `IDataTableProps`.
 * Même contrat redéfini pour `items` : Origam le type `IDataTableItem[]` (la ligne interne : `key`, `index`, `columns`),
 * alors que la table reçoit des objets libres ; le wrapper l'accepte en `any[]`.
 * Condition de suppression : Origam publie la correction de #1246 (`item` absent de `IDataTableProps`, `items` libre).
 * Ce fichier devient alors inutile : les écrans reprennent `origam-data-table`.
 ********************************************************/
const forwardedProps = (): IDataTableProps => ({
  ...pickPassedProps(instance?.vnode.props, props as Record<string, unknown>),
  ...pickPassedListeners(instance?.vnode.props)
}) as unknown as IDataTableProps

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>
