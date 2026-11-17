# Audit des espacements (F-63)

Généré par `npm run audit:spacing` (`packages/web/tests/e2e/audit/spacing.audit.ts`) le 2026-11-17.
Seuil : écart vertical < 4 px entre deux blocs frères empilés, ou chevauchement (écart négatif). Largeurs : 1440, 390.

Pages et états visités : 101. Cas retenus : **36** ; exclus par règle : 392.

## Par cause

| cause | cas |
|---|---|
| card__content | 16 |
| local | 14 |
| dialog | 2 |
| async-state | 2 |
| form__content | 2 |

## Par composant Origam enveloppant

| composant | cas |
|---|---|
| origam-card | 24 |
| origam-tab-panel | 4 |
| origam-main | 4 |
| origam-data-list | 2 |
| origam-form | 2 |

## Par page

| page | 1440 | 390 |
|---|---|---|
| / | 1 | 1 |
| /editions/2025 | 1 | 1 |
| /editions/2026 | 1 | 1 |
| /profil | 2 | 2 |
| /admin/participants | 1 | 1 |
| /admin/phase-finale | 1 | 1 |
| /admin/phase-finale/qualification | 1 | 1 |
| /admin/plus | 1 | 1 |
| /admin/editions | 1 | 1 |
| /admin/editions/2026 | 1 | 1 |
| /admin/editions/2025 | 2 | 2 |
| /admin/competiteurs/:id | 5 | 5 |

## Exclusions par règle

| règle | cas |
|---|---|
| tableau | 120 |
| interne-origam | 116 |
| padding | 82 |
| gap-explicite | 36 |
| coque | 30 |
| bracket | 4 |
| typo | 2 |
| liste | 2 |

## États non atteints

- /invitation/:jeton @1440 : submit [data-cy="invitation-submit"] (déclencheur absent ou désactivé)
- /admin/editions/2026 @1440 : dialog [data-cy="edition-delete-open"] (déclencheur absent ou désactivé)
- /admin/editions/2026 @390 : dialog [data-cy="edition-delete-open"] (déclencheur absent ou désactivé)

## Détail

