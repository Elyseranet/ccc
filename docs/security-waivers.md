# Dérogations de sécurité

Une dérogation est une exception à la règle « zéro vulnérabilité `high` ou `critical` avant main ». Elle est approuvée par l'utilisateur, datée, justifiée par une preuve, et revue à une date fixe. Un avis sans correctif publié n'est pas un avis ignoré : il reste suivi jusqu'à sa condition de sortie.

## SW-1 — picomatch, ReDoS sur extglobs (GHSA-fc5q-39xc-vjpf)

| Champ | Valeur |
|---|---|
| Avis | [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf) : picomatch vulnérable à un ReDoS par extglobs à branche unique répétée |
| Sévérité | high |
| Versions touchées | picomatch `<= 4.0.7`. La 4.0.7 est la dernière publiée (`npm view picomatch dist-tags`, 2026-11-18) : aucun correctif n'existe |
| Paquets de la chaîne dans `npm audit --omit=dev` | `picomatch`, `fdir`, `tinyglobby`, `unplugin`, `unplugin-utils`, `unctx`, `@vue-macros/common`, `@nuxt/kit`, `@pinia/nuxt`, `vite`, `vue-router`, `typeorm` (12 entrées high, un seul avis) |
| Décision utilisateur | 2026-11-18 (dérogation accordée sous réserve de la preuve ci-dessous) |
| Date de revue | **2026-12-17** (alignée sur la dérogation équivalente côté Origam) |
| Condition de sortie | une version de picomatch postérieure à la 4.0.7 corrige l'avis : montée des dépendances, `npm audit --omit=dev` à 0 high, suppression de cette entrée. À défaut à la date de revue : reconduire avec une nouvelle preuve ou remplacer la dépendance |

### Exposition réelle dans CCC

Un ReDoS picomatch exige qu'un attaquant maîtrise le **motif** glob (ou l'extglob compilé). Aucune route ni entrée utilisateur de CCC n'atteint un motif glob.

### Preuve (relevée le 2026-11-18, branche `fix/T-SEC-23-audit`)

1. **Code CCC** : `grep -rnE "picomatch|tinyglobby|minimatch|micromatch|anymatch|fdir|globby|fast-glob|globSync|isMatch"` sur `packages/web/src`, `scripts`, `nuxt.config.ts`, `vitest*.ts` et `playwright*.ts` : **aucun résultat**. Aucun `import.meta.glob`, aucun `routeRules`, aucun motif glob dans le code applicatif.
2. **Image de production** : `grep -rlE "picomatch|tinyglobby|fdir"` dans `packages/web/.output/server` (build Nitro) : le seul appelant hors de ces paquets est `node_modules/typeorm/util/DirectoryExportedClassesLoader.js`, qui appelle `tinyglobby.globSync`. Aucun chunk Nitro ni code de route ne les référence. `vue-router` ne les cite que dans son `package.json`.
3. **Chemin TypeORM** : `importClassesFromDirectories` n'est appelée par `ConnectionMetadataBuilder` que pour les entrées de type chaîne de `entities`, `migrations` et `subscribers`. Au runtime Nitro, `src/utils/database.util.ts` appelle `buildDataSourceOptions(config)` sans migrations : `migrations: []`, `entities: ENTITIES` (classes importées, `src/consts/entities.const.ts`), pas de `subscribers`. Aucun glob n'est donc évalué par le serveur HTTP.
4. **CLI TypeORM** (`db:migration:*`, `user:*`, `db:seed:archives`, entrypoint de l'image) : un seul glob, `src/server/db/typeorm/data-source.ts` ligne 20, `fileURLToPath(new URL('../migrations/*{.ts,.js}', import.meta.url))`. Le motif est une constante du dépôt ; seul le préfixe de chemin vient du système de fichiers. Il ne contient aucune donnée utilisateur et la CLI n'est pas exposée en HTTP.
5. **Outillage de build et de développement** (Vite, Nuxt, unplugin, `@nuxt/kit`) : picomatch reçoit les motifs de `nuxt.config.ts` et des modules, statiques et propres au dépôt. Il tourne au build ou en `nuxt dev`, jamais dans le processus de production.

### Limites de la preuve

- Elle repose sur la recherche textuelle du code CCC et du bundle `.output`, pas sur l'audit du code interne de Vite, Nuxt ou Nitro. Pour ces paquets, la conclusion vient du fait que leur exécution ne se produit qu'au build ou en `nuxt dev`, avec des motifs statiques.
- Si une fonctionnalité passe un jour une valeur saisie par un utilisateur à un glob (recherche de fichiers, filtre par motif…), cette dérogation ne couvre pas ce cas : la rouvrir avant de livrer.

### Suivi

Ticket : `docs/tickets/T-SEC-23.md`. Relancer `npm audit --omit=dev` et `npm view picomatch dist-tags` à la date de revue.
