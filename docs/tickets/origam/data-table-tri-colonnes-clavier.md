# ds(data-table) : le tri d'une colonne ne se déclenche qu'à la souris, l'en-tête `th` n'est ni focalisable ni activable au clavier

## Constat

Un `origam-data-table` dont une colonne est `sortable: true` rend un `<th>` avec `aria-sort` et un gestionnaire `@click`, mais sans `tabindex`, sans `role="button"` et sans gestionnaire `keydown`. Le `th` ne reçoit jamais le focus au clavier : l'utilisateur qui n'utilise pas la souris ne peut pas trier le tableau (WCAG 2.1.1 clavier, 4.1.2 nom, rôle, valeur ; RGAA 7.1, 7.3).

Mesuré dans CCC (T-A11Y-01, M2, navigateur Chromium, annuaire `/joueurs`, Origam 2.37.4) : depuis le bouton de soumission de la recherche, 25 appuis sur Tab visitent « Comparer deux joueurs », puis les liens de joueurs, puis les boutons de pagination ; **aucun des six `th` du tableau n'est atteint**. Les `th` ont `aria-sort` (« ascending » pour la colonne triée, « none » pour les autres), pas de `tabindex`, pas de `role`, pas de bouton ni de lien dedans. Un clic de souris sur l'en-tête fait passer `aria-sort` à « descending » : le tri fonctionne, mais seulement à la souris. `th.focus()` est sans effet (élément non focalisable).

## Reproduction minimale

```vue
<origam-data-table
  :headers="[{ key: 'name', title: 'Nom', sortable: true }, { key: 'age', title: 'Âge', sortable: true }]"
  :items="[{ name: 'Lou', age: 31 }, { name: 'Inès', age: 28 }]"
/>
```

Tab depuis un élément placé avant le tableau : le focus saute les en-têtes. Aucune touche n'active le tri.

## Cause

`OrigamDataTableHeaderCell.vue` : `@click="handleClick"` sur le `th` (ligne 16), `aria-sort` (ligne 5), et aucune des trois choses attendues pour un contrôle : élément focalisable, rôle, activation par Entrée et Espace. Ni `OrigamDataTableHeadersCell.vue` ni `composables/DataTable` ne portent de chemin de tri au clavier.

## Impact

Le seul tableau triable livré de CCC (annuaire des joueurs, `PlayersDirectory.vue`) n'est pas triable au clavier ni au lecteur d'écran. Contournement possible côté application : le slot `header.<clé>` rendant un `<button>` dans le `th`, mais il faut alors rebrancher le tri à la main (`sortBy`, `update:sortBy`), ce que le composant fait déjà.

## Critère d'acceptation

1. Pour une colonne triable, l'en-tête contient un contrôle natif (`<button>` dans le `th`, qui garde `aria-sort`) focalisable par Tab, avec un focus visible.
2. Entrée et Espace déclenchent le même tri qu'un clic, et font passer `aria-sort` de « none » à « ascending », puis « descending ».
3. Une colonne non triable ne reçoit pas le focus.
4. Le nom accessible du bouton est le titre de la colonne ; il peut annoncer le sens du tri (« trié par ordre croissant »).
5. Test : Tab atteint chaque en-tête triable ; Entrée change `aria-sort`.

## Version

2.37.4
