# Les composants publiés n'ont pas de `.d.ts` : vue-tsc vérifie les `.vue` du dist (complément à #1133)

> Doublon de **Elyseranet/origam#1133** (ouvert, mesuré en 2.22.0). Ce fichier sert de **commentaire** à
> ajouter sur #1133 avec les chiffres 2.37.3, pas d'une nouvelle issue.

## Constat

En 2.37.3, le paquet publié ne contient aucun `*.vue.d.ts` : 220 fichiers `.vue` dans `dist`, 0 `.vue.d.ts`
(`find node_modules/origam/dist -name '*.vue.d.ts' | wc -l` → `0`). Les barils `dist/src/components/*/index.d.ts`
réexportent directement les SFC (`export { default as OrigamBtn } from './OrigamBtn.vue'`), et ces SFC portent
`<script lang="ts" setup>` avec un corps transpilé en JS. vue-tsc du consommateur les vérifie donc avec **sa**
configuration stricte ; `skipLibCheck` ne couvre pas les `.vue`.

## Reproduction minimale

Application Nuxt 4.6.1, `origam@2.37.3`, `.nuxt/tsconfig.app.json` (`strict: true`, `skipLibCheck: true`) :

```sh
npx vue-tsc --noEmit -p .nuxt/tsconfig.app.json   # 2431 diagnostics, 2431 sous node_modules/origam/
npx vue-tsc --noEmit -p .nuxt/tsconfig.node.json  # 2431 diagnostics, identiques
```

Total 4 862 (= 2 × 2 431) avec `nuxi typecheck`, qui couvre les deux projets. 203 fichiers `.vue` distincts en
cause. Codes principaux : TS7006 ×1088, TS2339 ×408, TS2345 ×331, TS1484 ×158, TS18046 ×143, TS2322 ×95.
Exemple : `node_modules/origam/dist/src/components/App/OrigamApp.vue(23,25): error TS1484: 'StyleValue' is a type
and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.`

## Cause

- `packages/ds/build.config.ts:9-12` : mkdist avec `loaders: ['vue']` publie les SFC tels quels (script transpilé
  en JS) ; `declaration: true` (`build.config.ts:50`) ne produit pas de déclaration pour les `.vue`.
- `packages/ds/build.config.ts:97` : le hook `build:done` remet `lang="ts"` sur chaque `<script setup>` du dist, ce
  qui fait entrer ces fichiers JS dans le contrôle TypeScript du consommateur.

## Impact

Tout consommateur sous vue-tsc doit filtrer les diagnostics par chemin (le projet CCC maintient un script
`scripts/typecheck.mjs` qui écarte toute ligne commençant par `node_modules/`), ce qui masque aussi tout
diagnostic légitime venant d'une autre dépendance.

## Critère d'acceptation

Dans une app Nuxt 4 vierge (`strict: true`) qui importe un composant depuis `origam/components`,
`npx vue-tsc --noEmit` renvoie **0** diagnostic sous `node_modules/origam/`, et un mauvais type de prop
(par ex. `<origam-btn :size="42" />`) est signalé côté application.

## Version

2.37.3
