# ds(list-item) : l'opacité de l'overlay actif est codée en dur (0,12), sans token, contrairement à `OrigamBtn`

## Constat

Un `origam-list-item` actif (`origam-list-item--active`, par exemple une entrée de navigation `nav` sur la route courante) reçoit un overlay d'opacité **0,12**, et **0,16** au survol. Ces valeurs sont écrites en dur. Aucun token ne permet de les régler, et le fond actif du thème est donc toujours voilé.

`OrigamBtn` expose, lui, ces réglages par des tokens : `--origam-btn---overlay-opacity-active` (repli 0,2) et `--origam-btn---overlay-opacity-active-hover` (repli 0,28).

## Reproduction minimale

```vue
<origam-list nav>
  <origam-list-item to="/" title="Accueil" bg-color="secondary" active />
</origam-list>
```

Le fond calculé de l'item est voilé par `.origam-list-item__overlay`, avec `opacity: 0.12`. Avec un thème où `action.secondary.bg` vaut `#ff3d9a`, le rendu mesuré dans CCC est `#e3368d` : capture `tiroir-admin-1440-app.png` de la revue F-00, pixel (240, 160), comparé à la maquette.

## Cause

- `packages/ds/src/components/List/OrigamListItem.vue:788-792` : `&--active > __overlay { --origam-list-item__overlay---opacity: calc(0.12 * 1); }`.
- `OrigamListItem.vue:794-799` : au survol de l'état actif, `calc(0.16 * 1)`.
- Ces deux valeurs ne passent par aucun token (`var(--…, repli)`). On peut comparer à `packages/ds/src/components/Btn/OrigamBtn.vue:838-842`.
- Le seul crochet public est la couleur de l'overlay (`--origam-list__item---overlay-background-color`, `OrigamListItem.vue:810`). Le neutraliser supprime aussi le retour visuel au survol et au focus.

## Impact

Une navigation `origam-list nav` ne peut pas afficher la couleur active exacte du thème. CCC a dû construire son tiroir admin avec des `origam-btn` dans une liste (`app/layouts/admin.vue`), au lieu de `origam-list nav`.

## Critère d'acceptation

1. Des tokens dédiés, sur le modèle de `OrigamBtn` (par exemple `--origam-list-item---overlay-opacity-active` et `--origam-list-item---overlay-opacity-active-hover`), sont lus avec pour repli les valeurs actuelles (0,12 et 0,16).
2. Avec le token posé à `0`, un item actif a un fond calculé égal à son `bg-color`.
3. Sans token, le rendu reste inchangé (pas de régression VRT).

## Version

2.37.3
