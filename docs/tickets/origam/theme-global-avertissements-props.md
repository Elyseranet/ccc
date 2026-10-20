# ds(theme) : une clé du bloc `components.global` déclenche un avertissement sur chaque composant qui ne la déclare pas, y compris les composants Nuxt, Vue Router et ceux de l'application

## Constat

Un thème qui pose `components: { global: { density: 'default' } }` produit en dev un
`[origam] <X> prop "density" has no effect on this component: theme names this prop but <X> does not declare it`
pour **chaque** composant monté qui ne déclare pas `density`, y compris des composants hors Origam. Le message
dit « theme names this prop » alors que le thème ne nomme pas ce composant : il pose une valeur globale.

Les clés `density` posées **par composant** (`origam-card`, `origam-toolbar`, `origam-pagination`,
`origam-breadcrumb`, `origam-list`…) n'ont produit aucun avertissement dans la même mesure.

## Reproduction minimale

Nuxt 4.6.1 + `origam/nuxt`, `origam@2.37.3`, `nuxi dev`. Mesure faite avec le thème du projet consommateur,
dont le bloc `components` contient :

```ts
components: {
  global: { density: 'default' },
  'origam-card': { density: 'comfortable' /* … */ },
  'origam-toolbar': { density: 'default' /* … */ },
  'origam-pagination': { density: 'compact' /* … */ },
  // … d'autres clés par composant
}
```

Thème réduit à la seule ligne `global` : non mesuré séparément.

Page montant `origam-card`, `origam-toolbar`, `origam-pagination`, `origam-breadcrumb`, `origam-list`,
`origam-chip`, `origam-btn`, `origam-icon` et un composant local `MyLocal`. Console navigateur : 13
avertissements `prop "density"`, sur `<nuxt-root>`, `<app>`, `<origam-app>`, `<origam-layout>`, `<nuxt-page>`,
`<router-view>`, `<route-provider>`, `<themed>` (la page), `<origam-icon>`, `<origam-class-icon>`,
`<origam-defaults-provider>`, `<origam-list-children>`, `<my-local>`. Les mêmes sortent aussi dans la console du
serveur (SSR).

## Cause

- `packages/ds/src/composables/Commons/theme-props-resolver.composable.ts:638-647` (`collectTargetKeys`) : les
  clés `global` sont ajoutées aux clés cibles de **toute** instance, quel que soit son nom.
- `packages/ds/src/composables/Commons/theme-props-resolver.composable.ts:962-965` : toute clé cible absente des
  props de l'instance appelle `warnUnsupportedProp(...)`, sans distinguer une clé nommée pour ce composant d'une
  clé venue de `global`.
- `packages/ds/src/utils/Commons/color.util.ts:990-1003` : `warnUnsupportedProp` (dev uniquement, dédupliqué par
  couple composant/prop).

## Impact

Bruit en console proportionnel au nombre de types de composants montés, y compris ceux du framework et de
l'application, qui masque les vrais avertissements d'un thème (une prop mal nommée sur un composant précis).

## Critère d'acceptation

1. Avec `components: { global: { density: 'default' } }`, monter `<router-view>`, un composant local sans prop
   `density` et `origam-icon` ne produit **aucun** avertissement `prop "density"`.
2. Avec `components: { 'origam-icon': { density: 'compact' } }`, l'avertissement reste émis pour `origam-icon`
   (le cas #496 garde sa protection).
3. Les composants qui déclarent `density` reçoivent toujours la valeur globale (non-régression du résolveur).

## Version

2.37.3
