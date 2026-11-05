# T-SEO-01 — Référencement : indexation de la dev, pages privées, métadonnées, sitemap

- **Statut** : À faire. Ouvert le 2026-11-05 par le chef de projet (audit SEO du 2026-11-04, en lecture seule).
- **Pilote** : `frontend-lead` (pages, métadonnées) avec `backend-lead` (routes Nitro).

## Constats de l'audit (preuves citées)
- **[MUST] L'instance de dev est indexable** : `public/robots.txt` autorise tout, et aucun `noindex` ni `X-Robots-Tag` n'existe dans `src/` ni dans `nuxt.config.ts`.
- **[MUST] Les pages admin et d'authentification n'ont pas de `noindex`** (`admin/*.vue`, `connexion.vue`, `profil.vue`, `invitation/[jeton].vue`).
- **[MUST] `siteUrl` vaut `http://localhost:3000` par défaut** (`src/consts/runtime-config.const.ts:5`). Les canoniques, `og:url` et le sitemap en dépendront.
- **[SHOULD]** Aucune meta description, URL canonique, Open Graph ni Twitter card. Pas de `sitemap.xml` (404).

## Périmètre
1. `robots.txt` servi par une route Nitro selon l'environnement : `Disallow: /` hors production. En production, interdire `/admin`, `/connexion`, `/profil`, `/invitation` et `/api/`, et pointer vers le sitemap. Plus `X-Robots-Tag: noindex, nofollow` sur tout environnement non indexable (variable d'environnement, désactivée par défaut).
2. `noindex, nofollow` sur l'admin et les pages de compte (`useSeoMeta` et `routeRules`).
3. Un composable `useSeo` (description, canonique, Open Graph, Twitter) alimenté par des clés i18n, appelé par chaque page publique.
4. `sitemap.xml` en route Nitro : pages publiques livrées, éditions et fiches joueurs.
5. Image de partage 1200×630, à dessiner par l'ui.

## Critères d'acceptation
- [ ] La dev renvoie `Disallow: /` et `X-Robots-Tag: noindex` (curl).
- [ ] Les pages privées portent `noindex`. Chaque page publique a un titre et une description uniques.
- [ ] typecheck, `test:run`, Playwright, release, `/security-review` verts.

## Avancement (2026-11-05)

- **Helper mergé** @ `b69089e` : `NUXT_PUBLIC_SITE_INDEXABLE`, `runtimeConfig.public.siteIndexable` à false par défaut, et `isSiteIndexable` en échec fermé. Vérifications : typecheck vert ; test:run 719 passés, 0 échec ; gitleaks propre. Playwright dérogé par décision de l'utilisateur (rien n'appelle encore ce code).
- **Reste** :
  - les routes `robots.txt` et `sitemap.xml`, le `X-Robots-Tag` et la suppression de `public/robots.txt` (accordée), côté back ;
  - le front de dev-f05 (`useSeo`, noindex des pages privées), à rebaser sur ce merge.
  Le ticket reste ouvert.
