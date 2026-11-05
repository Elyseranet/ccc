# ds(password-field) : une règle de longueur s'ajoute toujours à la validation, même champ vide et sans `requirements`

> Ticket Origam **#1334**. Fiche unique : elle fusionne `password-field-longueur-minimale-toujours-imposee.md` (dev-f05, F-10), qui est retirée.

## Constat

`OrigamPasswordField.vue` (installé, 2.37.4) construit `infos` sans condition, en partant de la longueur minimale (lignes 567-569) :

```js
const infos = computed(() => {
  const localeInfos = { minLength: REQUIREMENT_MIN_LENGTH(props.minLength) } // défaut 8
```

`enrichedRules` (lignes 631-640) ajoute alors une règle de validation pour chaque entrée de `infos`, avec `info.reg.test(value || "")`. Ces règles sont passées à l'input (ligne 8, `rules: enrichedRules`). Conséquences :

- La règle s'applique même avec `requirements: false` (valeur par défaut), et même quand `requirementRules` remplace la liste affichée.
- Un champ vide échoue. Un champ de mot de passe **facultatif** (changement de mot de passe optionnel sur un profil) bloque donc l'envoi du formulaire.
- Le message passe par la locale d’Origam (`t("origam.validation.must_contains", { value: info.message })`, ligne 636), mais il n’est pas surchargeable par champ. Il s’affiche en anglais dans CCC, qui ne traduit pas cette clé : « This field must contain: 8 characters ». De plus, la partie « 8 characters » vient de `REQUIREMENT_MIN_LENGTH` (`message: `${length} characters``, `consts/PasswordField/password-field.const.js`), une chaîne anglaise en dur, hors locale.
- La longueur minimale sert à la fois d'exigence **affichée** et de règle de **validation**, sans moyen de séparer les deux.
- Sur un champ de **connexion**, un ancien mot de passe de moins de 8 caractères ne peut pas être envoyé : le navigateur le refuse avant tout appel au serveur.

## Mesure (CCC, F-10, `origam-form` + `validate()`)

| configuration | "" | "abc" | 16 caractères |
|---|---|---|---|
| défaut | invalide (« This field must contain: 8 characters ») | invalide | valide |
| `requirements: false`, `rules` qui acceptent le vide | **invalide** (même message) | invalide (message de `rules`) | valide |
| `minLength: 0`, `requirementRules` (≥ 15), `rules` qui acceptent le vide | valide | invalide | valide |

Seconde mesure, en gabarit Vue (`origam-form` + `validate()`, mêmes conditions, sans `rules`), pour vérifier une observation faite dans F-10 selon laquelle `min-length="0"` retomberait à 8 :

| gabarit | "" | "abc" | 10 caractères |
|---|---|---|---|
| `:min-length="0"` | valide | valide | valide |
| `min-length="0"` (chaîne) | valide | valide | valide |
| sans `min-length` | invalide (« This field must contain: 8 characters ») | invalide | valide |

La valeur 0 n'est donc pas traitée comme absente : la règle construite (`(.{0,})`) accepte toute valeur. Le défaut est la règle **imposée**, pas le traitement de 0.

## Proposition

Ne construire la règle de longueur que si `requirements` ou `strengthBar` est actif, ou si `min-length` est explicitement fourni. Laisser la valeur vide valide quand le champ n'est pas `required`, comme le font les autres champs. Rendre le message surchargeable par champ, et faire passer sa partie variable (« N characters ») par la locale.

## Attendu

- Les exigences n'entrent dans la validation que si `requirements` (ou `requirementRules`) est actif.
- Un champ vide est laissé aux règles de l'appelant (`rules`, `required`).
- Le message est surchargeable par champ, et sa partie variable (« 8 characters ») passe aussi par la locale.

## Critères d'acceptation

1. Un `origam-password-field` sans `required` ni `min-length` reste valide à vide et à 3 caractères.
2. Avec `min-length="15"`, une saisie de 14 caractères est refusée, avec un message surchargeable et traduit.
3. Le rendu par défaut (sans `rules`) reste inchangé.

## Contournement CCC

`minLength: 0` sur chaque `origam-password-field`. La règle forcée accepte alors toute valeur, et la validation passe uniquement par `rules`. L'exigence affichée est fournie par `requirementRules` (`docs/design/ui/happy-hour/mapping.md`, lignes Compte). À retirer quand Origam est corrigé.

## Version

2.37.4 (installée ; ^2.37.3 déclarée)
