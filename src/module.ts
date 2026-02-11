import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { addPlugin, defineNuxtModule, createResolver, extendViteConfig, useLogger } from '@nuxt/kit'
import type { Spec as AxeOptions, RunOptions as AxeRunOptions } from 'axe-core'
import type { A11yViolation } from './runtime/types'
import { formatMarkdownReport, formatConsoleSummary } from './utils/report-formatter'
import { setupDevToolsUI } from './devtools'

const logger = useLogger('a11y')

export interface ModuleOptions {
  enabled: boolean
  defaultHighlight: boolean
  logIssues: boolean
  axe?: {
    options?: AxeOptions
    runOptions?: AxeRunOptions
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

    // Build-time report generation (prerender/generate)
    if (options.report.enabled) {
      const allViolations: A11yViolation[] = []
      let scannedRoutes = 0

      nuxt.hook('nitro:init', async (nitro) => {
        const { runAxeOnHtml } = await import('./utils/axe-server')
        nitro.hooks.hook('prerender:generate', async (route) => {
          if (!route.contents || !route.fileName?.endsWith('.html'))
            return

          scannedRoutes++

          try {
            const violations = await runAxeOnHtml(route.contents, route.route, {
              axeOptions: options.axe?.options,
              runOptions: options.axe?.runOptions,
            })
            allViolations.push(...violations)
          }
          catch (err) {
            logger.warn(`Failed to scan ${route.route}:`, err)
          }
        })
      })

      nuxt.hook('close', async () => {
        if (!scannedRoutes)
          return

        if (!allViolations.length) {
          logger.success(`No accessibility violations found across ${scannedRoutes} routes!`)
          return
        }

        const report = formatMarkdownReport(allViolations, scannedRoutes)
        const output = resolve(nuxt.options.buildDir, options.report.output)

        try {
          await mkdir(dirname(output), { recursive: true })
          await writeFile(output, report, 'utf-8')
        }
        catch (err) {
          logger.error('Failed to write report:', err)
          return
        }

        logger.warn(formatConsoleSummary(allViolations, scannedRoutes))
        logger.info(`Full report: ${output}`)

        if (options.report.failOnViolation)
          process.exitCode = 1
      })
    }
  },
})

declare module '@nuxt/schema' {
  interface PublicRuntimeConfig {
    axe?: ModuleOptions['axe']
    a11yDefaultHighlight: boolean
    a11yLogIssues: boolean
  }
}
