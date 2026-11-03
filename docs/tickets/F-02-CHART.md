# F-02-CHART — Palmarès : remettre le graphique d'évolution dans la mesure visuelle

- **Statut** : Ouvert (2026-11-03), ticket de remédiation de la décision utilisateur **F-02-CHART**.
- **Origine** : F-02 est mergé avec le graphique d'évolution `origam-chart` **exclu de la mesure** (seuls l'en-tête de la carte et le bouton « Voir en tableau » sont comparés), **sans contournement local**. `origam-chart` dessine à 600 x 360 unités fixes (`OrigamChartCartesian.vue:683-684`, `:789-790`) alors que la maquette dessine à 820 x 320 unités mises à l'échelle de la largeur : zone de la carte mesurée à 23,2 % (1440 px) et 38,9 % (390 px).
- **Dépend de** : l'évolution Origam « surface de dessin responsive » (le viewBox suit la largeur du conteneur). Issue Origam **#1317** (fiche `docs/tickets/origam/chart-points-focusables-dans-svg-img.md`, `docs/tickets/origam/INDEX.md`).

## Périmètre

1. Quand Origam a livré la version, monter la dépendance Origam puis remettre dans `tests/e2e/visual/F-02.spec.ts` la zone `palmares-evolution` (carte entière : `#rk-p-evo .chart-card` contre `.palmares-evolution__card`), à 1440 et 390 px.
2. Retirer de l'en-tête du spec la phrase qui exclut le tracé.
3. Mesurer chaque zone, relire les images d'écart, et régler par les props et variables d'Origam, jamais par une règle locale.

## Critères d'acceptation

- [ ] Zone `palmares-evolution` à 1 % ou moins, 1440 et 390 px, images d'écart relues, aucun `test.fail`.
- [ ] Le graphique occupe la largeur de la carte, comme la maquette.
- [ ] typecheck à 0, `test:run`, Playwright complet verts ; gitleaks propre.
