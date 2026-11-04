# ds(dialog) : les slots de `origam-dialog` ne sont pas typés (`defineSlots()` vide) — défaut de typage

## Constat

`OrigamDialog` déclare ses slots avec un `defineSlots()` vide : pour `vue-tsc`, le composant n'a aucun slot (`Property 'text' does not exist on type '{}'`), alors que le gabarit les lit (`slots.text`, `slots.footer`, `slots['header-title']`…, `OrigamDialog.vue:84-137`) et que l'interface `IDialogSlots` existe (`interfaces/Dialog/dialog.interface.d.ts:70`) sans être reliée au composant. Un écran qui pose un texte et des actions dans un dialogue (`#text`, `#footer`) ne passe pas le typecheck.

Constaté dans CCC (F-11, confirmation de validation du tirage des poules), Origam 2.37.4.

## Contournement côté CCC

Noms de slot dynamiques (`#[textSlot]`, `#[footerSlot]`) dans `src/components/admin/draws/DrawValidateDialog.vue`, avec un commentaire. Les slots existent bien à l'exécution.

## Proposition

`defineSlots<IDialogSlots>()` dans `OrigamDialog.vue` (et `IDialogConfirmationSlots` dans `OrigamDialogConfirmation.vue`).

## Critère d'acceptation

1. `<origam-dialog><template #text>…</template><template #footer>…</template></origam-dialog>` passe `vue-tsc` sans erreur.

## Version

2.37.4
