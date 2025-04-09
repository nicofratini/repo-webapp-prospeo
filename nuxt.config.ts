// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: false },
  modules: [
    '@nuxtjs/supabase',
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    'nuxt-icon'
  ],
  css: ['~/assets/css/tailwind.css'],
  nitro: {
    compressPublicAssets: true,
    routeRules: {
      '/**': {
        cors: true,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      }
    }
  },
  runtimeConfig: {
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY
    }
  },
  app: {
    baseURL: '/',
    buildAssetsDir: '/_nuxt/',
    cdnURL: '',
    head: {
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  },
  vite: {
    server: {
      hmr: {
        protocol: 'ws',
        host: '0.0.0.0',
        port: 3000,
        clientPort: 3000
      }
    }
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY,
    redirectOptions: {
      login: '/auth/login',
      callback: '/dashboard',
      exclude: ['/auth/*']
    }
  },
  ssr: true,
  devServer: {
    port: 3000,
    host: '0.0.0.0'
  }
})