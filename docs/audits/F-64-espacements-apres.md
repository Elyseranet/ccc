# Audit des espacements (F-63)

Généré par `npm run audit:spacing` (`packages/web/tests/e2e/audit/spacing.audit.ts`) le 2026-11-18.
Seuil : écart vertical < 4 px entre deux blocs frères empilés, ou chevauchement (écart négatif). Largeurs : 1440, 390.

Pages et états visités : 106. Cas retenus : **0** ; exclus par règle : 422.

## Par cause

| cause | cas |
|---|---|

## Par composant Origam enveloppant

| composant | cas |
|---|---|

## Par page

| page | 1440 | 390 |
|---|---|---|

## Règles d'exclusion

- `maquette` : paire listée dans `SPACING_AUDIT_MOCKUP_ZERO` : blocs accolés à l'identique de la maquette (écart mesuré 0 px dans la maquette, source citée par paire).
- `tableau` : parent ou enfant de table (`table`, `tr`, `td`…, rôles row / cell / rowgroup).
- `liste` : deux items de liste (`li`, rôles option / listitem / menuitem / tab / treeitem, `.origam-list-item`).
- `bracket` : à l'intérieur d'un tableau à élimination (`.origam-bracket`).
- `interne-origam` : deux parties internes d'un composant Origam (classes `origam-x__y`) ou intérieur d'un contrôle (bouton, lien, label, champ, puce, avatar, squelette).
- `typo` : lignes d'un même élément de texte (parent `h1`..`h6`, `p`, `label`, `small`, `b`, `strong`).
- `coque` : deux repères de la coque hors `main` (`header`, `main`, `footer`, `nav`, `aside`), bandes accolées par design.
- `gap-explicite` : le parent déclare un `row-gap` (même 0 ou 2 px) : choix de design.
- `padding` : l'écart VISIBLE atteint le seuil : un bloc sans fond, bordure, ombre, texte propre ni élément remplacé ne se voit pas, son bord visible est celui de son premier (dernier) descendant visible ; un bouton ou lien sans fond n'est vu que par son libellé.
- `texte-interligne` : écart de boîtes de 0 à 3 px entre deux faces de texte en ligne (fin de A et début de B : du texte, sans fond de bloc ni contrôle de formulaire, une puce en ligne admise) : l'interligne fait l'espacement, écart identique aux maquettes (mesure dev-f63b, 2026-11-17). Jamais appliquée quand la cause est `card__content`, `form__content`, `dialog` ou `async-state`.

## Exclusions par règle

| règle | cas |
|---|---|
| interne-origam | 123 |
| tableau | 113 |
| padding | 86 |
| gap-explicite | 40 |
| coque | 32 |
| texte-interligne | 12 |
| maquette | 8 |
| bracket | 4 |
| typo | 2 |
| liste | 2 |

## États non atteints

- /admin/editions/2026 @1440 : dialog [data-cy="edition-delete-open"] (déclencheur absent ou désactivé)
- /admin/editions/2026 @390 : dialog [data-cy="edition-delete-open"] (déclencheur absent ou désactivé)

## Détail

| page | état | largeur | parent | enfant A | enfant B | écart boîtes (px) | écart visible (px) | Origam | cause | parent (display gap) | gap perdu (ancêtre) |
|---|---|---|---|---|---|---|---|---|---|---|---|
