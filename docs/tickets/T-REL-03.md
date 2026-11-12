# T-REL-03 — e2e de release rouges sur develop : accueil « sans palmarès » obsolète, unicité des métadonnées SEO

- **Statut** : **Fermé** (2026-11-12), mergé dans develop @ `3d0719c5` (branche @ `4c3ab0b6` = code `96bd8e5a` + doc). Preuves : release complète sur `96bd8e5a` (build de production, seed routes 13 passés, base `ccc_dev_trel03_test`, port 3982) : **50 passés, 0 échoué** (dev-f08). Cause de seo.spec:84 mesurée : `seen` est un tableau propre à chaque worker et la config release est `fullyParallel` ; rejouée seule, la spec d'origine reçoit 1 page au lieu de 5. Correctif : bloc en `mode: 'serial'`, assertions inchangées (`toHaveLength(PUBLIC_PAGES.length)`), `/palmares` ajoutée. Spec `home-sans-palmares.visual.spec.ts` supprimée (décision utilisateur). Sur le merge, le chef de projet a relancé typecheck (vert) et test:run (904 réussis, 1 ignoré). Le Playwright principal n'a pas été relancé : aucun fichier de son périmètre ne change, hormis un commentaire dans `tests/e2e/helpers/home-visual.ts`. Lève l'exception de merge de F-08. Reste : l'état `?sans-palmares` de la maquette d'accueil, suivi dans [F-29](F-29.md).
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


## Résultat (dev-f08, 96bd8e5a sur b4cc9932)

- **Spec supprimée** : `tests/e2e-release/home-sans-palmares.visual.spec.ts` (décision utilisateur du 2026-11-12) ; le commentaire de `tests/e2e/helpers/home-visual.ts` qui la citait est corrigé. Les helpers restent (utilisés par F-01 et F-08).
- **Cause de seo.spec:84, mesurée** : la spec d'origine (b4cc9932) rejouée seule sur le build : `expect(seen).toHaveLength(5)` reçoit 1 (`/regles` seul). Le tableau `seen` est une variable de processus et `playwright.release.config.ts` est en `fullyParallel: true` : chaque test de page peut tourner dans un autre worker. Les titres et descriptions relevés sur le build sont uniques pour les 6 pages (/, /regles, /joueurs, /joueurs/face-a-face, /palmares, /editions/2025) : le défaut n'est pas dans les métadonnées. Correctif : `test.describe.configure({ mode: 'serial' })` sur ce bloc, assertions inchangées ; `ROUTES.HALL_OF_FAME` ajouté à `PUBLIC_PAGES`.
- **Release** : build OK, projet routes 13 passés, `playwright.release.config.ts` 50 passés, 0 échoué (base ccc_dev_trel03_test, port 3982).
- **Suite pour ui-designer** (non supprimé, accord de l'utilisateur requis) : l'état `?sans-palmares` de `docs/design/ui/happy-hour/index.html` (ligne 98) et la ligne « Accueil · Palmarès non livré » de `mapping.md` n'ont plus de spec qui les utilise.
