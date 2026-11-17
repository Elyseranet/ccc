# Audit des espacements (F-63)

Généré par `npm run audit:spacing` (`packages/web/tests/e2e/audit/spacing.audit.ts`) le 2026-11-17.
Seuil : écart vertical < 4 px entre deux blocs frères empilés, ou chevauchement (écart négatif). Largeurs : 1440, 390.

Pages et états visités : 102. Cas retenus : **18** ; exclus par règle : 406.

## Par cause

| cause | cas |
|---|---|
| card__content | 12 |
| dialog | 2 |
| async-state | 2 |
| form__content | 2 |

## Par composant Origam enveloppant

| composant | cas |
|---|---|
| origam-card | 14 |
| origam-main | 2 |
| origam-form | 2 |

## Par page

| page | 1440 | 390 |
|---|---|---|
| /admin/participants | 1 | 1 |
| /admin/editions | 1 | 1 |
| /admin/editions/2025 | 2 | 2 |
| /admin/competiteurs/:id | 5 | 5 |

## Règles d'exclusion

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
| interne-origam | 118 |
| tableau | 116 |
| padding | 86 |
| gap-explicite | 36 |
| coque | 30 |
| texte-interligne | 12 |
| bracket | 4 |
| typo | 2 |
| liste | 2 |

## États non atteints

- /admin/editions/2026 @1440 : dialog [data-cy="edition-delete-open"] (déclencheur absent ou désactivé)
- /admin/editions/2026 @390 : dialog [data-cy="edition-delete-open"] (déclencheur absent ou désactivé)

## Détail

