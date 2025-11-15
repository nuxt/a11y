import { addPlugin, defineNuxtModule, createResolver, extendViteConfig } from '@nuxt/kit'
import type { Spec as AxeOptions, RunOptions as AxeRunOptions } from 'axe-core'
import { setupDevToolsUI } from './devtools'

export interface ModuleOptions {
  enabled: boolean
  defaultHighlight: boolean
  logIssues: boolean
  axe: {
    options: AxeOptions
    runOptions: AxeRunOptions
  }
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@nuxt/a11y',
    configKey: 'a11y',
  },
  defaults: nuxt => ({
    enabled: nuxt.options.dev,
    defaultHighlight: false,
    logIssues: true,
    axe: {
      options: {},
      runOptions: {},
    },
  }),
  setup(options, nuxt) {
    if (!options.enabled) return

    const resolver = createResolver(import.meta.url)

    addPlugin(resolver.resolve('./runtime/plugins/axe.client'))
    nuxt.options.runtimeConfig.public.axe = options.axe
    nuxt.options.runtimeConfig.public.a11yDefaultHighlight = options.defaultHighlight
    nuxt.options.runtimeConfig.public.a11yLogIssues = options.logIssues

    extendViteConfig((config) => {
      config.optimizeDeps = config.optimizeDeps || {}
      config.optimizeDeps.include = config.optimizeDeps.include || []
      config.optimizeDeps.include.push('axe-core')
    })

    setupDevToolsUI(options, resolver.resolve, nuxt)
  },
})

declare module '@nuxt/schema' {
  interface PublicRuntimeConfig {
    axe: ModuleOptions['axe']
    a11yDefaultHighlight: boolean
    a11yLogIssues: boolean
  }
}
