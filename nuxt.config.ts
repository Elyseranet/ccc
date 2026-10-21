// https://nuxt.com/docs/api/configuration/nuxt-config
import { CCC_DARK_THEME } from './app/themes/ccc.theme'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['origam/nuxt'],
  css: ['~/assets/css/main.css'],
  origam: {
    themes: [CCC_DARK_THEME],
    defaultTheme: 'ccc',
    defaultMode: 'dark',
    autoImport: false
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
    }
  }
})
