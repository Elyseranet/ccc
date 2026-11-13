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
