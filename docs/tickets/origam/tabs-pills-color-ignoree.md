# ds(tabs) : en variante `pills`, la prop `color` n'agit pas sur l'onglet actif, figé sur `action.primary`

## Constat

`origam-tabs variant="pills" color="secondary"` (posé en prop, ou dans le bloc `components` du thème) n'affecte pas l'onglet actif : son fond et son texte restent ceux d'`action.primary`. Pour obtenir `secondary`, il faut poser à la main les deux tokens de composant `--origam-tabs__item--pills--active---background-color` et `---color`. La prop `color`, pourtant exposée, est alors contournée.

Constaté dans CCC (F-00l, onglets de /regles, /palmares et /editions) en 2.37.3.

## Reproduction minimale

```vue
<origam-tabs v-model="tab" variant="pills" color="secondary" :items="['A', 'B']" />
```

Le fond calculé de l'onglet actif vaut celui d'`action.primary.bg`, et non celui de `secondary`.

## Cause

`packages/ds/src/components/Tabs/OrigamTab.vue:383-388` (release 2.37.3, commit 8fc9fc929) :

```scss
.origam-tabs--pills .origam-tab {
    &--active {
        background-color: var(--origam-tabs__item--pills--active---background-color, var(--origam-color__action--primary---bg, currentColor));
        color: var(--origam-tabs__item--pills--active---color, var(--origam-color__action--primary---fg, white));
    }
}
```

Le repli est codé en dur sur `action--primary` : la couleur passée en prop n'entre pas dans la cascade.

## Impact

Le principe PROPS-FIRST est contourné : un thème doit recourir à des `cssVars` de composant pour une simple couleur d'accent, que la prop prétend régler.

## Critère d'acceptation

1. Avec `color="secondary"` (prop ou thème), l'onglet actif en pilule a le fond `action.secondary.bg` et le texte `action.secondary.fg`, calculés.
2. Sans `color`, le rendu reste inchangé (`action.primary`).
3. Les tokens `--origam-tabs__item--pills--active---*` gardent la priorité s'ils sont posés.

## Version

2.37.3
