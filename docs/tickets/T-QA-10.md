# T-QA-10 — Test e2e F-08 « 412 : le match a changé entre-temps » instable

- **Statut** : À faire (2026-11-13). Ouvert par le chef de projet sur le relevé de dev-f13 pendant F-21.
- **Constat** : `tests/e2e/writes/F-08.spec.ts`, l. 134 (« 412 : le match a changé entre-temps, message « modifié, rechargez » et la ligne est rechargée ») a échoué trois fois de suite, dont une fois sur develop `08449fca` intact (worktree jetable), puis il est passé au lancement suivant sans aucun changement de code. Le défaut existait donc avant F-21.
- **Piste, non vérifiée (dev-f13)** : le rechargement de la file après le 412 remet `failure` à zéro par le `watch` de `useScoreEntry`, et le message disparaît avant l'assertion. Ce peut être un défaut de l'app et pas seulement du test.
- **Attendu** : établir la cause par la reproduction. Si c'est l'app, le message « modifié, rechargez » doit rester affiché après le rechargement : corriger le composable et ajouter un test unitaire. Si c'est le test, attendre l'état stable sans allonger les délais. Ne jamais contourner l'échec par un retry ou une exclusion.

- **À faire au prochain échec** : relever le message d'erreur exact de Playwright et la capture, qui n'ont pas été conservés jusqu'ici (front-lead).

## Critères d'acceptation

- [ ] Cause établie et documentée ici.
- [ ] 5 lancements consécutifs de F-08 writes verts sous verrou, à une charge < 10, avec `--retries=0`.

- **2026-11-13 (chef de projet, mesures dev-f13 sur F-38)** : `--repeat-each=8` sur le test F-08 « 412 » donne 2 échecs sur 8 avec F-38 (`d2c042e7`) et 1 sur 8 sur la base F-25 `39798837`, sans F-38. Le test était donc déjà instable avant F-38. Cause toujours non trouvée.

## Cause établie par reproduction (dev-f13, 2026-11-14) : défaut de l'application

- **Mécanisme** : `useScoreEntry` observait `[match.id, match.version]` et, à chaque changement, remettait `failure` à `null` (avec les valeurs et `submitted`). Un 412 (ou 409) appelle `onStale`, qui recharge la file : la ligne revient avec une AUTRE version (c'est le conflit lui-même : un autre écrivain a changé le match). Le `watch` se déclenche et efface « modifié, rechargez » dès que le rechargement aboutit. Si le rechargement est rapide, le message disparaît avant que l'assertion Playwright (`toContainText`, 5 s) ou l'utilisateur ne l'ait lu : d'où l'échec intermittent (course entre l'affichage du message et la fin du rechargement), plus fréquent quand la machine est chargée ou au contraire rapide.
- **Reproduction (rouge)** : `tests/nuxt/front/use-score-entry.test.ts`, « 412 : le message survit au rechargement de la file, qui change la version de la ligne » : `onStale` remplace le match par la version 9 ; `failure` valait `null` au lieu de `version-conflict`.
- **Correction** (vert, 12 tests du fichier) : le `watch` ne remet `failure` à zéro que si l'identifiant du match change ; une autre version du même match relit les scores et garde l'échec affiché. Une nouvelle saisie (`setValue`) ou un nouvel envoi (`run`) l'efface, comme avant. `ScoreEntryDialog.vue` n'est pas touché (F-30).
- **Reste** : les 5 lancements consécutifs de F-08 writes sous verrou (`--retries=0`, charge < 10) et la mesure `--repeat-each` du test « 412 » sur cet arbre, à passer dans un créneau.
