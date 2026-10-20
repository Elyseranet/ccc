# ds(text-field, select) : l'id de l'`<input>` (et les props relayées) diffère entre le rendu serveur et le client, sans avertissement d'hydratation

## Constat

Un `origam-select` rendu en SSR sert un `<input id="input-v-4" aria-describedby="input-v-4-messages">`. Après
chargement, le même `<input>` passe à `id="origam-select-v-2"` (et `aria-describedby="origam-select-v-2-messages"`).
Vue n'émet **aucun** avertissement d'hydratation.

L'id n'est pas seul en cause : la racine change aussi de classes entre le HTML serveur et le DOM final
(`origam-input--density-default` → `origam-input--density-compact`, ajout de `origam--rounded-full`), alors que la
page passe `variant="solo" rounded="full"`.

## Reproduction minimale

Nuxt 4.6.1 + `origam/nuxt`, `origam@2.37.3`, `nuxi dev`, Chromium (Playwright) :

```vue
<origam-select v-model="v" :items="['a','b']" label="Edition" variant="solo" rounded="full" />
```

Mesures :
- HTML serveur : `<input … id="input-v-4" aria-describedby="input-v-4-messages" …>` ; racine
  `class="origam-input … origam-input--density-default … origam-text-field origam-select origam-select--single"`.
- `MutationObserver` posé avant le chargement (`page.addInitScript`) : une seule mutation sur l'`<input>`,
  `id: input-v-4 -> origam-select-v-2`.
- DOM final : racine `class="… origam-input--density-compact origam-input--dirty … origam--rounded-full …"`.
- Console : aucun message `Hydration … mismatch`. La même configuration émet pourtant des
  `Hydration class/style mismatch` sur d'autres pages : la vérification d'attributs est active.

## Cause

Les props sont relayées aux enfants **par l'intermédiaire d'une ref de template**, qui vaut `undefined` sur le
serveur et pendant le premier rendu client (hydratation) :

- `packages/ds/src/components/TextField/OrigamTextField.vue:348` : `const origamInputRef = ref<TOrigamInput>()`.
- `packages/ds/src/components/TextField/OrigamTextField.vue:598-613` : `inputProps` vaut
  `origamInputRef.value?.filterProps(props, [...])`, donc `undefined` tant que la ref n'est pas posée.
  `inputProps` est la seule voie par laquelle la prop `id` (déclarée dans `ICommonsComponentProps`,
  `interfaces/Commons/commons.interface.ts:97`) atteint `origam-input` (`OrigamTextField.vue:8`).
- `packages/ds/src/components/Input/OrigamInput.vue:153-155` : sans `props.id`, `origam-input` retombe sur
  `` `input-${uid}` `` → `input-v-4`.
- `packages/ds/src/components/Select/OrigamSelect.vue:3` passe `:id="id"`, issu de `useStyle(...)` à
  `OrigamSelect.vue:1324` : repli `` `${name}-${getUid()}` `` (`composables/Commons/style.composable.ts:113`),
  soit `origam-select-v-2`. Il n'arrive à l'`<input>` qu'une fois `origamInputRef` posé, c'est-à-dire après le
  montage.
- Même mécanisme un niveau plus haut : `packages/ds/src/components/Select/OrigamSelect.vue:390` et `:1228-1229`
  (`textFieldProps` = `origamTextFieldRef.value?.filterProps(...)`). Toutes les props du select relayées au
  text-field (`variant`, `rounded`, `density`…) manquent donc au rendu serveur.

Pourquoi Vue ne dit rien : pendant l'hydratation, la ref est aussi `undefined` côté client. Le premier rendu client
produit donc le même `input-v-4` que le serveur, et la comparaison d'hydratation ne voit aucun écart. Le
changement d'id arrive **après**, comme une mise à jour ordinaire déclenchée par la pose de la ref ; Vue ne le
contrôle pas. (Déduit du code ci-dessus et de l'observation : une seule mutation `input-v-4 -> origam-select-v-2`,
aucun avertissement.)

## Impact

- Le HTML servi n'est pas celui que l'utilisateur obtient : id, `aria-describedby` et classes de style changent
  après chargement. Un lien `<label for>` ou un `aria-describedby` résolu sur le HTML serveur pointe vers un id
  qui disparaît.
- Les props de style du select (`variant`, `rounded`, `density`) sont absentes du rendu serveur : saut visuel au
  chargement.
- Le même relais par ref existe dans `OrigamTextareaField.vue`, `OrigamPasswordField.vue` et
  `OrigamFileField.vue` (lu dans le code, non mesuré au navigateur).

## Critère d'acceptation

1. Pour la page ci-dessus, l'`id` de l'`<input>` du HTML serveur est identique à celui du DOM après hydratation
   et montage (aucune mutation de `id` observée).
2. Les classes de la racine `.origam-select` sont identiques entre le HTML serveur et le DOM final
   (`origam--rounded-full` présent en SSR).
3. Un test SSR (rendu serveur puis hydratation) le vérifie pour `origam-text-field` et `origam-select` avec un
   `id` explicite et sans `id`.

## Version

2.37.3
