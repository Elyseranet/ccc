# ds(field) : `--origam-field---corner-clearance` est calculé sur l'élément et n'est pas thémable ; un champ pilule a un retrait de texte égal à sa hauteur

## Constat

Sur un champ `rounded="full"` (pilule) de 48 px de haut, le texte est en retrait de 48 px, et non du `padding-start` voulu (20 px par exemple). Le token `--origam-field---corner-clearance` est **déclaré sur `.origam-field` lui-même**, à partir du rayon et de la hauteur. Un thème qui le pose (sur `:root` ou sur le sélecteur de thème) ne peut donc pas le surcharger, puisque la déclaration de l'élément l'emporte.

Constaté dans CCC (F-00m, champs de recherche en pilule) en 2.37.3. Le contournement CCC est une règle globale de forte spécificité, `.origam-field.origam-field.origam-field { --origam-field---corner-clearance: var(--origam-space---5) }`, qui dépend du DOM interne.

## Cause

`packages/ds/src/components/Field/OrigamField.vue:920-924` :

```scss
--origam-field---corner-clearance: min(var(--origam-field---border-radius, 8px), var(--origam-input__control---height, 36px));
padding-inline: max(var(--origam-field---padding-start), var(--origam-field---corner-clearance)) var(--origam-field---padding-end);
```

Le commentaire de la source (`#800`) prévoit qu'un consommateur pose `--origam-field---corner-clearance: 0px`. Mais posé ailleurs que sur l'élément, il est écrasé par cette déclaration locale.

## Impact

Le PROPS-FIRST ne suffit pas, et le thème non plus. Un champ pilule ne peut pas avoir un retrait de texte plus petit que sa hauteur sans une surcharge CSS spécifique.

## Proposition

Lire le token avec un repli plutôt que le déclarer : `var(--origam-field---corner-clearance, min(<rayon>, <hauteur>))` dans le `max()`, sans déclaration sur l'élément. On peut aussi exposer une prop. Le calcul par défaut reste inchangé.

## Critère d'acceptation

1. Avec `--origam-field---corner-clearance: 20px` posé par un thème (`cssVars`), un champ pilule de 48 px a un `padding-inline-start` calculé de 20 px.
2. Sans token, le rendu reste inchangé.
3. Le cas `OtpInputField` (#800) reste correct.

## Version

2.37.3
