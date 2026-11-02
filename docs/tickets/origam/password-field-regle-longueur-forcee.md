# ds(password-field) : une règle de longueur s'ajoute toujours à la validation, même champ vide et sans `requirements`

## Constat

`OrigamPasswordField.vue` (installé, 2.37.4) construit `infos` sans condition, en partant de la longueur minimale (lignes 567-569) :

```js
const infos = computed(() => {
  const localeInfos = { minLength: REQUIREMENT_MIN_LENGTH(props.minLength) } // défaut 8
```

`enrichedRules` (lignes 631-640) ajoute alors une règle de validation pour chaque entrée de `infos`, avec `info.reg.test(value || "")`. Ces règles sont passées à l'input (ligne 8, `rules: enrichedRules`). Conséquences :

- La règle s'applique même avec `requirements: false` (valeur par défaut), et même quand `requirementRules` remplace la liste affichée.
- Un champ vide échoue. Un champ de mot de passe **facultatif** (changement de mot de passe optionnel sur un profil) bloque donc l'envoi du formulaire.
- Le message est en anglais et ne passe pas par la locale : « This field must contain: 8 characters ».
- La longueur minimale sert à la fois d'exigence **affichée** et de règle de **validation**, sans moyen de séparer les deux.

## Mesure (CCC, F-10, `origam-form` + `validate()`)

| configuration | "" | "abc" | 16 caractères |
|---|---|---|---|
| défaut | invalide (« This field must contain: 8 characters ») | invalide | valide |
| `requirements: false`, `rules` qui acceptent le vide | **invalide** (même message) | invalide (message de `rules`) | valide |
| `minLength: 0`, `requirementRules` (≥ 15), `rules` qui acceptent le vide | valide | invalide | valide |

## Attendu

- Les exigences n'entrent dans la validation que si `requirements` (ou `requirementRules`) est actif.
- Un champ vide est laissé aux règles de l'appelant (`rules`, `required`).
- Le message passe par la locale.

## Contournement CCC

`minLength: 0` sur chaque `origam-password-field`. La règle forcée accepte alors toute valeur, et la validation passe uniquement par `rules`. L'exigence affichée est fournie par `requirementRules` (`docs/design/ui/happy-hour/mapping.md`, lignes Compte). À retirer quand Origam est corrigé.

## Version

2.37.4 (installée ; ^2.37.3 déclarée)
