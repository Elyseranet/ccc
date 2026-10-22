# T-ARCH-01 — Remise en ordre de l'arborescence selon les règles du projet

- **Statut** : **Fermé** — mergé dans `develop` @ `52c54de` (voir « Fermeture »).
- **Base** : `feature/T-ARCH-01` @ `0394424`, le déplacement vers `src/` commencé par l'utilisateur, conservé tel quel.
- **Gel** : aucun merge dans `develop` jusqu'à la fermeture de ce ticket. Les branches en cours seront reprises ensuite sur la nouvelle arborescence : les 8 de la vague 3a back, F-04, F-05, F-00h et F-00n.

## Règles à appliquer (`~/CLAUDE.md`, plus ARCH-1 à ARCH-5)
- Un dossier par nature, **à plat**, sans sous-dossier non autorisé : `src/utils`, `src/services`, `src/interfaces`, `src/types`, `src/enums`, `src/consts`, `src/composables`, `src/stores`, `src/components/*` (déjà en place), `src/assets`.
- Code Nitro obligatoirement sous `src/server/` (routes `api/`, `middleware/`, `plugins/`) : il y reste. Tout ce qui n'est pas imposé par Nitro sort de `src/server/`.
- Nommage `kebab-case.<nature>.ts`, préfixes I/T, SCREAMING_SNAKE (`~/CLAUDE.md`).
- **Réutiliser avant d'écrire** : aucun doublon. Fusionner, unifier ou renommer selon ARCH-2.

## Périmètre
1. Utils : `src/server/utils/**` et `src/server/db/scripts/**` vont dans `src/utils/` (à plat). Les noms en collision sont renommés et les doublons unifiés.
2. Services : `src/server/services/*` est fusionné avec `src/services/*` (ARCH-2).
3. Migrations et seeds : `src/server/db/migrations` et `src/server/db/seeds` passent dans `src/assets/` (ARCH-3). Le `DataSource`, le Dockerfile, `ccc-ops`, l'entrypoint et les scripts npm sont mis à jour en conséquence.
4. Seed SQL (ARCH-5) : générer le dump SQL depuis une base neuve, après migrations, seed et import actuels, en vérifiant d'abord Deseine 39/13, 729 matchs et les classements à 0 écart. Ajouter la commande d'application et le test de non-régression sur les vraies données, puis supprimer le convertisseur, le JSON, les scripts et leurs tests.
5. Interfaces, consts, enums et types : tout ce qui est déclaré ailleurs que dans son dossier dédié y est déplacé (`grep` des `interface`, `export const`, `enum`, `type` hors de ces dossiers).
6. Entités, `DataSource`, stratégie de nommage, transformers : proposer un emplacement conforme. **Toute ambiguïté remonte au chef de projet**, qui la pose à l'utilisateur.
7. Docs : `CLAUDE.md` du projet (retrait de l'exception FA-02 et de l'arborescence `server/`), README, `ARCHITECTURE.md`, et chemins cités dans les tickets ouverts.

## Critères d'acceptation
- [ ] Aucun sous-dossier dans `src/utils`, `src/services`, `src/interfaces`, `src/types`, `src/enums` ni `src/consts` (sortie de `find` à l'appui).
- [ ] Aucun symbole (`interface`, `type`, `enum`, `const` exportée) déclaré hors de son dossier dédié (sortie de `grep` à l'appui).
- [ ] Aucun code serveur dans le bundle navigateur : garde automatisée, par exemple un test qui vérifie que les chunks client ne contiennent ni `typeorm`, ni `pg`, ni `node:crypto` (sortie à l'appui).
- [ ] Aucun doublon de fonction (liste des fusions, unifications et renommages dans le message de commit).
- [ ] `test:run`, `typecheck` à 0, `test:db`, `test:api` (base neuve), Playwright (routes, a11y, visuel) : verts, sorties réelles.
- [ ] Migrations : run, revert et run OK, et `migration:generate` répond « No changes ». Import SQL sur base neuve : Deseine 39/13, 16 éditions, 146 compétiteurs, 729 matchs, 554 avec score.
- [ ] `docker build`, conteneur sain, migrations appliquées depuis les assets. gitleaks propre, `npm ls axios` vide, revue de sécurité sans high ni medium.

## Fermeture — 2026-10-22

- **Statut** : fermé. `feature/T-ARCH-01` @ `82c51ca` a été mergée dans `develop` au commit `52c54de`. La branche est construite sur le déplacement fait par l'utilisateur (`0394424`).
- **Vérifié par le chef de projet**, sur la branche puis sur `develop` après le merge :
  - `test:run` : 40/40 fichiers, 356 tests ;
  - `typecheck` : VERT ;
  - `tests/unit/architecture.test.ts` : 8/8 ;
  - `find` des sous-dossiers dans utils, services, interfaces, types, enums, consts, schemas, themes, composables et stores : 0 ;
  - gitleaks `develop..HEAD` : aucune fuite.
- **Vérifié par l'architecte** :
  - `test:bundle`, garde anti-code-serveur prouvée par un test négatif ;
  - `test:db` 69/69 et `test:api` 121/121, sur bases neuves ;
  - Playwright sur vraies données : 88 passés, zones de données masquées, seuil de 1 % par zone ;
  - migrations run, revert et run sans erreur, et `migration:generate` sans changement ;
  - `archives.sql` : 16 éditions, 146 compétiteurs, 729 matchs, 554 avec score, Deseine 39/13, 0 écart bloquant ;
  - Docker : conteneur sain, e2e release 28 passés ;
  - revue de sécurité : 0 high, 0 medium.
- **Décisions appliquées** : ARCH-0 à ARCH-12 (`docs/design/ux/decisions.md`).
- **Reste ouvert ailleurs** :
  - la relecture humaine des images d'écart régénérées ;
  - la reprise des branches gelées sur la nouvelle arborescence (vague 3a back, F-04, F-05, F-00h, F-00n) ;
  - la mise à jour de `~/CLAUDE.md`, validée par l'utilisateur ;
  - `npm audit`, 14 vulnérabilités inchangées (waiver AUDIT-1, [T-SEC-01](T-SEC-01.md)).
