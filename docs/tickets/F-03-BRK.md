# F-03-BRK — Migrer le tableau des phases finales vers origam-bracket

- **Statut** : Ouvert (2026-10-28). Décision utilisateur F-03-BRK (`docs/design/ux/decisions.md`).
- **2026-11-12 — débloqué par décision utilisateur F-03-BRK bis** : migration **immédiate**, écart à la maquette accepté, sans attendre Elyseranet/origam#1282 (ouverte ; origam 2.37.42 ne change rien au bracket, fichiers comparés). Étapes 1 et 3 inchangées ; l'étape 2 devient « réduire l'écart par le thème autant que possible », la référence visuelle de la zone tableau devient le rendu `origam-bracket` validé. L'objectif < 1 % reviendra quand #1282 sera livrée.
- **Était bloqué par** : l'évolution Origam qui rend réglables en variables la largeur de tour, la hauteur minimale et l'alignement du titre de tour (fiche `docs/tickets/origam/`, numéro au merge de F-03b).
- **À faire** quand Origam livre :
  1. remplacer le tableau maison de F-03b par `origam-bracket` (variante `single-elimination`, `showScores`, slot `connector` avec `<g />` selon FA-11, slot `competitor`) ;
  2. régler l'écart par le thème (props d'abord) jusqu'à repasser sous 1 % aux deux largeurs ;
  3. conserver l'alternative en liste et les exigences d'accessibilité de F-03b.
- **Référence** : la mesure de dev-f06 sur `wip/F-03b-origam-bracket` (adf07fa) donne 23,2 % à 1440 et 41,0 % à 390.

- **2026-11-12 — référence visuelle** (décision utilisateur) : capture de référence Playwright du rendu validé, relue par un humain, versionnée ; régénérée seulement pour un changement voulu. Plan front-lead : 1 dev (dev-f11 après le merge de F-11), Origam 2.37.4.

- **2026-11-12 — surfaces du tableau** : `origam-bracket` restreint ses surfaces `border` et `rounded` (`bracket.interface.d.ts`, Origam #1013). Constaté sur les captures de référence : les props `border`, `borderColor`, `rounded` et `bgColor` du thème agissent sur le fond et le contour des cartes de match (retirées toutes les quatre, les cartes deviennent plus sombres ; la prop responsable n'a pas été isolée), mais pas sur le cadre ni le fond du tableau entier. Elles sont donc conservées. Écart à la maquette accepté par F-03-BRK bis.
- **Risque connu (captures de référence)** : `bracket-1440.png` et `bracket-390.png` (`tests/e2e/__screenshots__/visual/F-03b.spec.ts/`) sont reproductibles sur la machine de dev (deux générations identiques octet pour octet), mais pas prouvées entre machines (polices chargées en ligne). Si le run de la PR vers main (T-REL-04) diffère, on régénère délibérément (commit dédié), jamais en relevant un seuil.
