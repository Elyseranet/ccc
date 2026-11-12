# ds : aucune prop ni token ne règle le filet d'un champ selon son conteneur (`origam-field` sur `origam-card` / `origam-dialog`)

> **À déposer** (aucun numéro Origam à ce jour).

## Mesure (Origam 2.37.4, CCC T-A11Y-01 M1)

- Le filet d'un champ outlined vient d'une seule variable, `--origam-field---border-color`, posée globalement par le thème (`border.default`). Posé sur une carte ou un dialogue (surface surélevée), ce filet aplati tombe à 2,83:1 contre la surface, sous les 3:1 de WCAG 1.4.11.
- `origam-field` n'a pas de variable par contexte (carte, dialogue) et le thème (`components`) ne peut pas exprimer « dans une carte ». La variable est en revanche héritée : la redéclarer sur le conteneur suffit. Un champ en erreur la pose lui-même (`OrigamField.vue`, `--origam-field---border-color: var(--origam-field--error---border-color, …danger)`), donc la bordure d'erreur l'emporte.

## Limites

Mécanisme lu dans le code et mesuré dans l'application ; aucun correctif Origam essayé.

## Contournement côté CCC

Une règle centrale dans `src/assets/css/main.css` : `.origam-card, .origam-dialog { --origam-field---border-color: var(--origam-color__border---strong); }`, listée dans l'en-tête de `src/themes/ccc.theme.ts`. Aucune surcharge locale.
