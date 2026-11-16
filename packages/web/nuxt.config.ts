import { CCC_HH_THEMES } from './src/themes/ccc.theme'
import { clientBundleGuard, isServerOnlyModule } from './src/utils/client-bundle-guard.util'
import { DATABASE_RUNTIME_CONNECTION_TIMEOUT_MS, DATABASE_RUNTIME_QUERY_TIMEOUT_MS, DATABASE_RUNTIME_STATEMENT_TIMEOUT_MS } from './src/consts/database-config.const'
import { DEFAULT_MAIL_FROM, DEFAULT_MAIL_HOST, DEFAULT_MAIL_TRANSPORT, DEFAULT_SITE_INDEXABLE, DEFAULT_SITE_URL } from './src/consts/runtime-config.const'
import { SEO_PRIVATE_ROUTE_PATTERNS, SEO_ROBOTS_NOINDEX } from './src/consts/seo.const'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: process.env.E2E !== 'true' },
  modules: ['origam/nuxt', '@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  srcDir: 'src',
  serverDir: 'src/server',
  // T-ARCH-01 (ARCH-1) : `src/utils/` mêle utils navigateur et serveur. Aucun scan d'auto-import
  // (ni côté app, ni côté Nitro) : chaque fichier importe explicitement ce qu'il utilise, un util
  // serveur ne peut donc pas entrer dans le bundle navigateur par un auto-import.
  imports: { scan: false },
  hooks: {
    // T-ARCH-01 (ARCH-2) : un service fusionné exporte sa classe navigateur et ses fonctions serveur. Côté client,
    // les modules serveur sont déclarés sans effet de bord : inutilisés, ils sont élagués avec les fonctions
    // serveur ; utilisés par erreur, `clientBundleGuard` fait échouer le build.
    'vite:extendConfig' (config, { isClient }) {
      if (!isClient) {
        return
      }
      const target = config as { build?: Record<string, unknown>, plugins?: unknown[] }
      const build = (target.build ??= {})
      const rolldownOptions = (build.rolldownOptions ??= {}) as Record<string, unknown>
      rolldownOptions.treeshake = { moduleSideEffects: (id: string) => !isServerOnlyModule(id) }
      target.plugins = [...(target.plugins ?? []), clientBundleGuard()]
    }
  },
  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      link: [
        { rel: 'preload', href: '/gabarito-latin.woff2', as: 'font', type: 'font/woff2', crossorigin: '' },
        { rel: 'preload', href: '/bagel-fat-one-latin.woff2', as: 'font', type: 'font/woff2', crossorigin: '' },
        { rel: 'stylesheet', href: '/fonts.css' }
      ]
    }
  },
  origam: {
    themes: CCC_HH_THEMES,
    defaultTheme: 'ccc',
    modes: ['dark'],
    defaultMode: 'dark',
    locale: { locale: 'fr', fallbackLocale: 'en' },
    autoImport: false
  },
  routeRules: {
    '/hall-of-fame': { redirect: { to: '/palmares', statusCode: 301 } },
    '/competition': { redirect: { to: '/editions', statusCode: 301 } },
    '/players': { redirect: { to: '/joueurs', statusCode: 301 } },
    '/head-to-head': { redirect: { to: '/joueurs/face-a-face', statusCode: 301 } },
    '/rules': { redirect: { to: '/regles', statusCode: 301 } },
    '/variants': { redirect: { to: '/regles#variantes', statusCode: 301 } },
    '/admin/scores': { redirect: { to: '/admin/matchs', statusCode: 301 } },
    '/admin/groups': { redirect: { to: '/admin/matchs', statusCode: 301 } },
    '/admin/draws': { redirect: { to: '/admin/tirages', statusCode: 301 } },
    // Politique de référent (F-10, revue de sécurité M1) : ailleurs, seule l'origine part vers un site tiers ; sur le lien d'invitation, dont le
    // jeton est dans le chemin, jamais rien (la page charge des polices de Google), et la réponse ne se met pas en cache.
    '/**': { headers: { 'referrer-policy': 'strict-origin-when-cross-origin' } },
    // Pages privées (T-SEO-01) : jamais indexées, aucun lien suivi, quelle que soit la variable d'indexation du site. L'en-tête double la meta `robots` de `useSeo`.
    ...Object.fromEntries(SEO_PRIVATE_ROUTE_PATTERNS.map(pattern => [pattern, { headers: { 'x-robots-tag': SEO_ROBOTS_NOINDEX } }])),
    '/invitation/**': { headers: { 'x-robots-tag': SEO_ROBOTS_NOINDEX, 'referrer-policy': 'no-referrer', 'cache-control': 'no-store' } }
  },
  runtimeConfig: {
    // Version déployée (T-OPS-03), SHA du commit : NUXT_APP_VERSION, posée par le Dockerfile depuis l'argument de build.
    // Vide par défaut : /api/v1/health répond alors `version: null`, jamais une valeur inventée.
    appVersion: '',
    // PROD-1 : garde-fou de configuration de production (NUXT_STRICT_RUNTIME_CONFIG), faux par défaut, posé à vrai par l'image
    // (Dockerfile, étage runner). Indépendant de NODE_ENV : le build des tests d'API est aussi un build de production.
    strictRuntimeConfig: false,
    // Nombre de reverse proxys de confiance devant le serveur (NUXT_TRUST_PROXY_HOPS, 0 à 5). 0 par défaut : l'IP
    // client est celle de la socket et X-Forwarded-For est ignoré. Derrière Coolify (proxy devant le conteneur), à
    // poser au nombre de proxys réellement traversés, sinon tous les clients partagent l'IP du proxy pour les limites de débit.
    trustProxyHops: 0,
    database: {
      host: '',
      port: 5432,
      username: '',
      password: '',
      database: '',
      // T-SEC-17 : délais en millisecondes (0 = aucun). NUXT_DATABASE_CONNECTION_TIMEOUT_MS, _STATEMENT_TIMEOUT_MS, _QUERY_TIMEOUT_MS.
      connectionTimeoutMs: DATABASE_RUNTIME_CONNECTION_TIMEOUT_MS,
      statementTimeoutMs: DATABASE_RUNTIME_STATEMENT_TIMEOUT_MS,
      queryTimeoutMs: DATABASE_RUNTIME_QUERY_TIMEOUT_MS
    },
    cache: {
      closedEditionMaxAgeSeconds: 3600
    },
    rateLimit: {
      windowMs: 60000,
      maxRequests: 60,
      maxKeys: 10000,
      // Recherche publique ?q= (décision E-e) : plus stricte que le défaut.
      competitorsSearch: {
        windowMs: 60000,
        maxRequests: 30
      },
      // Budget unique partagé par toutes les routes publiques en lecture (M3) : généreux, car le soir
      // du tournoi le public est souvent derrière une seule IP (wifi du lieu).
      publicRead: {
        windowMs: 60000,
        maxRequests: 300
      },
      // Routes publiques portant un jeton d'invitation (GET et POST partagent le budget) : freine le devinage.
      invitationToken: {
        windowMs: 900000,
        maxRequests: 30
      },
      // Envois d'avatar (B-16) : sharp décode et ré-encode, ce qui coûte du CPU. 10 envois par 10 minutes et
      // par IP laissent largement la place à un administrateur qui photographie une soirée d'inscriptions
      // (une photo par participant), et bornent le coût d'un client qui boucle.
      avatarUpload: {
        windowMs: 600000,
        maxRequests: 10
      }
    },
    // Envoi d'email (A3, B-09). Surcharge : NUXT_MAIL_HOST, NUXT_MAIL_PORT, NUXT_MAIL_SECURE, NUXT_MAIL_USER,
    // NUXT_MAIL_PASSWORD, NUXT_MAIL_FROM. Valeurs par défaut = Mailpit local (SMTP 1025, sans authentification).
    // `transport: 'capture'` (NUXT_MAIL_TRANSPORT) est réservé aux tests d'API : il écrit dans `captureFile`.
    mail: {
      transport: DEFAULT_MAIL_TRANSPORT,
      host: DEFAULT_MAIL_HOST,
      port: 1025,
      secure: false,
      user: '',
      password: '',
      from: DEFAULT_MAIL_FROM,
      captureFile: ''
    },
    public: {
      // URL publique du site (NUXT_PUBLIC_SITE_URL) : base des liens d'invitation, jamais déduite de l'en-tête Host.
      siteUrl: DEFAULT_SITE_URL,
      // Image de partage Open Graph et Twitter (NUXT_PUBLIC_SITE_OG_IMAGE : chemin ou URL absolue). Vide tant que l'image 1200 x 630 n'est pas dessinée (T-SEO-01).
      siteOgImage: '',
      // Indexation par les moteurs (NUXT_PUBLIC_SITE_INDEXABLE, T-SEO-01) : faux par défaut, seule la production la pose à `true`.
      siteIndexable: DEFAULT_SITE_INDEXABLE
    },
    // Surcharge : NUXT_AUTH_LOGIN_RATE_LIMIT_* et NUXT_AUTH_ALLOWED_ORIGINS (liste séparée par des virgules).
    auth: {
      allowedOrigins: '',
      // Secret HMAC du cookie d'appareil (NUXT_AUTH_DEVICE_COOKIE_SECRET), 32 caractères minimum, requis en production.
      deviceCookieSecret: '',
      // Cookies Secure + préfixe __Host- (NUXT_AUTH_SECURE_COOKIE). Vrai par défaut ; `false` seulement en développement local en HTTP.
      secureCookie: true,
      // Calculs scrypt simultanés (NUXT_AUTH_PASSWORD_HASH_CONCURRENCY) ; au-delà : 503 SERVICE_BUSY + Retry-After.
      passwordHashConcurrency: 2,
      loginRateLimit: {
        windowMs: 900000,
        maxIpAttempts: 20,
        maxKeys: 10000
      }
    }
  },
  nitro: {
    compressPublicAssets: true,
    // T-OPS-03 : la liste des migrations livrées avec le build (noms de fichiers) est embarquée dans le serveur, pour que
    // /api/v1/health compte celles qui manquent dans la table de suivi. Le serveur ne charge pas les migrations lui-même.
    serverAssets: [{ baseName: 'migrations', dir: './src/server/db/migrations' }],
    // Les entités TypeORM utilisent des décorateurs « experimental » ; esbuild ne lit pas
    // typescript.tsConfig. esbuild ne gère pas emitDecoratorMetadata : chaque @Column doit
    // donc déclarer son `type` explicitement.
    esbuild: {
      options: {
        tsconfigRaw: {
          compilerOptions: {
            experimentalDecorators: true,
            useDefineForClassFields: false
          }
        }
      }
    }
  },
  typescript: {
    // Décorateurs TypeORM : requis par le projet serveur et par le projet app (les types de
    // routes Nitro générés pour `$fetch` importent les handlers, donc les entités). Posés sur
    // `tsConfig` (global), ils n'atteignaient que partiellement les projets shared et node
    // (TS5052 sous nuxi typecheck).
    appTsConfig: {
      compilerOptions: {
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        useDefineForClassFields: false
      }
    },
    serverTsConfig: {
      compilerOptions: {
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        useDefineForClassFields: false
      }
    },
    sharedTsConfig: {
      compilerOptions: {
        experimentalDecorators: true
      }
    },
    nodeTsConfig: {
      compilerOptions: {
        experimentalDecorators: true
      }
    }
  }
})
