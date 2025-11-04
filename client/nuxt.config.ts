import { resolve } from 'pathe'

export default defineNuxtConfig({
  modules: ['@nuxt/devtools-ui-kit'],

  // WORKAROUND: Use SSR in development for reliable CSS loading, disable in production builds
  ssr: process.env.NODE_ENV === 'production' ? false : true,

  app: {
    baseURL: '/__nuxt-a11y-client',
  },

  nitro: {
    output: {
      publicDir: resolve(__dirname, '../dist/client'),
    },
  },

  vite: {
    base: '/__nuxt-a11y-client/',
  },
})
