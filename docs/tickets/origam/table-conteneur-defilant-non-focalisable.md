# ds(table, data-table) : le conteneur qui défile n'est pas focalisable et n'accepte aucun attribut

## Constat

`OrigamTable` rend `div.origam-table` (racine, `overflow: hidden`) puis `div.origam-table__wrapper` (`overflow-x: auto`) : c'est le wrapper qui défile quand le tableau est plus large que l'écran. `OrigamDataTable` fait de même (le wrapper porte les classes `origam-table__wrapper origam-data-table`, et la racine `div.origam-table` reçoit `data-cy`, `role`, `tabindex`).

Le wrapper défilant n'a ni `tabindex` ni prop pour en poser un : les attributs passés au composant (`tabindex`, `role`, `aria-label`) arrivent sur la racine, qui ne défile pas. Résultat : à 390 px, axe signale `scrollable-region-focusable` (WCAG 2.1.1) sur `.origam-table__wrapper` pour le tableau du parcours d'un joueur et pour les tableaux de la page de confidentialité ; un utilisateur du clavier ne peut pas faire défiler le tableau.

## Attendu

Une prop (ou un slot `wrapper-attrs`) qui pose `tabindex="0"`, `role="region"` et `aria-label` sur l'élément qui défile, ou un tableau dont la racine défile à la place du wrapper quand elle est focalisable.

## Contournement CCC (T-A11Y-01 S18)

Règle centralisée dans `src/assets/css/main.css` : un `.origam-table[tabindex="0"]` devient lui-même le conteneur défilant (`overflow-x: auto`) et son wrapper ne défile plus (`overflow-x: visible`) ; le composant reçoit `role="region"`, `tabindex="0"` et un `aria-label`. Test : `tests/e2e/a11y/T-A11Y-01-s18.spec.ts` et axe à 390 px (`tests/e2e/a11y.spec.ts`).
