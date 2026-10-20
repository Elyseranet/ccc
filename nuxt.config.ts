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
    rateLimit: {
      windowMs: 60000,
      maxRequests: 60
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
    tsConfig: {
      compilerOptions: {
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        useDefineForClassFields: false
      }
    }
  }
})
