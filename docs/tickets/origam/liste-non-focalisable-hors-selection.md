# ds(list) : `origam-list` toujours focalisable (`tabindex="0"`), même quand elle n'est pas sélectionnable — demande d'évolution

## Constat

`OrigamList` pose `tabindex="0"` sur sa racine quelle que soit son usage. Une liste d'affichage (aucun `selected`, `selectStrategy` ni `onUpdate:selected`) reçoit `role="list"` et ses items `role="listitem"` (le DS distingue donc déjà les deux cas pour les rôles), mais reste un arrêt de tabulation. Seule la prop `disabled` retire le `tabindex` (`-1`) : elle grise aussi la liste, ce n'est pas un contournement.

Mesure dans CCC (Origam 2.37.4, composant monté avec `<origam-list tag="ol">` et deux `<origam-list-item tag="li">`, test de composant jetable non commité, F-28) :

```html
<ol id="origam-list-v-0-0-0" class="origam-list origam-list--density-default origam-list--one-line" tabindex="0" role="list">
  <li class="origam-list-item" role="listitem">…</li>
  <li class="origam-list-item" role="listitem">…</li>
</ol>
```

Conséquences :
- chaque liste d'affichage devient un arrêt de tabulation sans action (le focus n'active rien, il n'y a pas de navigation fléchée utile) : la page compte autant d'arrêts de tabulation en plus que de listes ;
- `PlayerJourney` (graphique en barres décoratif de la fiche joueur) rend sa liste dans `aria-hidden="true"`. Avec `origam-list`, la liste serait **focalisable dans une zone masquée aux technologies d'assistance** (c'est ce que cible la règle axe `aria-hidden-focus`, WCAG 4.1.2 ; non mesuré avec axe, déduit du rendu), ce qui interdit le remplacement ;
- c'est la seule raison pour laquelle CCC garde des `ul`/`ol` natifs pour 11 listes statiques (accueil, palmarès, règles, fiche joueur, file de matchs admin) et 4 listes de navigation des layouts (voir `docs/tickets/F-28.md`, section « Groupe Reste »).

## Cause (Origam 2.37.4, `node_modules/origam/dist/src/components/List/OrigamList.vue`)

- `:8` : `:tabindex="tabIndex"` sur la racine ; `:241-243` : `const tabIndex = computed(() => props.disabled || isFocused.value ? -1 : 0)`. Aucune branche ne tient compte de la sélectionnabilité.
- `:227-229` : `listRole` vaut `listbox` si la liste est sélectionnable, `list` sinon. Le calcul qui distingue les deux cas existe, mais n'est pas réutilisé pour le `tabindex`.
- Les gestionnaires `@focus`, `@focusin`, `@focusout`, `@keydown`, `@mousedown` (`:10-14`) sont aussi posés dans tous les cas.

## Contournement côté CCC

- `ul`/`ol` natifs conservés pour les listes statiques (décision utilisateur 2026-11-12, F-28). Aucun CSS ni attribut ajouté pour compenser.
- Un `tabindex="-1"` passé en attribut ne convient pas : l'élément resterait focalisable à la souris et aux clics, et le défaut `aria-hidden-focus` de `PlayerJourney` subsisterait.

## Proposition

- `tabIndex` : `-1` (ou absent) quand la liste n'est pas sélectionnable (`listRole === 'list'`), `0` seulement quand elle est un `listbox` pilotable au clavier.
- Ne poser les gestionnaires focus/clavier que dans le cas sélectionnable.
- Option retenue la moins intrusive : conserver le comportement actuel pour les listes qui passent `selected` / `selectStrategy`, et retirer le `tabindex` pour les autres.

## Critère d'acceptation

1. `<origam-list>` sans `selected` ni `selectStrategy` ne rend pas de `tabindex` (ou `tabindex="-1"`) et n'est pas atteinte par Tab.
2. Une `<origam-list>` rendue dans une zone `aria-hidden="true"` ne contient aucun élément focalisable (règle axe `aria-hidden-focus`).
3. Une liste sélectionnable garde `role="listbox"`, `tabindex="0"` et la navigation au clavier actuels.

## Version

2.37.4
