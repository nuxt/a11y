import { resolve } from 'pathe'

export default defineNuxtConfig({
  modules: ['@nuxt/devtools-ui-kit'],

  ssr: false,

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
    server: {
      hmr: {
        protocol: 'ws',
        host: 'localhost',
        port: 3030,
        clientPort: 3030,
      },
    },
  },
})
