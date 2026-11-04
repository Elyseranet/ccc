# ds(dialog) : erreur de typage sur les slots de `origam-dialog` (F-11) : cause à établir

> **DRAFT, cause not verified, not filed**
>
> Cause à établir par une mesure vue-tsc (F-11). Hors `INDEX.md` tant qu'elle ne l'est pas.

## Constat à confirmer

Lors de F-11 (confirmation de validation du tirage, `src/components/admin/draws/DrawValidateDialog.vue`), un typecheck a signalé une erreur sur `#text` / `#footer` de `origam-dialog` (Origam 2.37.4). Le message exact n'a pas été conservé.

## Hypothèses (non mesurées)

- Les 219 composants du dist ont un `defineSlots()` vide (famille #1133, `vue-tsc-composants-sans-dts.md`) : mais `<template #close>` sur `origam-alert` (AsyncState.vue) passe le typecheck, donc ce n'est pas suffisant pour expliquer l'erreur.
- Une autre cause propre à `OrigamDialog`.

## À faire

1. Relancer vue-tsc sur les slots simples `#text` / `#footer`, relever le message exact et le slot.
2. Tester les mêmes slots sur un autre composant.
3. Remplir cette fiche avec la cause réelle, ou demander au team-lead de la retirer.

Hors `INDEX.md` tant que la cause n'est pas établie.
