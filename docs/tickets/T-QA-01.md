# T-QA-01 — Échecs non reproduits de `test:run` / `test:release` après modification de fichiers

- **Origine** : rapport dev-ops sur `feature/T-OPS-01` @ `ed7feca` (2026-10-21).
- **Constat** : une seule fois chacun, juste après des modifications de fichiers : `test:release` « 1 failed » et `vitest` complet « 7 failed ». Une dizaine de relances ensuite : toutes vertes. Cause inconnue. Hypothèse **non vérifiée** : état froid de `.nuxt` / cache Vite.
- **Risque** : faux négatif en CI (pas un contournement de la garde de release), mais un test instable masque les vraies régressions.
- **À faire** : reproduire (modifier un fichier, relancer à froid, `--repeat-each`), relever les noms des tests en échec et la cause ; corriger ou documenter un `nuxt prepare` préalable dans les scripts. Ne pas se contenter d'une relance verte.
- **Fermeture** : cause identifiée et corrigée, preuve sur N relances à froid.

## Observation complémentaire (front-lead, 2026-10-21, `ed7feca`)
- `test:run` lancé 7 fois : 6 × « 25 fichiers, 234 tests » ; 1 × (3e run) **221 tests, sans aucun échec affiché** — 13 tests non comptés. Non reproduit sur 4 runs suivants.
- Piste : faire échouer `test:run` si le nombre de tests exécutés < nombre attendu ; examiner le démarrage à froid de l'environnement nuxt de Vitest (hookTimeout, cache `.nuxt`).
- **Assigné à** : qa-tester.

## Instruction QA (qa-tester, 2026-10-21, base `ed7feca`)
- **Statut** : garde-fou livré, **cause racine non trouvée** (« je n'y arrive pas »). Ticket laissé ouvert.
- **Mesure** : 469 runs de `vitest run --config vitest.config.ts` (rapport JSON), 17 anomalies dont 3 provoquées par mes propres runs concurrents dans le même dossier. Les 14 autres sont spontanées et groupées dans le temps.
- **Signatures observées** (toutes avec une durée de ~75 s, soit les 60 s figées de Vitest) :
  - `[vitest-pool]: Failed to start forks worker … Timeout waiting for worker to respond` (6 runs) : rangé dans « Unhandled Errors », les fichiers concernés **disparaissent des compteurs** (ex. 24 fichiers / 223 tests au lieu de 26 / 235, `Test Files 23 passed`, aucune ligne « failed » côté tests). C'est le cas « 221 au lieu de 234 ».
  - `Hook timed out in 60000ms` dans `@nuxt/test-utils/dist/runtime/entry.mjs` (4 runs) : 7 fichiers `front` en échec, leurs tests comptés « skipped » (« 7 failed » du rapport).
  - `Test timed out in 5000ms` sur des tests synchrones triviaux (1 run).
  - `Failed to resolve import "#app-manifest"` (2 runs), uniquement quand `.nuxt` est supprimé ou régénéré pendant le run.
- **Éliminé** : charge CPU (20 processus `yes`, load average > 100 : 0 échec sur ~45 runs) ; état froid seul (`.nuxt`, `node_modules/.vite`, `node_modules/.cache` : ≥ 150 runs à froid, 7 échecs) ; touch de fichiers (8 runs, 0 échec) ; deux runs concurrents sans suppression (6 runs, 0 échec) ; `--maxWorkers=4` (n'évite pas l'échec) ; gel global de la machine (un processus témoin indépendant n'a mesuré aucun arrêt pendant un échec).
- **Observé, non démontré** : swap à 6 Go sur 7 Go et load average 8 à 18 pendant les fenêtres d'échec.
- **Garde-fou** : `scripts/test-run.mjs` (`test:run`, `test:front`, `test:release`) compare les fichiers découverts par `vitest list --filesOnly` aux fichiers du rapport JSON ; échec si fichier absent, en échec, sans test, total incohérent ou code de sortie non nul. Aucun nombre en dur. Logique testée dans `tests/unit/test-run.util.test.ts`.
- **Piste restante** : intercepter un run bloqué (`sample` du processus principal) pendant une fenêtre d'échec ; non réussi, aucun blocage capturé sur ~170 runs ultérieurs.

## Point du 2026-10-21 (chef de projet) — ticket **ouvert**

- Le garde-fou `scripts/test-run.mjs` est mergé dans `develop` au commit `2913c81` (branche rebasée `95823da`). Sur `develop` : « 38/38 fichiers exécutés, 389 tests réussis, 1 ignorés, 0 en échec ».
- **Observation** : pendant la vague F-01..F-12, 13 serveurs `nuxt dev` laissés par des agents arrêtés tournaient encore. La suite Playwright échouait alors par délais de navigation dépassés : 6 tests en échec, 40 réussis. Une fois ces serveurs arrêtés, elle est passée à 46/46 en 39 s. Cela conforte la piste de la charge machine (mémoire et processeur), sans **démontrer** la cause des échecs Vitest.
- Enquête en pause (QA-1). Le ticket reste ouvert.
