# ds(data-table) : `OrigamDataTable` hérite d'une prop `item` requise, d'où « Missing required prop: item »

## Constat

Monter un `origam-data-table` avec `headers` et `items` produit en dev l'avertissement Vue `Missing required prop: "item"`. La prop `item` n'a pas de sens au niveau de la table : elle décrit UNE ligne.

Constaté dans CCC (F-05, face-à-face) en 2.37.3.

## Reproduction minimale

```vue
<origam-data-table :headers="[{ title: 'Nom', key: 'name' }]" :items="[{ name: 'A' }]" />
```

La console dev affiche `[Vue warn]: Missing required prop: "item"`.

## Cause

- `packages/ds/src/interfaces/DataTable/data-table.interface.ts:49` : `IDataTableProps extends … IDataTableRowProps …`.
- `packages/ds/src/interfaces/DataTable/data-table-row.interface.ts:20-21` : `IDataTableRowProps` déclare `item: IDataTableItem`, une prop **requise**.

L'interface de la ligne est réutilisée telle quelle pour la table entière, et sa prop requise `item` remonte au composant racine.

## Impact

L'avertissement apparaît à chaque table, et noie les vrais avertissements. Le typage de la table exige aussi une prop sans signification.

## Critère d'acceptation

1. `IDataTableProps` n'expose plus `item`, par exemple avec `Omit<IDataTableRowProps, 'item'>`, ou en extrayant les props de ligne partagées dans une interface sans `item`.
2. Le montage de l'exemple ci-dessus ne produit aucun avertissement `Missing required prop`.
3. `OrigamDataTableRow` garde `item` requis.

## Version

2.37.3
