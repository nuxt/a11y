import { resolve } from 'pathe'

export default defineNuxtConfig({
  ssr: false,

  modules: [
    '@nuxt/devtools-ui-kit',
  ],

  devtools: {
    enabled: false,
  },

  nitro: {
    output: {
      publicDir: resolve(__dirname, '../dist/client'),
    },
  },

  app: {
    baseURL: '/__a11y__',
  },

  vite: {
    server: {
      hmr: {
        clientPort: +(process.env.PORT || 3300),
      },
    },
  },

  compatibilityDate: '2024-08-21',
})