| page | état | largeur | parent | enfant A | enfant B | écart boîtes (px) | écart visible (px) | Origam | cause | parent (display gap) | gap perdu (ancêtre) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| /admin/participants | boîte [data-cy="participant-invite"] | 1440 | `div[data-cy="participant-invite-dialog"].origam-overlay.origam-overlay--active > div.origam-overlay__content > div.origam-card.origam-card--density-comfortable > div.origam-card__content` | `p.confirm-dialog__text` | `div.account-email-field` | 0 | 2 | origam-card | dialog | flex normal |  |
| /admin/editions | initial | 1440 | `div[data-cy="async-state"].async-state` | `div[data-cy="editions-table"].origam-table.origam-table--has-bottom` | `p[data-cy="editions-note"].admin-editions__note` | 0 | 0 | origam-main | async-state | block normal | div.admin-editions 20px |
| /admin/editions/2025 | initial | 1440 | `section[data-cy="edition-closed"].origam-card.origam-card--border > div.origam-card__content` | `header.edition-closed__head` | `div[data-cy="edition-closed-notice"].origam-alert.origam-alert--hover` | 0 | 0 | origam-card | card__content | block normal | section[data-cy="edition-closed"].origam-card.origam-card--border 20px |
| /admin/editions/2025 | initial | 1440 | `section[data-cy="edition-closed"].origam-card.origam-card--border > div.origam-card__content` | `div[data-cy="edition-closed-notice"].origam-alert.origam-alert--hover` | `dl[data-cy="edition-readonly"].origam-data-list.origam-data-list--mode-kv` | 0 | 0 | origam-card | card__content | block normal | section[data-cy="edition-closed"].origam-card.origam-card--border 20px |
| /admin/competiteurs/:id | initial | 1440 | `section[data-cy="competitor-form-card"].origam-card.origam-card--border > div.origam-card__content` | `header.identity-form__head` | `fieldset[data-cy="competitor-photo"].competitor-photo` | 0 | 0 | origam-card | card__content | block normal | section[data-cy="competitor-form-card"].origam-card.origam-card--border 20px |
| /admin/competiteurs/:id | initial | 1440 | `section[data-cy="competitor-form-card"].origam-card.origam-card--border > div.origam-card__content` | `fieldset[data-cy="competitor-photo"].competitor-photo` | `form[data-cy="competitor-form"].origam-form.origam-form--dirty` | 0 | 0 | origam-card | card__content | block normal | section[data-cy="competitor-form-card"].origam-card.origam-card--border 20px |
| /admin/competiteurs/:id | initial | 1440 | `form[data-cy="competitor-form"].origam-form.origam-form--dirty > div.origam-form__content` | `div.identity-form__grid` | `div.identity-form__cta` | 0 | 0 | origam-form | form__content | block normal | form[data-cy="competitor-form"].origam-form.origam-form--dirty 20px |
| /admin/competiteurs/:id | initial | 1440 | `section[data-cy="competitor-account"].origam-card.origam-card--border > div.origam-card__content` | `header.account-block__head` | `div[data-cy="competitor-account-state"].account-block__state` | 0 | 0 | origam-card | card__content | block normal | section[data-cy="competitor-account"].origam-card.origam-card--border 16px |
| /admin/competiteurs/:id | initial | 1440 | `section[data-cy="competitor-account"].origam-card.origam-card--border > div.origam-card__content` | `div[data-cy="competitor-account-state"].account-block__state` | `p[data-cy="competitor-account-readonly"].account-block__readonly` | 0 | 0 | origam-card | card__content | block normal | section[data-cy="competitor-account"].origam-card.origam-card--border 16px |
| /admin/participants | boîte [data-cy="participant-invite"] | 390 | `div[data-cy="participant-invite-dialog"].origam-overlay.origam-overlay--active > div.origam-overlay__content > div.origam-card.origam-card--density-comfortable > div.origam-card__content` | `p.confirm-dialog__text` | `div.account-email-field` | 0 | 2 | origam-card | dialog | flex normal |  |
| /admin/editions | initial | 390 | `div[data-cy="async-state"].async-state` | `div[data-cy="editions-table"].origam-table.origam-table--has-bottom` | `p[data-cy="editions-note"].admin-editions__note` | 0 | 0 | origam-main | async-state | block normal | div.admin-editions 20px |
| /admin/editions/2025 | initial | 390 | `section[data-cy="edition-closed"].origam-card.origam-card--border > div.origam-card__content` | `header.edition-closed__head` | `div[data-cy="edition-closed-notice"].origam-alert.origam-alert--hover` | 0 | 0 | origam-card | card__content | block normal | section[data-cy="edition-closed"].origam-card.origam-card--border 20px |
| /admin/editions/2025 | initial | 390 | `section[data-cy="edition-closed"].origam-card.origam-card--border > div.origam-card__content` | `div[data-cy="edition-closed-notice"].origam-alert.origam-alert--hover` | `dl[data-cy="edition-readonly"].origam-data-list.origam-data-list--mode-kv` | 0 | 0 | origam-card | card__content | block normal | section[data-cy="edition-closed"].origam-card.origam-card--border 20px |
| /admin/competiteurs/:id | initial | 390 | `section[data-cy="competitor-form-card"].origam-card.origam-card--border > div.origam-card__content` | `header.identity-form__head` | `fieldset[data-cy="competitor-photo"].competitor-photo` | 0 | 0 | origam-card | card__content | block normal | section[data-cy="competitor-form-card"].origam-card.origam-card--border 20px |
| /admin/competiteurs/:id | initial | 390 | `section[data-cy="competitor-form-card"].origam-card.origam-card--border > div.origam-card__content` | `fieldset[data-cy="competitor-photo"].competitor-photo` | `form[data-cy="competitor-form"].origam-form.origam-form--dirty` | 0 | 0 | origam-card | card__content | block normal | section[data-cy="competitor-form-card"].origam-card.origam-card--border 20px |
| /admin/competiteurs/:id | initial | 390 | `form[data-cy="competitor-form"].origam-form.origam-form--dirty > div.origam-form__content` | `div.identity-form__grid` | `div.identity-form__cta` | 0 | 0 | origam-form | form__content | block normal | form[data-cy="competitor-form"].origam-form.origam-form--dirty 20px |
| /admin/competiteurs/:id | initial | 390 | `section[data-cy="competitor-account"].origam-card.origam-card--border > div.origam-card__content` | `header.account-block__head` | `div[data-cy="competitor-account-state"].account-block__state` | 0 | 0 | origam-card | card__content | block normal | section[data-cy="competitor-account"].origam-card.origam-card--border 16px |
| /admin/competiteurs/:id | initial | 390 | `section[data-cy="competitor-account"].origam-card.origam-card--border > div.origam-card__content` | `div[data-cy="competitor-account-state"].account-block__state` | `p[data-cy="competitor-account-readonly"].account-block__readonly` | 0 | 0 | origam-card | card__content | block normal | section[data-cy="competitor-account"].origam-card.origam-card--border 16px |
