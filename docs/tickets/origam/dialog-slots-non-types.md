# ds : les composants qui exposent `forwardRefs(...)` n'acceptent aucun slot au typecheck (`origam-dialog`, `-form`, `-menu`, `-tooltip`, `-snackbar`, `-text-field`)

> **Déposée : Origam #1332** (liée à #1133). La section « Contournement » n'a pas été reprise dans l'issue.

## Mesure (Origam 2.37.4, vue-tsc du consommateur, CCC F-11)

Tous ces usages échouent avec `TS2339: Property '<slot>' does not exist on type '{}'` :

| Composant | Slot utilisé | Fin de setup |
|---|---|---|
| `origam-dialog` | `#text`, `#footer`, `#title`, `#default` | `defineExpose(forwardRefs({...}))` (`OrigamDialog.vue:393`) |
| `origam-form` | `#default` | `forwardRefs` |
| `origam-tooltip` | `#activator` | `forwardRefs` |
| `origam-menu` | `#activator` | `forwardRefs` |
| `origam-snackbar` | `#text` | `forwardRefs` |
| `origam-text-field` | `#prepend` | `forwardRefs` |

Ces usages passent : `origam-card #text` (`defineExpose({...})` simple, `OrigamCard.vue:458`), `origam-alert #close` et `#text` (`defineExpose({...})` simple, `OrigamAlert.vue:324`).

Dialog, card et alert ont par ailleurs le même `defineSlots();` sans générique : il n'explique pas la différence. Le point commun des composants en échec est `defineExpose(forwardRefs(...))`.

## Limites

- Corrélation mesurée sur 6 composants en échec et 3 qui passent ; le mécanisme exact (pourquoi `forwardRefs` fait perdre les slots) n'est pas établi.
- Le dist n'embarque aucun `.vue.d.ts` (famille #1133, `vue-tsc-composants-sans-dts.md`) : le typage vient du SFC lui-même.

## Contournement côté CCC

Noms de slot dynamiques (`#[textSlot]`, `#[footerSlot]`) dans `src/components/admin/draws/DrawValidateDialog.vue`.

## Reproduction

```vue
<origam-dialog :model-value="true"><template #title>a</template></origam-dialog>
```

`npm run typecheck` : `TS2339: Property 'title' does not exist on type '{}'.`
