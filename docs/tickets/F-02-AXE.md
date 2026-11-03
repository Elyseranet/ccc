# F-02-AXE — Palmarès : remettre la règle axe `nested-interactive` sur l'onglet Évolution

- **Statut** : Ouvert (2026-11-03), ticket de remédiation de la dérogation **F-02-AXE**.
- **Origine** : `origam-chart` pose des points `role="button" tabindex="0"` dans un `<svg role="img">` (`OrigamChartCartesian.vue:87, 205-208`) : axe signale `nested-interactive` (WCAG 4.1.2), sans réglage possible. **Dérogation approuvée par l'utilisateur le 2026-11-02**, **sur l'onglet Évolution seulement** : `tests/e2e/a11y/F-02.spec.ts` désactive cette seule règle pour cet onglet (`disableRules`), nulle part ailleurs. Le tableau équivalent (« Voir en tableau ») porte toutes les valeurs.
- **Dépend de** : la correction Origam (points non focusables dans une image, ou `role="group"` nommé). Numéro de l'issue : à renseigner par le team-lead dès son ouverture (fiche `docs/tickets/origam/chart-points-focusables-dans-svg-img.md`, `docs/tickets/origam/INDEX.md`).

## Périmètre

1. Quand Origam a livré la correction, monter la dépendance Origam, puis retirer `CHART_NESTED_INTERACTIVE` et le `disableRules` de `tests/e2e/a11y/F-02.spec.ts`.
2. Vérifier à la main le clavier sur l'onglet Évolution (tabulation, activation d'un point).

## Critères d'acceptation

- [ ] L'onglet Évolution passe axe (WCAG 2.2 AA) sans aucune règle désactivée.
- [ ] Le test ne porte plus aucune dérogation ; la dérogation F-02-AXE est levée dans `decisions.md`.
- [ ] typecheck à 0, `test:run`, Playwright complet verts.
