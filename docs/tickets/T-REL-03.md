# T-REL-03 — e2e de release rouges sur develop : accueil « sans palmarès » obsolète, unicité des métadonnées SEO

- **Statut** : À faire. Décision utilisateur du 2026-11-12 : supprimer `home-sans-palmares.visual.spec.ts` (sans objet depuis la livraison de `/palmares`, F-02). Reste à établir la cause de l'échec de seo.spec:84. Ce ticket porte aussi l'exception de merge de F-08 (`c9d2704a`).
- **Historique** : À faire. Ouvert le 2026-11-12 par `frontend-lead`, constaté pendant les vérifications de `feature/F-08-delivered`.
- **Pilote proposé** : `frontend-lead`.

## Constat

Sur develop 854f249f, build de production (`npm run build`), base amorcée par le projet Playwright `routes`, `E2E_ADMIN_SESSION` fourni, `playwright.release.config.ts` : **52 passés, 6 échoués**. Les mêmes 6 échouent sur `feature/F-08-delivered` (53 passés, le test de livraison de `/admin/matchs` en plus).

1. `tests/e2e-release/home-sans-palmares.visual.spec.ts` (5 zones : hero @390, tuiles classement, matchs et face-à-face @1440, classement @390). La spec compare l'accueil à la maquette `index.html?sans-palmares`, c'est-à-dire l'accueil **tant que `/palmares` n'est pas livré** (T-REL-02, ab1a6b4). F-02 a livré `/palmares` (merge d2f97631) : l'accueil de production affiche maintenant les liens vers le palmarès, donc la spec n'a plus d'objet.
2. `tests/e2e-release/seo.spec.ts:84` « titres et descriptions sont uniques d'une page à l'autre » : la cause n'est pas encore établie. Suspects : `PUBLIC_PAGES` (avec `/palmares`), et les pages qui partagent une même clé `seo.*`.

## À faire

1. Spec « sans palmarès » : la supprimer (elle n'a plus d'objet depuis la livraison de F-02) ou la convertir en contrôle de l'accueil avec palmarès. **Toute suppression de fichier demande l'accord de l'utilisateur.**
2. `seo.spec.ts:84` : établir la cause par une mesure (titres et descriptions relevés page par page), corriger, et vérifier.
3. Release verte sur develop, avec la commande du constat.
