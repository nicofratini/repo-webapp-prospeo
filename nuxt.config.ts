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
  supabase: {
    redirect: true,
    redirectOptions: {
      login: '/auth/login',
      callback: '/auth/confirm',
      exclude: [],
    },
    cookieOptions: {
      name: 'sb-auth',
      lifetime: 60 * 60 * 24 * 30, // Increased to 30 days
      domain: '',
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    },
    clientOptions: {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'sb-auth-token',
        storage: process.client ? window.localStorage : undefined
      }
    }
  },
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
      supabaseUrl: process.env.SUPABASE_URL || '',
      supabaseKey: process.env.SUPABASE_KEY || ''
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
        host: '0.0.0.0'
      }
    }
  },
  // Enable SSR for better development experience
  ssr: true,
  // Configure dev server
  devServer: {
    port: 3000,
    host: '0.0.0.0'
  }
})