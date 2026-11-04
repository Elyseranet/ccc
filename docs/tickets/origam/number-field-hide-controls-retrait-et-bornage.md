# ds(number-field) : avec `hideControls`, un retrait vide de 27 px reste à gauche du texte ; au montage, la valeur est bornée sans interaction

> Numéro de ticket Origam à attribuer à l'ouverture. Deux constats sur le même composant : le premier est un défaut de rendu, le second un défaut de comportement (bornage au montage) doublé d'une demande d'évolution (bornage à la sortie du champ non désactivable).

## Constat 1 : retrait vide avec `hideControls`

`OrigamNumberField.vue` (installé, 2.37.4) passe **toujours** un gabarit `#prependInner` à `OrigamField` (lignes 115-144) :

```vue
<template #prependInner>
  <div v-if="!hideControls" class="origam-number-field__control"> … </div>
  <slot name="prependInner"/>
</template>
```

Avec `hideControls`, le contenu est vide, mais le slot existe. `useAdjacentInner` (`adjacentInner.composable.js`, lignes 12-13 : `return slots.prependInner || hasPrependInnerMedia.value`) le considère donc comme présent. `OrigamField.vue` (ligne 30, `v-if="hasPrependInner"`) rend alors une zone `.origam-field__prepend-inner` vide, avec ses marges intérieures.

Mesure (CCC, thème Happy Hour, `single-line`, `rounded="full"`, `hideControls`) :

| | début du texte | colonne de la zone vide |
|---|---|---|
| `origam-number-field` + `hideControls` | 33 px du bord | 27 px (6 + 21 de marge) |
| `origam-text-field` (référence) | 21 px du bord | aucune |

Le champ numérique sans contrôles n'est donc pas aligné sur les autres champs du formulaire.

**Attendu** : sans contrôles et sans contenu de slot `prependInner` venu de l'appelant, aucune zone `prepend-inner` n'est rendue. Le texte commence comme dans `origam-text-field`.

## Constat 2 : bornage au montage, et bornage à la sortie non désactivable

- `onMounted(() => { clampModel() })` (lignes 520-522) borne la valeur reçue **sans aucune interaction**. `clampModel` (lignes 622-632) écrit `model.value = clamp(...)`, ce qui émet `update:modelValue`. Le composant modifie donc la donnée du parent au montage.
  - Mesure : `:min="2000" :max="2100"` et `v-model` à `27`. Le champ affiche **2000**, et le parent reçoit 2000.
- `handleBlur` (lignes 660-663) borne aussi à chaque sortie du champ. Une saisie hors bornes (« 27 » pour une année) devient silencieusement une valeur **valide** (2000).
  - Conséquences : le message d'erreur de l'appelant (« Indiquez une année sur 4 chiffres ») ne peut jamais s'afficher, et une donnée fausse mais valide part au serveur.

**Attendu** :

1. Au montage, aucune écriture du modèle. On affiche la valeur reçue, et on laisse la validation la signaler.
2. Une option pour désactiver le bornage à la sortie du champ (par exemple `clamp: false`), pour les formulaires où une valeur hors bornes doit être **refusée avec un message**, pas corrigée.

## Contournement CCC

Pas encore décidé (F-13, champ « Année »). Les pistes sont transmises au chef de projet :

- `hideControls` en acceptant le retrait de 33 px ;
- ou `origam-text-field` avec `inputmode="numeric"` et les règles de longueur et de bornes de l'application, rendu identique aux autres champs et sans bornage.

## Version

2.37.4 (installée ; ^2.37.3 déclarée)
