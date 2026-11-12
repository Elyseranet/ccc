# fix(data-table) : `text-align: end` de `--align-end` sans effet sur le `th` — défaut

> À déposer chez Origam (pas de numéro tant que la fiche n'est pas ouverte).

## Constat

Une colonne `align: 'end'` d'`origam-data-table` aligne bien ses cellules `td`, mais son en-tête `th` garde `text-align: start` (style calculé). L'en-tête d'une colonne alignée à droite reste donc à gauche dès que la colonne est plus large que son texte.

Mesuré dans CCC (F-13, liste des éditions, 1440 px) : `th.origam-data-table-cell--align-end` « Participants » a `text-align: start` (calculé), alors que la maquette le veut à droite. Écart visuel de la zone : 1,4 % à 6,7 %. La classe est présente ; la règle scoped `.origam-data-table-cell--align-end { text-align: end }` (`OrigamDataTableColumnCell.vue`) n'atteint pas l'élément.

## Reproduction

`<origam-data-table :headers="[{ key: 'a', title: 'A', align: 'end', width: '300px' }]" ... />` : lire `getComputedStyle(th).textAlign`.

## Impact

Les en-têtes alignés à droite ne le sont pas. Invisible quand la colonne est ajustée à son texte, visible dès qu'elle est plus large.

## Contournement CCC

`:deep(th.origam-data-table-cell--align-end) { text-align: end }` dans `src/components/common/AppDataTable.vue` (F-13).

## Critère d'acceptation

Le `th` d'une colonne `align: 'end'` a `text-align: end` (style calculé).

## Version

Celle de `node_modules/origam` du worktree (à confirmer au dépôt de la fiche).
