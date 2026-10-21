# T-QA-02 — Des tests front échouent quand des variables `NUXT_DATABASE_*` sont présentes dans l'environnement

- **Statut** : À faire. Ouvert le 2026-10-21 par le chef de projet, à partir du rapport final de dev-b10 sur B-10 (`7f1169b`).
- **Constat, non reproduit par le chef de projet** : avec les variables `NUXT_DATABASE_*` dans l'environnement, `npm run test:run` fait échouer 10 tests de `tests/nuxt/front`, sans lien avec B-10. Sans ces variables, la suite est verte (43 fichiers, 440 tests).
- **Risque** : la suite front dépend de l'environnement, et non du seul code. Un job CI ou un build qui expose ces variables (Coolify par exemple) pourrait échouer sans régression réelle. À l'inverse, une isolation incomplète pourrait masquer une vraie régression.
- **À faire** :
  - reproduire le constat ;
  - nommer les 10 tests en échec et en établir la cause (runtimeConfig lue au montage ? mode fixture désactivé ?) ;
  - isoler l'environnement Vitest du projet `front`, par exemple en neutralisant les `NUXT_DATABASE_*` dans sa config.
- **Fermeture** : `NUXT_DATABASE_HOST=x … npm run test:run` est vert, avec la sortie réelle à l'appui, et un test garde-fou empêche la régression.
