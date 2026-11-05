# T-QA-06 — Capture visuelle instable : joueur-stats @390 (F-04)

- **Statut** : **Fermé** le 2026-11-05 par le chef de projet. Cause non établie, échec non reproductible : 5 passes mesurées vertes sur 5 (décision utilisateur 6434362). Le correctif de stabilisation `9817d77` est sur develop. Ouvert le 2026-11-01, signalé par le frontend-lead au gate de F-01.
- **Constat** : `tests/e2e/visual/F-04.spec.ts:129`, zone `joueur-stats` @390, à **28,19 %** dans un run Playwright complet (15,2 min, charge ~11). La zone a été capturée à 358×347 au lieu de 358×262 : la mise en page n'était pas stabilisée. Rejouée seule sur le même SHA : 22 verts, 0,000 % @390 et @1440.
- **Cause probable** (à confirmer) : capture avant la fin de l'hydratation ou du chargement réseau.
- **À faire** :
  1. reproduire, ou forcer le cas (ralentir le réseau ou le CPU) ;
  2. stabiliser la capture (attendre la fin du réseau ou de l'hydratation, ou une hauteur stable de la zone) dans le helper commun, pas dans ce seul spec ;
  3. prouver la stabilité : 5 runs complets verts sous charge.
- **Fermeture** : avec le SHA, les 5 runs et la cause établie.

## Point du 2026-11-04 (chef de projet) — mergé, ticket laissé ouvert
- `feature/T-QA-06` @ `ec4fbd0` squashé dans `develop` @ `9817d77` (`tests/e2e/visual.util.ts` seul). Le helper commun attend l'hydratation et une mise en page stable avant de mesurer et de capturer. Validé par le frontend-lead.
- **Reste pour fermer** : verser ici les 5 runs complets sous charge (date, SHA, compteurs, charge) et la cause établie. Je ne les ai pas encore : le ticket reste ouvert jusqu'à leur réception.

## Décision utilisateur du 2026-11-04 et preuves déjà acquises (chef de projet)
- **Correctif** (`tests/e2e/visual.util.ts`) : `settle()` attend la fin de l'hydratation Nuxt (`useNuxtApp().isHydrating === false`), puis une mise en page stable (même `scrollWidth × scrollHeight` sur 5 images consécutives, 5 s au plus), avant et après l'injection du style de capture. `box()` relit la zone jusqu'à deux mesures identiques à deux images d'écart (20 essais au plus).
- **5 runs de dev-f04**, le 2026-11-01, Playwright complet `--workers=1`, base `ccc_f04_test`, develop `b47d439` plus le helper : 231 passés à chaque run (fins à 22:53:26, 23:01:46, 23:09:29, 23:17:11 et 23:25:02, de 7,7 à 8,7 min), 0 échec, 0 instable. 130 zones aux ratios et tailles identiques d'un run à l'autre, toutes ≤ 1 %. `joueur-stats @390` : 358×262 et 0,000 % aux 5 runs. **Charge non relevée.**
- **Run de revue du frontend-lead**, le 2026-11-02 de 08:36:43 à 08:48:42, SHA `97318e3` (helper identique), charge 19,0 / 10,2 / 5,9 au départ : Playwright 239 passés, 0 échec.
- **Cause : non établie.** L'échec d'origine (358×347, 28,19 %) n'a jamais été reproduit. Hypothèse retenue : mesure ou capture pendant un décalage de mise en page après l'hydratation.
- **Décision utilisateur (2026-11-04)** : refaire **5 runs complets avec la charge relevée**, puis fermer en écrivant explicitement « cause non établie, échec non reproductible ». Le critère de cause est levé par cette décision. Les runs Playwright complets des gates sur un SHA qui contient `9817d77` comptent s'ils relèvent la charge.

## Runs mesurés (décision utilisateur du 2026-11-04)
| # | Date et heure | SHA | Résultat | `joueur-stats` @390 | Charge (1 min) |
|---|---|---|---|---|---|
| 1 | 2026-11-04, 09:48:26 à 09:56:26 (8,1 min) | `98d4931` (T-REL-02, contient `9817d77`) | 239 passés, 0 échec, 0 instable, 0 ignoré | 358×262, 0,000 % (@1440 : 1248×186, 0,000 %) | 15,17 au départ, 15,17 au plus, 6,35 à la fin (17 relevés toutes les 30 s). En parallèle : vérifications T-REL-02 de dev-f06 (test:run, test:release, Docker) et rendus de l'ui |
| 2 | 2026-11-04, 09:58:44 à 10:06:14 (7,7 min) | `650e4ca` (B-11, contient `9817d77`) | 239 passés, 0 échec, 0 instable, 0 ignoré | 358×262, 0,000 % | 3,35 au départ, 4,45 au plus, 2,39 à la fin (16 relevés). 130/130 zones identiques au run 1 (ratio et taille) |
| 3 | 2026-11-04, 15:16:32 à 15:24:32 (8,1 min) | `2b3b93d` (T-REL-02, contient `9817d77`) | 239 passés, 0 échec, 0 instable, 0 ignoré | 358×262, 0,000 % | 8,93 au départ, 8,93 au plus, 5,85 à la fin (17 relevés). En parallèle : Playwright F-09 de dev-f04 |
| 4 | 2026-11-04, 20:26:33 à 20:36:03 (9,5 min) | `aeb855b` (F-10, contient `9817d77`) | 281 passés, 0 échec, 0 instable, 0 ignoré | 358×262, 0,000 % | 7,97 au départ, 10,67 au plus, 5,06 à la fin (20 relevés) |
| 5 | 2026-11-05, 09:23:48 à 09:32:49 (9,0 min) | `39c94c1` (T-SEC-08-r3, contient `9817d77`) | 239 passés, 0 échec, 0 instable, 0 ignoré | 358×262, 0,000 % | 7,85 au départ, 21,88 au plus, 8,49 à la fin (19 relevés ; vitest d'i18n-dashboard en parallèle) |


## Fermeture (2026-11-05)

- **Mesures** : 5 passes complètes sur 5 vertes, `joueur-stats @390` capturée à 358×262 et 0,000 % à chaque fois. La charge machine maximale allait de 4,45 à 21,88 selon les passes. Les données de chaque passe sont dans le tableau ci-dessus ; la passe 5 a été relevée par le frontend-lead.
- **Conclusion** : la cause n'est pas établie et l'échec du 2026-11-01 ne s'est pas reproduit, même à une charge double. Le ticket est fermé selon la décision utilisateur 6434362. Si la zone redevient instable, ouvrir un nouveau ticket qui renvoie à celui-ci.
