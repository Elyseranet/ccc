# T-QA-02 — Des tests front échouent quand des variables `NUXT_DATABASE_*` sont présentes dans l'environnement

- **Statut** : **Fermé** (2026-10-21), invalidé par la mesure ; voir « Fermeture ». Ouvert Ouvert le 2026-10-21 par le chef de projet, à partir du rapport final de dev-b10 sur B-10 (`7f1169b`).
- **Constat, non reproduit par le chef de projet** : avec les variables `NUXT_DATABASE_*` dans l'environnement, `npm run test:run` fait échouer 10 tests de `tests/nuxt/front`, sans lien avec B-10. Sans ces variables, la suite est verte (43 fichiers, 440 tests).
- **Risque** : la suite front dépend de l'environnement, et non du seul code. Un job CI ou un build qui expose ces variables (Coolify par exemple) pourrait échouer sans régression réelle. À l'inverse, une isolation incomplète pourrait masquer une vraie régression.
- **À faire** :
  - reproduire le constat ;
  - nommer les 10 tests en échec et en établir la cause (runtimeConfig lue au montage ? mode fixture désactivé ?) ;
  - isoler l'environnement Vitest du projet `front`, par exemple en neutralisant les `NUXT_DATABASE_*` dans sa config.
- **Fermeture** : `NUXT_DATABASE_HOST=x … npm run test:run` est vert, avec la sortie réelle à l'appui, et un test garde-fou empêche la régression.

## Point du 2026-10-21 (front-lead, relayé par le chef de projet) — **non reproduit**
- Le front-lead a lancé 3 fois les tests front (14 fichiers), chaque fois verts : 106 tests réussis et 1 ignoré.
  1. Sur `develop`, avec des `NUXT_DATABASE_*` factices.
  2. Sur `develop`, avec les vraies valeurs passées en ligne de commande, sans copier le `.env`.
  3. Sur `feature/B-10` @ `7f1169b`, avec les vraies valeurs.
- Encore inconnus : la commande exacte de dev-b10 (suite complète ou ciblée), la liste des 10 tests en échec et la charge de la machine à ce moment-là. Si la machine était saturée, les échecs relèvent probablement de T-QA-01 (délais de démarrage de l'environnement Nuxt), mais ce n'est **pas démontré**.
- Le ticket reste ouvert et passe en priorité basse. Il sera fermé, preuve à l'appui, si une suite complète `test:run` lancée avec ces variables sur une machine au repos est verte.
- **Chef de projet, 2026-10-21 22:06** : j'ai lancé la suite complète `npm run test:run` sur `develop` @ `752cf34`, avec les 5 variables `NUXT_DATABASE_*` factices (load average 24). Résultat : « 41/41 fichiers exécutés, 410 tests réussis, 1 ignorés, 0 en échec ». **Non reproduit sur la suite complète.** La branche B-10, qui compte 43 fichiers, n'a pas été testée ici avec la suite complète.

## Fermeture — 2026-10-21 (chef de projet)
- **L'hypothèse « variables `NUXT_DATABASE_*` » est invalidée par la mesure :**
  - sur `develop`, la suite complète passe avec ces variables : 41/41 fichiers, 410 tests (chef de projet) ;
  - sur `feature/B-10`, la suite complète passe avec ces variables : 43 fichiers, 440 tests, en 13 s, lancée à 22:06 avec un load average de 24,6 (dev-b10, sortie dans le scratchpad `rerun.txt`) ;
  - les tests front passent 3 fois sur 3 (front-lead).
- **Ce que dev-b10 avait observé :** le lancement d'origine (vers 17:58, sous une forte charge machine, load mesuré à 75 à 17:56) affichait `Test Files 10 failed | 32 passed | 1 skipped (43)` et `Tests 351 passed | 81 skipped`. Il s'agissait d'échecs de **suite** `|front|`, sans aucun test nommé. C'est la signature décrite dans [T-QA-01](T-QA-01.md) (environnement Nuxt qui ne démarre pas sous charge), et cette mesure y est reportée.
- Aucun correctif n'est nécessaire au titre de T-QA-02.
