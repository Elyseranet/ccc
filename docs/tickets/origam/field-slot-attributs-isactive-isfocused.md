# ds(field) : `isActive` et `isFocused` fuient comme attributs HTML non standard (`isactive`, `isfocused`) sur l'`<input>`

## Constat

L'`<input>` rendu par `origam-text-field` (et donc par `origam-select`) porte `isactive="true"` et
`isfocused="false"`. Ces attributs n'existent pas en HTML. Ils sont présents dans le HTML serveur comme dans le
DOM client.

## Reproduction minimale

Nuxt 4.6.1 + `origam/nuxt`, `origam@2.37.3` :

```vue
<origam-select v-model="v" :items="['a','b']" label="Edition" />
```

HTML serveur : `<input role="combobox" size="1" type="text" value id="input-v-4" aria-describedby="input-v-4-messages"
isactive="true" isfocused="false" aria-label="Edition" …>`. Après hydratation : mêmes attributs `isactive="true"`
et `isfocused="false"`.

## Cause

- `packages/ds/src/components/Field/OrigamField.vue:347-359` : les props du slot `default` (`slotProps`) incluent
  `isActive: isActive.value` (`:353`) et `isFocused: isFocused.value` (`:354`), à côté des vrais attributs
  (`id`, `aria-describedby`, `onBlur`, `onFocus`).
- `packages/ds/src/components/TextField/OrigamTextField.vue:75` : le slot est déstructuré en
  `{class: fieldSlotClass, ref, ...fieldSlotProps}` : seuls `class` et `ref` sont retirés.
- `packages/ds/src/components/TextField/OrigamTextField.vue:99` : `v-bind="{ ...fieldSlotProps, ...inputAttrs }"`
  sur l'`<input>` natif. Vue rend les clés inconnues comme attributs, et le parseur HTML les met en minuscules.
  La fuite vient donc d'un `v-bind` de props de slot, pas de `$attrs`.
- Même déstructuration et même `v-bind` dans `OrigamTextareaField.vue:73,144`,
  `OrigamPasswordField.vue:75,136` et `OrigamFileField.vue:194,212` (lu dans le code, non mesuré).

## Impact

Attributs invalides dans le markup de tous les champs texte : bruit dans les validateurs HTML et les audits, et
fuite d'état interne dans le DOM.

## Critère d'acceptation

1. L'`<input>` d'`origam-text-field`, `origam-select`, `origam-textarea-field`, `origam-password-field` et
   `origam-file-field` ne porte ni `isactive` ni `isfocused`, en SSR comme côté client.
2. `isActive` et `isFocused` restent disponibles pour un consommateur du slot `default` d'`origam-field`.
3. Test unitaire : `wrapper.find('input').attributes()` ne contient pas ces clés.

## Version

2.37.3
