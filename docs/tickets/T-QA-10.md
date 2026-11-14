# T-QA-10 — Test e2e F-08 « 412 : le match a changé entre-temps » instable

- **Statut** : **Fermé** (2026-11-13). Mergé dans develop @ `ac1bb3ec` (branche `c65126b8`, dev-f13, revue frontend-lead). Cause : un défaut de l'app, pas du test. Le `watch` de `useScoreEntry` remettait `failure` à zéro à chaque changement de version du match, y compris au rechargement de la file déclenché par le 412 lui-même : le message « modifié, rechargez » disparaissait (course). Correction : `failure` n'est remis à zéro qu'au changement d'identifiant de match. Test de composant rouge puis vert. Mesures dev-f13 sous verrou, `--retries=0`, charge 6,6 au lancement : le test « 412 » en `--repeat-each=8` donne 8/8, contre 2/8 et 1/8 d'échecs avant la correction ; `F-08.spec.ts` en entier 5 fois de suite donne 35/35. Réserve : la charge est montée à 11-16 pendant les lancements, à cause d'autres agents ; les 43 tests sont passés malgré tout. Sur le merge : typecheck vert, test:run 1431 / 1 ignoré / 0. Ouvert par le chef de projet sur le relevé de dev-f13 pendant F-21.
- **Constat** : `tests/e2e/writes/F-08.spec.ts`, l. 134 (« 412 : le match a changé entre-temps, message « modifié, rechargez » et la ligne est rechargée ») a échoué trois fois de suite, dont une fois sur develop `08449fca` intact (worktree jetable), puis il est passé au lancement suivant sans aucun changement de code. Le défaut existait donc avant F-21.
- **Piste, non vérifiée (dev-f13)** : le rechargement de la file après le 412 remet `failure` à zéro par le `watch` de `useScoreEntry`, et le message disparaît avant l'assertion. Ce peut être un défaut de l'app et pas seulement du test.
- **Attendu** : établir la cause par la reproduction. Si c'est l'app, le message « modifié, rechargez » doit rester affiché après le rechargement : corriger le composable et ajouter un test unitaire. Si c'est le test, attendre l'état stable sans allonger les délais. Ne jamais contourner l'échec par un retry ou une exclusion.

- **À faire au prochain échec** : relever le message d'erreur exact de Playwright et la capture, qui n'ont pas été conservés jusqu'ici (front-lead).

## Critères d'acceptation

- [x] Cause établie et documentée ici.
- [x] 5 lancements consécutifs de F-08 writes verts sous verrou, avec `--retries=0` (charge < 10 au lancement seulement, voir la réserve).

- **2026-11-13 (chef de projet, mesures dev-f13 sur F-38)** : `--repeat-each=8` sur le test F-08 « 412 » donne 2 échecs sur 8 avec F-38 (`d2c042e7`) et 1 sur 8 sur la base F-25 `39798837`, sans F-38. Le test était donc déjà instable avant F-38. Cause toujours non trouvée.

## Cause établie par reproduction (dev-f13, 2026-11-14) : défaut de l'application

- **Mécanisme** : `useScoreEntry` observait `[match.id, match.version]` et, à chaque changement, remettait `failure` à `null` (avec les valeurs et `submitted`). Un 412 (ou 409) appelle `onStale`, qui recharge la file : la ligne revient avec une AUTRE version (c'est le conflit lui-même : un autre écrivain a changé le match). Le `watch` se déclenche et efface « modifié, rechargez » dès que le rechargement aboutit. Si le rechargement est rapide, le message disparaît avant que l'assertion Playwright (`toContainText`, 5 s) ou l'utilisateur ne l'ait lu : d'où l'échec intermittent (course entre l'affichage du message et la fin du rechargement), plus fréquent quand la machine est chargée ou au contraire rapide.
- **Reproduction (rouge)** : `tests/nuxt/front/use-score-entry.test.ts`, « 412 : le message survit au rechargement de la file, qui change la version de la ligne » : `onStale` remplace le match par la version 9 ; `failure` valait `null` au lieu de `version-conflict`.
- **Correction** (vert, 12 tests du fichier) : le `watch` ne remet `failure` à zéro que si l'identifiant du match change ; une autre version du même match relit les scores et garde l'échec affiché. Une nouvelle saisie (`setValue`) ou un nouvel envoi (`run`) l'efface, comme avant. `ScoreEntryDialog.vue` n'est pas touché (F-30).
- **Mesures sous verrou** (`--retries=0`, port 3984, base `ccc_dev_f13_test`, charge 6,6 au lancement) sur l'arbre corrigé :
  - test « 412 » avec `--repeat-each=8` : **8 réussis sur 8** (avant la correction : 2 échecs sur 8 sur F-38 `d2c042e7`, 1 sur 8 sur la base F-25 `39798837`) ;
  - `F-08.spec.ts` entier, **5 lancements consécutifs : 7 réussis sur 7 à chaque fois** (35 tests, aucun échec).
  - Réserve : la charge de la machine est montée à 11-16 pendant ces lancements (autres agents, hors Playwright) : la charge n'a donc pas été < 10 sur toute la durée, mais les 43 tests sont passés quand même.
