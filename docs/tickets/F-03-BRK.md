# F-03-BRK — Migrer le tableau des phases finales vers origam-bracket

- **Statut** : Ouvert (2026-10-28). Décision utilisateur F-03-BRK (`docs/design/ux/decisions.md`).
- **Bloqué par** : l'évolution Origam qui rend réglables en variables la largeur de tour, la hauteur minimale et l'alignement du titre de tour (fiche `docs/tickets/origam/`, numéro au merge de F-03b).
- **À faire** quand Origam livre :
  1. remplacer le tableau maison de F-03b par `origam-bracket` (variante `single-elimination`, `showScores`, slot `connector` avec `<g />` selon FA-11, slot `competitor`) ;
  2. régler l'écart par le thème (props d'abord) jusqu'à repasser sous 1 % aux deux largeurs ;
  3. conserver l'alternative en liste et les exigences d'accessibilité de F-03b.
- **Référence** : la mesure de dev-f06 sur `wip/F-03b-origam-bracket` (adf07fa) donne 23,2 % à 1440 et 41,0 % à 390.
