import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: ['@nuxt/a11y'],

  devtools: { enabled: true },

  compatibilityDate: '2024-08-21',

  a11y: {},
})
