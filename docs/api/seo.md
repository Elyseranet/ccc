# Référencement : `robots.txt`, `sitemap.xml`, `X-Robots-Tag` (T-SEO-01)

Routes Nitro hors `/api/v1` (`src/server/routes/`). Publiques, sans session. Indexation pilotée à l'exécution par `NUXT_PUBLIC_SITE_INDEXABLE` (faux par défaut, échec fermé : `isSiteIndexable`) ; l'origine des URL est `NUXT_PUBLIC_SITE_URL`.

| Route | Site non indexable | Site indexable |
|---|---|---|
| `GET /robots.txt` (`text/plain`) | 200 : `User-agent: *` + `Disallow: /` | 200 : `Disallow` sur `/admin`, `/connexion`, `/profil`, `/invitation`, `/api/` et `Sitemap: <siteUrl>/sitemap.xml` |
| `GET /sitemap.xml` (`application/xml`) | 404 | 200 : pages publiques livrées, une URL par édition (`/editions/{code}`) et par joueur (`/joueurs/{id}`) |

- Le sitemap exclut les pages privées et légales (`SEO_PRIVATE_ROUTE_PATTERNS`) et les pages non livrées (`PAGE_DELIVERY`). URL absolues, échappées en XML. Limité en débit comme les lectures publiques (429 `RATE_LIMIT`).
- `X-Robots-Tag: noindex, nofollow` sur **toute** réponse quand le site n'est pas indexable (middleware `30.site-indexable.ts`). Les pages privées et légales le portent aussi quand il l'est (`routeRules`, `nuxt.config.ts`).
- Journal : `sitemap_served` (`requestId`, `urls`).
- Code : `src/utils/seo.util.ts` (`buildRobotsTxt`, `buildSitemapPaths`, `buildSitemapXml`), `src/consts/seo.const.ts`, `listEditionCodes`, `listCompetitorIds`.