| page | état | largeur | parent | enfant A | enfant B | écart boîtes (px) | écart visible (px) | Origam | cause | parent (display gap) | gap perdu (ancêtre) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| / | initial | 1440 | `article[data-cy="home-tile-ranking"].origam-card.origam-card--border > div.origam-card__content > div.home-bento__tile-body.home-bento__tile-body--rank` | `h3.origam-title` | `p.home-bento__eyebrow` | 0 | 0 | origam-card | local | flex normal | div.home-bento__grid 16px |
| /editions/2025 | onglet Participants | 1440 | `li[data-cy="edition-participant-*"].edition-participants__item > span.edition-participants__name` | `a[data-cy="player-link"].origam-btn.origam-btn--variant-text` | `small.edition-participants__pool` | 0 | 0 | origam-tab-panel | local | grid normal | li[data-cy="edition-participant-*"].edition-participants__item 12px |
| /editions/2026 | onglet Participants | 1440 | `li[data-cy="edition-participant-*"].edition-participants__item > span.edition-participants__name` | `a[data-cy="player-link"].origam-btn.origam-btn--variant-text` | `small.edition-participants__pool` | 0 | 0 | origam-tab-panel | local | grid normal | li[data-cy="edition-participant-*"].edition-participants__item 12px |
| /profil | initial | 1440 | `div.origam-card__content > div.account-card__body > div.profile-form__header > div` | `p.profile-form__eyebrow` | `h2.origam-title.neon--sm` | 0 | 0 | origam-card | local | block normal | div.profile-form__header 20px |
| /profil | initial | 1440 | `div.origam-card__content > div.account-card__body > div.profile-form__header > div` | `h2.origam-title.neon--sm` | `p.profile-form__nickname` | 0 | 0 | origam-card | local | block normal | div.profile-form__header 20px |
| /admin/participants | boîte [data-cy="participant-invite"] | 1440 | `div[data-cy="participant-invite-dialog"].origam-overlay.origam-overlay--active > div.origam-overlay__content > div.origam-card.origam-card--density-comfortable > div.origam-card__content` | `p.confirm-dialog__text` | `div.account-email-field` | 0 | 2 | origam-card | dialog | flex normal |  |
| /admin/phase-finale | initial | 1440 | `section[data-cy="qualification-prerequisites"].origam-card.origam-card--border > div.origam-card__content` | `p.qualification-prerequisites__text` | `a[data-cy="qualification-matches-link"].origam-btn.origam-btn--variant-text` | 0 | 0 | origam-card | card__content | block normal | div.admin-qualification__grid 20px |
| /admin/phase-finale/qualification | initial | 1440 | `section[data-cy="qualification-prerequisites"].origam-card.origam-card--border > div.origam-card__content` | `p.qualification-prerequisites__text` | `a[data-cy="qualification-matches-link"].origam-btn.origam-btn--variant-text` | 0 | 0 | origam-card | card__content | block normal | div.admin-qualification__grid 20px |
| /admin/plus | initial | 1440 | `div.origam-main__wrapper > div.admin-content > div.admin-more > section.admin-more__edition` | `h2.origam-title.admin-more__card-title` | `div.admin-more__field` | 0 | 2 | origam-main | local | grid normal | div.admin-more 20px |
| /admin/editions | initial | 1440 | `div[data-cy="async-state"].async-state` | `div[data-cy="editions-table"].origam-table.origam-table--has-bottom` | `p[data-cy="editions-note"].admin-editions__note` | 0 | 0 | origam-main | async-state | block normal | div.admin-editions 20px |
| /admin/editions/2026 | initial | 1440 | `span[data-cy="edition-readonly-status"].edition-readonly-value` | `span.origam-chip.origam-chip--pill` | `small.edition-readonly-value__hint` | 2 | 2 | origam-data-list | local | block normal | dd.origam-data-list__kv-value 8px |
| /admin/editions/2025 | initial | 1440 | `section[data-cy="edition-closed"].origam-card.origam-card--border > div.origam-card__content` | `header.edition-closed__head` | `div[data-cy="edition-closed-notice"].origam-alert.origam-alert--hover` | 0 | 0 | origam-card | card__content | block normal | section[data-cy="edition-closed"].origam-card.origam-card--border 20px |
| /admin/editions/2025 | initial | 1440 | `section[data-cy="edition-closed"].origam-card.origam-card--border > div.origam-card__content` | `div[data-cy="edition-closed-notice"].origam-alert.origam-alert--hover` | `dl[data-cy="edition-readonly"].origam-data-list.origam-data-list--mode-kv` | 0 | 0 | origam-card | card__content | block normal | section[data-cy="edition-closed"].origam-card.origam-card--border 20px |
| /admin/competiteurs/:id | initial | 1440 | `section[data-cy="competitor-form-card"].origam-card.origam-card--border > div.origam-card__content` | `header.identity-form__head` | `fieldset[data-cy="competitor-photo"].competitor-photo` | 0 | 0 | origam-card | card__content | block normal | section[data-cy="competitor-form-card"].origam-card.origam-card--border 20px |
| /admin/competiteurs/:id | initial | 1440 | `section[data-cy="competitor-form-card"].origam-card.origam-card--border > div.origam-card__content` | `fieldset[data-cy="competitor-photo"].competitor-photo` | `form[data-cy="competitor-form"].origam-form.origam-form--dirty` | 0 | 0 | origam-card | card__content | block normal | section[data-cy="competitor-form-card"].origam-card.origam-card--border 20px |
| /admin/competiteurs/:id | initial | 1440 | `form[data-cy="competitor-form"].origam-form.origam-form--dirty > div.origam-form__content` | `div.identity-form__grid` | `div.identity-form__cta` | 0 | 0 | origam-form | form__content | block normal | form[data-cy="competitor-form"].origam-form.origam-form--dirty 20px |
| /admin/competiteurs/:id | initial | 1440 | `section[data-cy="competitor-account"].origam-card.origam-card--border > div.origam-card__content` | `header.account-block__head` | `div[data-cy="competitor-account-state"].account-block__state` | 0 | 0 | origam-card | card__content | block normal | section[data-cy="competitor-account"].origam-card.origam-card--border 16px |
| /admin/competiteurs/:id | initial | 1440 | `section[data-cy="competitor-account"].origam-card.origam-card--border > div.origam-card__content` | `div[data-cy="competitor-account-state"].account-block__state` | `p[data-cy="competitor-account-readonly"].account-block__readonly` | 0 | 0 | origam-card | card__content | block normal | section[data-cy="competitor-account"].origam-card.origam-card--border 16px |
| / | initial | 390 | `article[data-cy="home-tile-ranking"].origam-card.origam-card--border > div.origam-card__content > div.home-bento__tile-body.home-bento__tile-body--rank` | `h3.origam-title` | `p.home-bento__eyebrow` | 0 | 0 | origam-card | local | flex normal | div.home-bento__grid 16px |
| /editions/2025 | onglet Participants | 390 | `li[data-cy="edition-participant-*"].edition-participants__item > span.edition-participants__name` | `a[data-cy="player-link"].origam-btn.origam-btn--variant-text` | `small.edition-participants__pool` | 0 | 0 | origam-tab-panel | local | grid normal | li[data-cy="edition-participant-*"].edition-participants__item 12px |
| /editions/2026 | onglet Participants | 390 | `li[data-cy="edition-participant-*"].edition-participants__item > span.edition-participants__name` | `a[data-cy="player-link"].origam-btn.origam-btn--variant-text` | `small.edition-participants__pool` | 0 | 0 | origam-tab-panel | local | grid normal | li[data-cy="edition-participant-*"].edition-participants__item 12px |
| /profil | initial | 390 | `div.origam-card__content > div.account-card__body > div.profile-form__header > div` | `p.profile-form__eyebrow` | `h2.origam-title.neon--sm` | 0 | 0 | origam-card | local | block normal | div.profile-form__header 20px |
| /profil | initial | 390 | `div.origam-card__content > div.account-card__body > div.profile-form__header > div` | `h2.origam-title.neon--sm` | `p.profile-form__nickname` | 0 | 0 | origam-card | local | block normal | div.profile-form__header 20px |
| /admin/participants | boîte [data-cy="participant-invite"] | 390 | `div[data-cy="participant-invite-dialog"].origam-overlay.origam-overlay--active > div.origam-overlay__content > div.origam-card.origam-card--density-comfortable > div.origam-card__content` | `p.confirm-dialog__text` | `div.account-email-field` | 0 | 2 | origam-card | dialog | flex normal |  |
| /admin/phase-finale | initial | 390 | `section[data-cy="qualification-prerequisites"].origam-card.origam-card--border > div.origam-card__content` | `p.qualification-prerequisites__text` | `a[data-cy="qualification-matches-link"].origam-btn.origam-btn--variant-text` | 0 | 0 | origam-card | card__content | block normal | div.admin-qualification__grid 20px |
| /admin/phase-finale/qualification | initial | 390 | `section[data-cy="qualification-prerequisites"].origam-card.origam-card--border > div.origam-card__content` | `p.qualification-prerequisites__text` | `a[data-cy="qualification-matches-link"].origam-btn.origam-btn--variant-text` | 0 | 0 | origam-card | card__content | block normal | div.admin-qualification__grid 20px |
| /admin/plus | initial | 390 | `div.origam-main__wrapper > div.admin-content > div.admin-more > section.admin-more__edition` | `h2.origam-title.admin-more__card-title` | `div.admin-more__field` | 0 | 2 | origam-main | local | grid normal | div.admin-more 20px |
| /admin/editions | initial | 390 | `div[data-cy="async-state"].async-state` | `div[data-cy="editions-table"].origam-table.origam-table--has-bottom` | `p[data-cy="editions-note"].admin-editions__note` | 0 | 0 | origam-main | async-state | block normal | div.admin-editions 20px |
| /admin/editions/2026 | initial | 390 | `span[data-cy="edition-readonly-status"].edition-readonly-value` | `span.origam-chip.origam-chip--pill` | `small.edition-readonly-value__hint` | 2 | 2 | origam-data-list | local | block normal | dd.origam-data-list__kv-value 8px |
| /admin/editions/2025 | initial | 390 | `section[data-cy="edition-closed"].origam-card.origam-card--border > div.origam-card__content` | `header.edition-closed__head` | `div[data-cy="edition-closed-notice"].origam-alert.origam-alert--hover` | 0 | 0 | origam-card | card__content | block normal | section[data-cy="edition-closed"].origam-card.origam-card--border 20px |
| /admin/editions/2025 | initial | 390 | `section[data-cy="edition-closed"].origam-card.origam-card--border > div.origam-card__content` | `div[data-cy="edition-closed-notice"].origam-alert.origam-alert--hover` | `dl[data-cy="edition-readonly"].origam-data-list.origam-data-list--mode-kv` | 0 | 0 | origam-card | card__content | block normal | section[data-cy="edition-closed"].origam-card.origam-card--border 20px |
| /admin/competiteurs/:id | initial | 390 | `section[data-cy="competitor-form-card"].origam-card.origam-card--border > div.origam-card__content` | `header.identity-form__head` | `fieldset[data-cy="competitor-photo"].competitor-photo` | 0 | 0 | origam-card | card__content | block normal | section[data-cy="competitor-form-card"].origam-card.origam-card--border 20px |
| /admin/competiteurs/:id | initial | 390 | `section[data-cy="competitor-form-card"].origam-card.origam-card--border > div.origam-card__content` | `fieldset[data-cy="competitor-photo"].competitor-photo` | `form[data-cy="competitor-form"].origam-form.origam-form--dirty` | 0 | 0 | origam-card | card__content | block normal | section[data-cy="competitor-form-card"].origam-card.origam-card--border 20px |
| /admin/competiteurs/:id | initial | 390 | `form[data-cy="competitor-form"].origam-form.origam-form--dirty > div.origam-form__content` | `div.identity-form__grid` | `div.identity-form__cta` | 0 | 0 | origam-form | form__content | block normal | form[data-cy="competitor-form"].origam-form.origam-form--dirty 20px |
| /admin/competiteurs/:id | initial | 390 | `section[data-cy="competitor-account"].origam-card.origam-card--border > div.origam-card__content` | `header.account-block__head` | `div[data-cy="competitor-account-state"].account-block__state` | 0 | 0 | origam-card | card__content | block normal | section[data-cy="competitor-account"].origam-card.origam-card--border 16px |
| /admin/competiteurs/:id | initial | 390 | `section[data-cy="competitor-account"].origam-card.origam-card--border > div.origam-card__content` | `div[data-cy="competitor-account-state"].account-block__state` | `p[data-cy="competitor-account-readonly"].account-block__readonly` | 0 | 0 | origam-card | card__content | block normal | section[data-cy="competitor-account"].origam-card.origam-card--border 16px |
