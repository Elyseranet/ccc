# ds(select) : menu ouvert, deux `role="combobox"` imbriqués (champ et saisie) et un `role="menu"` qui contient un `role="listbox"`

Ticket Origam : #1331.

## Constat

Mesuré par axe-core (WCAG 2.2 AA) sur `/admin/participants` (F-09), `origam-select` `autocomplete`, menu **ouvert** (la saisie a ouvert la liste des suggestions). Menu fermé : 0 violation. Menu ouvert : deux violations, et elles seules.

1. **`aria-required-attr`** sur `<div class="origam-field" role="combobox" aria-haspopup="menu" aria-expanded="true" aria-owns="…">` : « Required ARIA attribute not present: aria-controls ». Ce n'est pas un `aria-controls` manquant sur le combobox de saisie : l'`<input role="combobox">` le porte bien une fois le menu ouvert (`OrigamSelect.vue:586-596`, `comboboxAriaAttrs` : `"aria-controls": menu.value ? listboxId : void 0`). Le défaut est qu'**un second `role="combobox"` existe sur le `<div class="origam-field">` qui enveloppe la saisie** : la page a deux combobox imbriqués, et celui du conteneur n'a ni `aria-controls` ni les attributs d'un combobox valide.
2. **`aria-required-children`** sur `<div class="origam-overlay origam-menu" role="menu">` : « Element has children which are not allowed: [role=listbox] ». L'overlay est un `role="menu"` (`OrigamMenu.vue:14`) et son contenu est l'`origam-list` du select, qui porte `role="listbox"` (`id=listboxId`) : un `listbox` n'est pas un enfant autorisé d'un `menu`.

## Causes (Origam 2.37.4, sources installées)

- Le `role="combobox"` du conteneur vient de la prop `role` d'`origam-select`, de valeur par défaut `"combobox"` (`OrigamSelect.vue:352`), transmise à `origam-text-field` (`OrigamSelect.vue:15` : `v-bind="{ ...textFieldProps, ...comboboxAriaAttrs }"`). `OrigamTextField.vue` la pose **deux fois** : sur `origam-field`, le conteneur (`OrigamTextField.vue:32`, `:role="role"`), et sur l'`<input>` (`OrigamTextField.vue:94`, `:role="role"`). Un seul des deux devrait la porter : la saisie, qui a déjà les attributs d'un combobox.
- Le conteneur reçoit aussi les attributs d'activateur du menu : le menu est rendu dans le champ avec `activator="parent"` (`OrigamSelect.vue:71-83`), et `OrigamMenu.vue:354-360` pose sur l'activateur `aria-haspopup="menu"`, `aria-expanded` et `aria-owns`. Le conteneur se retrouve donc avec `role="combobox"`, `aria-haspopup="menu"`, `aria-expanded` et `aria-owns`, qui contredisent `aria-haspopup="listbox"` de la saisie (`OrigamSelect.vue:586-596`). Je n'ai pas vérifié lequel des deux jeux d'attributs axe lit en premier.
- Le `role="menu"` de l'overlay est posé en dur (`OrigamMenu.vue:14`), y compris quand le contenu est un `listbox` (cas du select).

## Mesure (CCC, F-09, Origam 2.37.4)

Page `/admin/participants`, saisie dans le champ de recherche (`origam-select` `autocomplete`), menu ouvert, axe-core WCAG 2.2 AA : `aria-required-attr` (un nœud, le `div.origam-field`) et `aria-required-children` (un nœud, `div.origam-menu`). Les options (`role="option"`, `aria-selected`) ne sont pas en cause.

## Ce qu'il faudrait

- Pas d'attributs d'activateur de menu (`aria-haspopup="menu"`, `aria-expanded`, `aria-owns`) ni de `role="combobox"` sur le conteneur du champ quand la saisie est déjà le combobox : un seul combobox, la saisie.
- Un overlay sans `role="menu"` quand son contenu est un `listbox` (le rôle de la liste suffit, ou `role="presentation"` sur l'overlay).

## Contournement CCC

Aucun contournement local. Le test e2e du menu ouvert (`tests/e2e/writes/F-09.spec.ts`) exige zéro violation axe **hors** ces deux règles, restreintes aux deux éléments concernés (`role="combobox"` et `role="menu"`) ; il continue de passer si Origam les corrige. À retirer de la liste d'exceptions du test quand Origam livre le correctif.

## Version

2.37.4 (installée ; ^2.37.3 déclarée)
