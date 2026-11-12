# ds : `useStack` met `globalTop` une tâche après l'ouverture, un Échap ou un clic extérieur envoyé dans cet intervalle est ignoré (`origam-dialog`, `-overlay`)

> **À déposer** (aucun numéro Origam à ce jour).

## Mesure (Origam 2.37.4, CCC F-11, Playwright)

- `OrigamOverlay.handleKeydown` et `closeConditional` (clic extérieur) exigent `globalTop`. Dans `useStack` (`stack.composable.js`), `globalTop` n'est mis à jour que dans un `setTimeout` posé par un `watchEffect` : il retarde d'une tâche l'état « au sommet » après l'ouverture.
- Mesure : après l'ouverture de la confirmation de validation (`DrawValidateDialog.vue`), un Échap toutes les 20 ms ; le premier est perdu, le second (environ 25 ms plus tard) ferme le dialogue. Même effet sur le clic extérieur d'un dialogue rouvert.
- Un humain ne l'atteint pas ; un test automatisé, si.

## Limites

Mécanisme déduit de la lecture du code et de la mesure, pas d'un correctif Origam essayé. Valeur initiale à `true` au montage, puis `false` si la pile est vide : l'écart exact selon le cas n'est pas établi.

## Contournement côté CCC

Aucun dans l'application. `dismissDialog` dans `tests/e2e/writes/F-11.spec.ts` réessaie l'Échap ou le clic jusqu'à la fermeture.
