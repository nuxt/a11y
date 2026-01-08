import { addPlugin, addServerPlugin, defineNuxtModule, createResolver, extendViteConfig } from '@nuxt/kit'
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
  report: {
    enabled: boolean
    output: string
    failOnViolation: boolean
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
    report: {
      enabled: !nuxt.options.dev,
      output: 'a11y-report.md',
      failOnViolation: true,
    },
  }),
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Client-side scanning (dev mode)
    if (options.enabled) {
      addPlugin(resolver.resolve('./runtime/plugins/axe.client'))
      nuxt.options.runtimeConfig.public.axe = options.axe
      nuxt.options.runtimeConfig.public.a11yDefaultHighlight = options.defaultHighlight
      nuxt.options.runtimeConfig.public.a11yLogIssues = options.logIssues

      extendViteConfig((config) => {
        config.optimizeDeps = config.optimizeDeps || {}
        config.optimizeDeps.include = config.optimizeDeps.include || []
        config.optimizeDeps.include.push('@nuxt/a11y > axe-core')
      })

      setupDevToolsUI(options, resolver.resolve, nuxt)
    }

    // Server-side report generation (prerender/generate)
    if (options.report.enabled) {
      nuxt.options.runtimeConfig.a11yReport = options.report
      addServerPlugin(resolver.resolve('./runtime/server/plugins/a11y-report'))
    }
  },
})

declare module '@nuxt/schema' {
  interface PublicRuntimeConfig {
    axe: ModuleOptions['axe']
    a11yDefaultHighlight: boolean
    a11yLogIssues: boolean
  }
  interface RuntimeConfig {
    a11yReport: ModuleOptions['report']
  }
}
