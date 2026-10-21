# T-QA-02 — Des tests front échouent quand des variables `NUXT_DATABASE_*` sont présentes dans l'environnement

- **Statut** : À faire. Ouvert le 2026-10-21 par le chef de projet, à partir du rapport final de dev-b10 sur B-10 (`7f1169b`).
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
