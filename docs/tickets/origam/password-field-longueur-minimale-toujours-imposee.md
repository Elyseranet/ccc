# ds(password-field) : la longueur minimale est toujours imposée, même à vide, et `min-length="0"` retombe à 8 — demande d'évolution

> Numéro de ticket Origam à attribuer à l'ouverture.

## Constat

`OrigamPasswordField` construit une règle de validation à partir de `min-length` (défaut 8) et l'ajoute en permanence aux `rules` du champ (`enrichedRules`). Conséquences mesurées dans CCC (F-10, 2.37.4) :

1. Un champ **facultatif** (« nouveau mot de passe » du profil, laissé vide pour ne pas en changer) est invalide à vide : le formulaire affiche « Ce champ doit contenir : 8 characters » et ne part pas.
2. `:min-length="0"` ne désactive pas la règle : la valeur 0 est traitée comme absente et la règle retombe sur 8.
3. Un champ de **connexion** impose 8 caractères au saisi : un ancien mot de passe plus court ne peut pas être soumis côté navigateur.
4. Le message est celui d'Origam (« characters » en anglais dans un texte français), indépendant des `rules` de l'application.

## Cause

`OrigamPasswordField.vue` : `infos` contient toujours `minLength: REQUIREMENT_MIN_LENGTH(props.minLength)` ; `enrichedRules` ajoute une règle `info.reg.test(value || "")` pour chaque entrée de `infos`, qu'`requirements` soit actif ou non.

## Contournement côté CCC

Connexion et profil utilisent `origam-text-field type="password"` (`LoginForm.vue`, `ProfileForm.vue`) : on perd le bouton afficher/masquer. La première connexion garde `origam-password-field` (mot de passe obligatoire, `min-length` = 15 comme le serveur).

## Proposition

Ne construire la règle de longueur que si `requirements` ou `strengthBar` est actif, ou si `min-length` est explicitement fourni ; accepter `min-length="0"` comme « aucune règle » ; laisser la valeur vide valide quand le champ n'est pas `required`, comme le font les autres champs.

## Critère d'acceptation

1. Un `origam-password-field` sans `required` ni `min-length` reste valide à vide et à 3 caractères.
2. Avec `min-length="15"`, une saisie de 14 caractères est refusée, avec un message surchargeable.
3. Le rendu par défaut (sans `rules`) reste inchangé.

## Version

2.37.4 installée (déclarée `^2.37.3`)
