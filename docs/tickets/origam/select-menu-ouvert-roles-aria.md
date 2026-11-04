# ds(select) : menu ouvert, le combobox n'a pas `aria-controls` et le `role="menu"` de l'overlay contient un `role="listbox"`

## Constat

Mesuré par axe-core (WCAG 2.2 AA) sur `/admin/participants` (F-09), `origam-select` `autocomplete`, menu **ouvert** (la saisie a ouvert la liste des suggestions) :

1. **`aria-required-attr`** sur `<div class="origam-field" role="combobox" aria-haspopup="menu" aria-expanded="true" aria-owns="…">` : `aria-controls` absent. WAI-ARIA 1.2 le classe parmi les propriétés requises du rôle `combobox`. Variante, menu ouvert, du défaut déjà décrit pour le menu fermé (`select-aria-controls-ferme.md`).
2. **`aria-required-children`** sur `<div class="origam-overlay origam-menu" role="menu">` : « Element has children which are not allowed: [role=listbox] ». L'overlay du menu est un `role="menu"` ; la liste d'options qu'il contient est un `role="listbox"`, non autorisé comme enfant d'un `menu`.

Le défaut ne vient pas des options : celles de CCC portent `role="option"` et `aria-selected`.

## Mesure (CCC, F-09, Origam 2.37.4)

Menu fermé : 0 violation axe. Menu ouvert : les deux violations ci-dessus, et elles seules.

## Ce qu'il faudrait

Un overlay du menu de `origam-select` qui n'ait pas le rôle `menu` (le rôle de la liste suffit, ou un `role="presentation"` sur l'overlay), et un `aria-controls` du combobox qui pointe sur la liste dès l'ouverture.

## Contournement CCC

Aucun contournement local. Le test e2e du menu ouvert (`tests/e2e/writes/F-09.spec.ts`) exige zéro violation axe **hors** ces deux règles, restreintes à ces deux éléments (le combobox et l'overlay du menu) ; il continue de passer si Origam les corrige. À retirer de la liste d'exceptions du test quand Origam livre le correctif.

## Version

2.37.4 (installée ; ^2.37.3 déclarée)
