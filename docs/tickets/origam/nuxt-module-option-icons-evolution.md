# [Évolution] ds(nuxt) : exposer l'option `icons` de `createOrigam()` dans le module `origam/nuxt`

> **Demande d'évolution, pas un défaut.** Le module ne déclare pas d'option `icons` et sa documentation le dit :
> pour un jeu d'icônes personnalisé, elle renvoie vers un plugin manuel appelant `createOrigam()`.

## Constat

- `createOrigam()` accepte `icons` (`TIconOptions` : `defaultSet`, `aliases`, `sets`).
- Le module `origam/nuxt` n'a pas d'option `icons` et appelle `createOrigam()` sans elle.
- `packages/docs/integrations/nuxt.md:306-314` documente ce cas : garder un plugin manuel pour les options
  « non triviales » de `createOrigam()` (« custom icon set, locale, blueprint, … ») et passer `autoImport: false`.

Un projet Nuxt qui veut seulement remplacer quelques alias d'icônes doit donc gérer lui-même l'installation
d'Origam, et perd ce que le module fournit.

## Reproduction minimale

Lecture des sources (pas d'exécution navigateur pour ce point) :

1. `nuxt.config.ts` : `origam: { icons: { aliases: { info: 'mdi-information-outline' } } }`.
2. `icons` n'est déclarée nulle part dans `IOrigamNuxtModuleOptions`, ni relayée dans `runtimeConfig.public.origam`.
   Les plugins appellent `createOrigam()` sans `icons`.

## Cause

- `packages/ds/src/interfaces/Commons/commons.interface.ts:50` : `icons?: TIconOptions` dans `IOrigamOptions`.
- `packages/ds/src/types/Icon/icon.type.ts:11-15` : `TIconOptions = { defaultSet?, aliases?, sets? }`.
- `packages/ds/src/origam.ts:111` : `createIcons(options.icons)`.
- `packages/ds/src/interfaces/Commons/nuxt-module.interface.ts` : pas de clé `icons`.
- `packages/ds/src/nuxt/module.ts:205-217` : `runtimeConfig.public.origam` ne contient que `themes`,
  `defaultTheme`, `modes`, `defaultMode`, `cookieName`, `modeCookieName`, `cookieMaxAge` et `locale`.
- `packages/ds/src/nuxt/plugin.client.ts:63` et `packages/ds/src/nuxt/plugin.server.ts:136` :
  `createOrigam({ themes, ssr: true, ...nuxtLocaleOptions(config) })`.

Contrainte de conception : les options du module transitent par `runtimeConfig`, donc doivent être
sérialisables. `aliases` et `defaultSet` sont des chaînes. Un `sets` contient des fonctions de rendu
(`consts/Commons/mdi.const.ts:12`, `component: (props) => h(...)`) et ne passe pas par `runtimeConfig`.

## Impact

Limité : les composants du DS ne lisent aucun alias `$xxx` (0 occurrence dans `components/`). Ils prennent leurs
icônes par défaut directement dans `MDI_ICONS`, et ces icônes se surchargent par les props d'icône dans le bloc
`components` du thème. L'option servirait aux icônes passées en alias par le consommateur (`icon="$info"`) et au
choix du `defaultSet`.

## Critère d'acceptation

1. `IOrigamNuxtModuleOptions` accepte `icons` limité à la partie sérialisable (`defaultSet`, `aliases`).
   Le choix de relayer ou non `sets` est documenté.
2. Avec `origam: { icons: { aliases: { info: 'mdi-information-outline' } } }`, `<origam-icon icon="$info" />`
   rendu en SSR porte la classe `mdi-information-outline`, sans plugin manuel.
3. Le tableau des options de `packages/docs/integrations/nuxt.md` liste `icons`.

## Version

2.37.3
