# ds(list) : un `origam-list-item` lien (`to` / `href`) reçoit `role="listitem"` sur l'`<a>`, qui perd son rôle de lien

## Constat

Dans une `origam-list` (avec ou sans `nav`) en mode liste, un item rendu comme lien (`to` ou `href`, donc un `<a>`) porte `role="listitem"` directement sur l'`<a>`. Le rôle ARIA explicite remplace le rôle implicite `link`. Les technologies d'assistance annoncent un « élément de liste » et non un lien, et la navigation par liens (rotor, liste des liens) ne le trouve plus.

Constaté dans CCC, page `/admin/plus` (F-12), en 2.37.3.

## Reproduction minimale

```vue
<origam-list nav :items="[{ title: 'Participants', to: '/admin/participants' }]" :item-props="true" />
```

DOM : `<div role="list"><a href="/admin/participants" role="listitem" …>`. Dans l'arbre d'accessibilité de Chromium, l'élément apparaît comme `listitem`, pas comme `link`.

## Cause

- `packages/ds/src/components/List/OrigamListItem.vue:10` : `:role="itemRole"` sur la racine de l'item, quelle que soit la balise rendue.
- `OrigamListItem.vue:305-307` : `itemRole` = le rôle publié par la liste (`listitem` en mode liste), sans tenir compte de `isLink` (`OrigamListItem.vue:326-328`).
- `packages/ds/src/components/List/OrigamList.vue:226-228` : `itemRole` vaut `LISTITEM` hors mode sélection.

## Impact

Toute navigation construite avec `origam-list nav` (tiroirs, menus « Plus ») perd la sémantique de lien : c'est une régression d'accessibilité (WCAG 4.1.2, nom, rôle et valeur).

## Critère d'acceptation

1. Un item lien en mode liste rend la structure `role="listitem"` sur un conteneur, et un `<a>` sans `role` à l'intérieur. À défaut, aucun `role` n'est posé sur un `<a>` (le conteneur de la liste devient alors une liste de liens valide).
2. Dans l'arbre d'accessibilité, l'item est annoncé comme `link`, et la liste comme `list` avec le bon nombre d'éléments.
3. Le mode sélection (`option` dans `listbox`) reste inchangé.
4. Un test axe sur une `origam-list nav` de liens ne remonte aucune violation.

## Version

2.37.3
