# ds(select) : sans prop `label`, l'input porte `aria-label="Ouvrir"` et `title="Ouvrir"`, qui écrasent un `<label for>` externe

## Constat

Un `origam-select` sans prop `label`, nommé par un libellé externe (`<label for="…">`, ou `aria-labelledby`), rend un `<input role="combobox">` avec `aria-label` et `title` égaux au libellé du bouton d'ouverture (« Ouvrir » / `origam.open`). Un `aria-label` passe avant un `<label for>` dans le calcul du nom accessible. Le champ est donc annoncé « Ouvrir » et non par son vrai libellé. Axe ne le signale pas, puisqu'un nom existe.

Constaté dans CCC (F-12, sélecteur « Édition active », relié par `<origam-label :for>`) en 2.37.3. `getByLabel('Toutes les pages…')` ne trouve pas le champ.

## Reproduction minimale

```vue
<origam-label :for="id">Édition active</origam-label>
<origam-select :id="id" :items="['2026', '2025']" single-line />
```

L'input porte `aria-label="Ouvrir" title="Ouvrir"`, et son nom accessible calculé vaut « Ouvrir ».

## Cause

- `packages/ds/src/components/Select/OrigamSelect.vue:7` et `:13` : `:aria-label="t(accessibleLabel)"` et `:title="t(accessibleLabel)"`.
- `OrigamSelect.vue:1275-1277` : `accessibleLabel = props.label || toggleLabel.value`. Sans `label`, on retombe sur le libellé du bouton d'ouverture.

## Impact

WCAG 4.1.2 (nom, rôle, valeur) et 2.5.3 (étiquette dans le nom) : un champ correctement étiqueté par un `<label>` externe devient « Ouvrir » pour les technologies d'assistance.

## Critère d'acceptation

1. Sans prop `label`, l'input ne porte ni `aria-label` ni `title` de repli. Le nom vient alors du `<label for>`, ou de l'`aria-labelledby` passé par le consommateur.
2. Le libellé « Ouvrir » reste sur le BOUTON d'ouverture (chevron), et non sur l'input.
3. Avec `label`, le comportement reste inchangé.
4. Test : nom accessible calculé égal au libellé externe.

## Version

2.37.3
