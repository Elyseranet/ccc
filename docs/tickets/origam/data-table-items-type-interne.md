# ds(data-table) : la prop `items` est typée `IDataTableItem[]` (ligne interne) au lieu des objets libres du consommateur

## Constat

`origam-data-table` reçoit, à l'exécution, un tableau d'objets libres (`[{ name: 'A' }]`). Mais au **typage**, sa prop `items` exige `IDataTableItem[]`, qui est le format INTERNE d'une ligne (`key`, `index`, `columns`…). Un usage normal et documenté échoue donc à vue-tsc avec TS2322 :

```vue
<origam-data-table :headers="headers" :items="[{ name: 'A' }]" />
```

Ce défaut est distinct de #1246 (prop `item` requise héritée de la ligne), mais il a la même origine : les props de la ligne sont réutilisées pour la table.

Constaté dans CCC (F-00j, wrapper `AppDataTable`) en 2.37.3.

## Cause

`IDataTableProps` (`packages/ds/src/interfaces/DataTable/data-table.interface.ts:49`) agrège des interfaces qui typent `items` avec le type de ligne interne (`IDataTableItem`), au lieu d'un type d'entrée générique. Je ne sais pas laquelle des interfaces agrégées déclare précisément `items` : à localiser dans `IDataTableItemsProps`, sans doute.

## Impact

Tout consommateur typé doit caster `items`. CCC le fait une seule fois, dans un wrapper qui contourne aussi #1246.

## Critère d'acceptation

1. `items` accepte un tableau d'objets du consommateur, par exemple un générique `T extends Record<string, unknown>`, ou `unknown[]` avec des `headers` qui référencent ses clés.
2. L'exemple ci-dessus passe vue-tsc sans cast.
3. Le type interne `IDataTableItem` reste réservé aux slots et aux événements qui exposent une ligne.

## Version

2.37.3
