import { CCC_HH_THEMES } from './app/themes/ccc.theme'

const FONTS_URL = 'https://fonts.googleapis.com/css2?family=Bagel+Fat+One&family=Gabarito:wght@400..900&display=swap'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: process.env.E2E !== 'true' },
  modules: ['origam/nuxt', '@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  srcDir: 'src',
  serverDir: 'src/server',
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
      }
    },
    // Surcharge : NUXT_AUTH_LOGIN_RATE_LIMIT_* et NUXT_AUTH_ALLOWED_ORIGINS (liste séparée par des virgules).
    auth: {
      allowedOrigins: '',
      // Secret HMAC du cookie d'appareil (NUXT_AUTH_DEVICE_COOKIE_SECRET), 32 caractères minimum, requis en production.
      deviceCookieSecret: '',
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
