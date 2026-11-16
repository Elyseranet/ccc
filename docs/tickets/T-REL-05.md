# T-REL-05 — Livrer les écrans de F-13 (éditions, compétiteurs) dans la garde de release

- **Statut** : En revue (2026-11-16).
- **Constat** (chef de projet) : F-13 est fermé depuis le 2026-11-12, mais ses cinq pages restaient `delivered: false` dans `PAGE_DELIVERY` (garde OPS-3) : 404 en production et groupe « Référentiel » absent de la navigation admin. L'utilisateur ne trouvait pas comment créer une édition. Décision utilisateur du 2026-11-04 : les pages des tickets fermés sont livrées.
- **Fait** : `ADMIN_EDITIONS`, `ADMIN_EDITION_NEW`, `ADMIN_EDITION`, `ADMIN_COMPETITORS`, `ADMIN_COMPETITOR` passent à `delivered: true`. `endpoints` confirmés sur les appels réels : `ADMIN_EDITIONS` n'appelle que `GET /editions` (`useAdminEditions`, `EditionService.adminList` n'est utilisé nulle part), donc `ADMIN_EDITIONS` (endpoint) sort de la page et entre dans `ENDPOINTS_WITHOUT_PAGE` ; `ADMIN_COMPETITORS` n'appelle que `GET /competiteurs` (la fiche n'est chargée que sur `/admin/competiteurs/{id}`).
- **Tests mis à jour** : `tests/nuxt/front/page-delivery.test.ts` (liste des pages livrées), `tests/e2e-release/page-delivery.spec.ts` (la page « non livrée » sondée avec un cookie devient `LEGAL_NOTICE`).
- **Vérifié, inchangé** : `/admin/plus` et `ADMIN_MORE_ITEMS` filtrent déjà par `isPageAccessible` ; ils réapparaissent d'eux-mêmes.
- **Critères** : typecheck, `test:run`, `test:release` verts.
