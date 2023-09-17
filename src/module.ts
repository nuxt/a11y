import { addPlugin, defineNuxtModule, createResolver } from '@nuxt/kit'
import { Spec as AxeOptions, RunOptions as AxeRunOptions } from 'axe-core'

export interface ModuleOptions {
  enabled: boolean
  axe: {
    options: AxeOptions
    runOptions: AxeRunOptions
  }
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@nuxt/a11y',
    configKey: 'a11y'
  },
  defaults: nuxt => ({
    enabled: nuxt.options.dev,
    axe: {
      options: {},
      runOptions: {}
    }
  }),
  setup (options, nuxt) {
    if (!options.enabled) return

    const resolver = createResolver(import.meta.url)

    addPlugin(resolver.resolve('./runtime/plugins/axe.client'))
    nuxt.options.runtimeConfig.public.axe = options.axe
  }
})

declare module '@nuxt/schema' {
  interface PublicRuntimeConfig {
    axe: ModuleOptions['axe']
  }
}
