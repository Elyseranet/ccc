import { CCC_HH_THEMES } from './src/themes/ccc.theme'
import { clientBundleGuard, isServerOnlyModule } from './src/utils/client-bundle-guard.util'
import { DEFAULT_MAIL_FROM, DEFAULT_MAIL_HOST, DEFAULT_MAIL_TRANSPORT, DEFAULT_SITE_URL } from './src/consts/runtime-config.const'

const FONTS_URL = 'https://fonts.googleapis.com/css2?family=Bagel+Fat+One&family=Gabarito:wght@400..900&display=swap'

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
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: FONTS_URL }
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
    '/admin/draws': { redirect: { to: '/admin/tirages', statusCode: 301 } }
  },
  runtimeConfig: {
    // PROD-1 : garde-fou de configuration de production (NUXT_STRICT_RUNTIME_CONFIG), faux par défaut, posé à vrai par l'image
    // (Dockerfile, étage runner). Indépendant de NODE_ENV : le build des tests d'API est aussi un build de production.
    strictRuntimeConfig: false,
    database: {
      host: '',
      port: 5432,
      username: '',
      password: '',
      database: ''
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
      siteUrl: DEFAULT_SITE_URL
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
