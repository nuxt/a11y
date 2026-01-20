import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { addPlugin, addServerPlugin, defineNuxtModule, createResolver, extendViteConfig, useLogger } from '@nuxt/kit'
import type { Spec as AxeOptions, RunOptions as AxeRunOptions } from 'axe-core'
import type { A11yViolation } from './runtime/types'
import { formatMarkdownReport, getStats } from './runtime/server/utils/report-formatter'
import { setupDevToolsUI } from './devtools'

const logger = useLogger('a11y')

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

      const storageBase = resolve(nuxt.options.buildDir, '.a11y-storage')

      nuxt.hook('nitro:config', (nitroConfig) => {
        nitroConfig.storage = nitroConfig.storage || {}
        nitroConfig.storage['a11y'] = { driver: 'fs', base: storageBase }
      })

      nuxt.hook('nitro:init', (nitro) => {
        nitro.hooks.hook('prerender:done', async () => {
          const violations = await nitro.storage.getItem<A11yViolation[]>('a11y:violations') || []

          if (!violations.length) {
            logger.success('No accessibility violations found!')
            return
          }

          const report = formatMarkdownReport(violations)
          const output = resolve(nuxt.options.buildDir, options.report.output)

          try {
            await mkdir(dirname(output), { recursive: true })
            await writeFile(output, report, 'utf-8')
          }
          catch (err) {
            logger.error('Failed to write report:', err)
            return
          }

          const stats = getStats(violations)
          logger.warn(`Found ${stats.totalViolations} violations (${stats.byImpact.critical || 0} critical, ${stats.byImpact.serious || 0} serious)`)
          logger.info(`Full report: ${output}`)

          if (options.report.failOnViolation)
            process.exitCode = 1
        })
      })
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
