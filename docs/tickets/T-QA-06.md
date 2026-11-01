# T-QA-06 — Capture visuelle instable : joueur-stats @390 (F-04)

- **Statut** : Ouvert (2026-11-01, chef de projet, signalé par le frontend-lead au gate de F-01).
- **Constat** : `tests/e2e/visual/F-04.spec.ts:129`, zone `joueur-stats` @390, à **28,19 %** dans un run Playwright complet (15,2 min, charge ~11). La zone a été capturée à 358×347 au lieu de 358×262 : la mise en page n'était pas stabilisée. Rejouée seule sur le même SHA : 22 verts, 0,000 % @390 et @1440.
- **Cause probable** (à confirmer) : capture avant la fin de l'hydratation ou du chargement réseau.
- **À faire** :
  1. reproduire, ou forcer le cas (ralentir le réseau ou le CPU) ;
  2. stabiliser la capture (attendre la fin du réseau ou de l'hydratation, ou une hauteur stable de la zone) dans le helper commun, pas dans ce seul spec ;
  3. prouver la stabilité : 5 runs complets verts sous charge.
- **Fermeture** : avec le SHA, les 5 runs et la cause établie.
