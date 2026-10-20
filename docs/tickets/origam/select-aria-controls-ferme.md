# ds(select) : `aria-controls` absent du combobox tant que le menu est fermé (donc en SSR)

## Constat

L'`<input role="combobox">` d'`origam-select` porte `aria-haspopup="listbox"` et `aria-expanded="false"`, mais
**pas** `aria-controls` tant que le menu est fermé, donc dans tout le HTML serveur. WAI-ARIA 1.2 classe
`aria-controls` parmi les propriétés **requises** du rôle `combobox` (« Required States and Properties:
aria-controls aria-expanded ») et précise : « Authors MUST set aria-controls on a combobox element to a value that
refers to the combobox popup element. » (https://www.w3.org/TR/wai-aria-1.2/#combobox).

`aria-expanded` est bien présent, en SSR comme côté client.

## Reproduction minimale

Nuxt 4.6.1 + `origam/nuxt`, `origam@2.37.3` :

```vue
<origam-select v-model="v" :items="['a','b']" label="Edition" />
```

HTML serveur (extrait de l'`<input>`) :

```html
<input role="combobox" size="1" type="text" value id="input-v-4" aria-describedby="input-v-4-messages"
  isactive="true" isfocused="false" aria-label="Edition" title="Edition" aria-haspopup="listbox"
  aria-expanded="false" data-v-d6fafe2f>
```

Après hydratation (menu fermé) : mêmes attributs, sans `aria-controls`.

## Cause

`packages/ds/src/components/Select/OrigamSelect.vue:603` :
`'aria-controls': menu.value ? listboxId : undefined,` — l'attribut n'est émis que menu ouvert. `listboxId` est
défini à `OrigamSelect.vue:414` et posé sur la liste à `OrigamSelect.vue:92`.

## Impact

Le combobox fermé ne satisfait pas une propriété requise par ARIA 1.2 ; un audit axe/Lighthouse sur le HTML SSR
peut le signaler, et les technologies d'assistance n'ont pas de lien vers le popup avant ouverture.

## Critère d'acceptation

1. Menu fermé, en SSR et côté client, l'`<input role="combobox">` porte `aria-controls` égal à l'id de la listbox.
2. Menu ouvert, cet id est celui de l'élément `role="listbox"` présent dans le DOM.
3. Test (unitaire ou e2e) qui vérifie la présence de `aria-controls` et `aria-expanded` sur le rendu serveur.

## Version

2.37.3
