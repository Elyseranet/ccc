# ds(chart) : points focusables dans un `<svg role="img">` (nested-interactive), viewBox figé à 600 x 360, étiquettes serrées — défauts et demande d'évolution

## Constat

`OrigamChart` (type `line`) pose pour chaque point un `<circle role="button" tabindex="0">`, dans un `<svg role="img">` : axe signale `nested-interactive` (WCAG 4.1.2) sur `.origam-chart-cartesian__svg`, quels que soient les props (`showTooltip`, `animated`, `legendPosition`). Une image ne peut pas contenir de contrôle focusable : un lecteur d'écran n'annonce que l'image, et 52 points (4 courbes x 13 éditions) deviennent 52 arrêts de tabulation.

Deux écarts de mise en page, mesurés dans CCC (F-02, onglet Évolution du Palmarès, 1440 px) :
- le tracé reste à 600 x 360 unités (`preserveAspectRatio="xMidYMid meet"`) quelle que soit la largeur du conteneur : il occupe environ 40 % de la largeur de la carte, centré, alors que la maquette étend le tracé sur toute la largeur (820 x 320 unités, mis à l'échelle). Zone de la carte d'évolution : 32,6 % d'écart de pixels à 1440 px, 30,9 % à 390 px.
- avec deux éditions la même année (« 2012 · 1re », « 2012 · 2e »), les étiquettes de l'axe horizontal se chevauchent.

## Causes (Origam 2.37.3, `node_modules/origam/dist/src/components/Chart/OrigamChartCartesian.vue`)

1. `:87-88` : `role="img"` sur le `<svg>` ; `:189-191` (barres), `:205-208` (points) et `:302-304` (bouton de remise à zéro du zoom) : `tabindex="0"` et `role="button"` sur des enfants de ce `<svg>`.
2. `:683-684` : `SVG_WIDTH = 600`, `SVG_HEIGHT = 360` (constantes), et `:789-790` : la largeur et la hauteur passées au calcul de la mise en page. Aucune prop ni variable ne les change ; `aspectRatio` ne règle que la boîte racine.

## Contournement côté CCC

- Le tableau équivalent (« Voir en tableau ») porte toutes les valeurs, avec légende et en-têtes de colonne.
- Test d'accessibilité : la règle `nested-interactive` est désactivée pour l'onglet Évolution seulement (`tests/e2e/a11y/F-02.spec.ts`), avec renvoi à cette fiche. Dérogation approuvée par l'utilisateur le 2026-11-02 (F-02-AXE), remédiation `docs/tickets/F-02-AXE.md`.
- Mesure visuelle : le tracé est exclu de la comparaison, sans contournement local (F-02-CHART), remédiation `docs/tickets/F-02-CHART.md`.
- Aucune règle CSS locale ne corrige la mise en page du tracé.

## Numéro de l'issue Origam

À renseigner par le team-lead à l'ouverture de l'issue (surface de dessin responsive : le viewBox suit la largeur ; points non focusables dans une image), puis à reporter dans `docs/tickets/origam/INDEX.md`, `docs/tickets/F-02-CHART.md` et `docs/tickets/F-02-AXE.md`.

## Proposition

- Le `<svg>` ne porte pas `role="img"` quand ses points sont focusables (`role="group"` avec un nom), ou les points ne sont focusables que sur demande (prop), la valeur étant déjà fournie par un tableau.
- Lire la largeur et la hauteur du tracé dans la boîte du conteneur (`ResizeObserver`) ou dans des variables (`--origam-chart---width`, `---height`) au lieu de constantes.
- Espacer ou décaler les étiquettes de l'axe horizontal qui se chevauchent.

## Critère d'acceptation

1. Axe (WCAG 2.2 AA) ne signale plus `nested-interactive` sur un graphique en courbes dont les points sont focusables.
2. Dans un conteneur de 1200 px de large, le tracé occupe la largeur du conteneur.
3. Sans réglage, le rendu reste inchangé.

## Version

2.37.3
