# CCC — règles propres au projet

Complète `~/CLAUDE.md` et `~/.claude/CLAUDE.md`. En cas de conflit sur les points ci-dessous, ce fichier prime pour CCC.

## Animations — exception au « CSS only » (décision utilisateur 2026-10-19)

- **Pages vitrines publiques** (accueil, palmarès, et toute page de présentation publique) : vidéo de fond, WebGL/3D léger et une librairie d'animation JS sont **autorisés**.
- **Écrans denses publics** (édition, poules, bracket, matchs, joueurs, fiche joueur, face-à-face, classements) et **tout l'admin** : la règle globale s'applique — animations en CSS uniquement, aucun timer JS pilotant du visuel.
- Partout : **toute animation est désactivée sous `prefers-reduced-motion: reduce`**, et le contenu reste lisible et complet sans elle.

## Specs

Les specs font foi et vivent dans Obsidian : `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidians/Projects/CCC/` (Spec fonctionnelle, Spec API, Spec technique). Décisions design : `docs/design/ux/decisions.md`.

## Arborescence — décisions ARCH-1 à ARCH-14 (utilisateur, 2026-10-22, T-ARCH-01 et T-ARCH-03)

Détail et justification : `docs/design/ux/decisions.md`. L'exception FA-02 (`shared/`, alias `#shared`) est **abandonnée** (ARCH-4).

**La section « Project Structure » de `~/CLAUDE.md` (monorepo `packages/…`, `src/server/utils/`, `server/db/index.ts`) ne s'applique pas à CCC** : pour ce projet, seule l'arborescence ci-dessous fait foi (décision utilisateur 2026-10-22).

```
src/
  assets/        css/, locales/, seeds/archives.sql (dump SQL figé des archives, ARCH-5)
  components/    PascalCase.vue (admin/, common/, icons/, rules/)
  composables/   useCamelCase.ts, stores Pinia compris (useAuthStore.ts, useAdminEditionStore.ts : un store est un composable, ARCH-14)
  consts/        kebab-case.const.ts : toutes les constantes, à plat (ENTITIES compris)
  enums/         kebab-case.enum.ts, à plat
  interfaces/    kebab-case.interface.ts, à plat (contrat d'API compris)
  layouts/ middleware/ pages/ plugins/
  services/      kebab-case.service.ts, à plat : classe navigateur ($fetch) ET fonctions serveur (TypeORM) d'un même domaine, fusionnées (ARCH-2)
  themes/        thème Origam, à plat (ARCH-7)
  types/         kebab-case.type.ts, à plat
  utils/         kebab-case.util.ts, à plat : utils navigateur ET serveur, scripts CLI compris (*-cli.util.ts) (ARCH-1)
  server/        uniquement ce que Nitro impose (api/, middleware/, plugins/), la base (ARCH-6) et les schémas (ARCH-13) :
    schemas/             kebab-case.schema.ts : schémas zod, à plat, jamais importés côté client (ARCH-13)
    db/migrations/       migrations TypeORM
    db/typeorm/          data-source, options, stratégie de nommage, transformer
    db/typeorm/entities/ *.entity.ts
```

- **Aucun sous-dossier** dans `utils`, `services`, `interfaces`, `types`, `enums`, `consts`, `composables`, `themes`, `server/schemas` ; ni `src/stores` ni `src/schemas` : garde automatique dans `tests/unit/architecture.test.ts`.
- **Aucun code serveur dans le bundle navigateur** : pas de scan d'auto-import (`imports.scan: false`), imports explicites ; le build client élague les modules serveur et `clientBundleGuard` fait échouer `nuxt build` sinon ; `npm run test:bundle` le vérifie. En `nuxt dev`, un service fusionné charge TypeORM dans le navigateur : accepté (ARCH-12).
- Couche « TS pur » (`utils`, `services`, `consts`, `enums`, `interfaces`, `types`, `server/schemas`, `server/db`) : imports **relatifs avec extension `.js`** (lus par Vitest, Nitro et `tsc` NodeNext pour la CLI). Couche Vue : alias `~/`.
- **Aucune donnée fictive** (ARCH-8) : plus de fixtures ni d'`API_SOURCE`. `API_ROUTES` (`src/consts/api-routes.const.ts`) nomme la route Nitro de chaque endpoint, et le ticket back (`pendingTicket`) tant qu'elle n'existe pas (ARCH-11).
- e2e sur les vraies données (ARCH-9) : base `_test` chargée par le seed SQL, sessions réelles ; zones de données masquées, seuil 1 % par zone.
- **Une base e2e par agent ou par worktree** (`ccc_<agent>_test`, approuvé par le chef de projet le 2026-10-22) : `global-setup` remet la base à neuf et recrée les sessions à chaque lancement, donc une base partagée invalide les sessions des autres agents (faux échecs en délai dépassé sur les pages admin). Commande de création : README, « e2e sur les vraies données ».

## Worktrees d'agents (T-ARCH-02, 2026-10-22)

- Chaque worktree a **son propre `node_modules`**, installé par `npm ci`. **Pas de lien symbolique** vers celui de la copie principale : les caches partagés entre branches ont provoqué de faux échecs Vitest (« SyntaxError: Invalid or unexpected token » sur les entités TypeORM).
