# T-SEC-13 — Vulnérabilités moderate en production via typeorm (glob, minimatch)

- **Statut** : Ouvert (2026-11-01, chef de projet, signalé par dev-f06 dans F-03c).
- **Constat** (mesuré sur develop f924eda, `npm audit --omit=dev`) : **3 moderate**, 0 high, 0 critical.
  - `glob` 3.0.0 – 14.0.1 (GHSA-3g3m-2fjr-6pw4) et `minimatch` < 11.0.1 (GHSA-g3hv-75wg-m249, déni de service), tous deux sous `node_modules/typeorm/node_modules/` ;
  - `typeorm@0.3.31` est installé.
- **Origine** : la base d'avis a évolué. Le lockfile n'a pas changé. `--omit=dev` était à 0 jusqu'au 2026-10-28.
- **Seuil de la politique** : zéro high et zéro critical, donc **respecté**. Pas de blocage de merge.
- **Correctif proposé par npm** : `npm audit fix --force`, qui monte typeorm vers une version majeure (1.x), avec **rupture de compatibilité**. À ne pas lancer tel quel.
- **À faire** :
  1. établir si le code de CCC atteint ces chemins (glob et minimatch servent au chargement d'entités ou de migrations par motif) et si l'exposition réelle existe ;
  2. évaluer la montée vers typeorm 1.x (notes de version, migrations, entités, DataSource), ou une surcharge `overrides` de glob et minimatch compatible avec typeorm 0.3 ;
  3. si une option implique une montée majeure ou un choix d'exploitation, la remonter au chef de projet pour arbitrage utilisateur.
- **Critère de fermeture** : `npm audit --omit=dev` à 0, ou exposition nulle prouvée et waiver documenté et approuvé.
