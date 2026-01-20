import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import { consola } from 'consola'
import type { H3Event } from 'h3'
import type { NuxtRenderHTMLContext } from 'nuxt/app'
import type { NitroApp } from 'nitropack/types'
import { defineNitroPlugin, useRuntimeConfig } from 'nitropack/runtime'

import type { A11yViolation } from '../../types'
import { runAxeOnHtml } from '../utils/axe-server'
import { formatMarkdownReport, getStats } from '../utils/report-formatter'

const logger = consola.withTag('a11y')

const collectedViolations: A11yViolation[] = []
const scannedRoutes = new Set<string>()
let reportWritten = false

function constructHtml(ctx: NuxtRenderHTMLContext): string {
  const htmlAttrs = ctx.htmlAttrs.join(' ')
  const bodyAttrs = ctx.bodyAttrs.join(' ')
  return `<!DOCTYPE html><html ${htmlAttrs}><head>${ctx.head.join('')}</head><body ${bodyAttrs}>${ctx.bodyPrepend.join('')}${ctx.body.join('')}${ctx.bodyAppend.join('')}</body></html>`
}

export default defineNitroPlugin((nitroApp: NitroApp) => {
  if (!import.meta.prerender)
    return

  const config = useRuntimeConfig()
  const reportConfig = config.a11yReport
  if (!reportConfig?.enabled)
    return

  nitroApp.hooks.hook('render:html', async (htmlContext: NuxtRenderHTMLContext, { event }: { event: H3Event }) => {
    const route = event.path
    if (scannedRoutes.has(route))
      return
    scannedRoutes.add(route)

    const html = constructHtml(htmlContext)
    const axeConfig = config.public.axe

    try {
      const violations = await runAxeOnHtml(html, route, { axeOptions: axeConfig?.options, runOptions: axeConfig?.runOptions })
      for (const v of violations) collectedViolations.push(v)
    }
    catch (err) {
      logger.warn(`Failed to scan ${route}:`, err)
    }
  })

  nitroApp.hooks.hook('close', async () => {
    if (reportWritten) return
    reportWritten = true

    // Ensure output path is within .nuxt/ to prevent path traversal
    const baseDir = resolve(process.cwd(), '.nuxt')
    const requestedOutput = reportConfig?.output || 'a11y-report.md'
    const resolved = resolve(baseDir, requestedOutput)
    const rel = relative(baseDir, resolved)
    const isOutsideBase = rel.startsWith('..') || resolve(baseDir, rel) !== resolved
    const output = isOutsideBase ? resolve(baseDir, 'a11y-report.md') : resolved
    const report = formatMarkdownReport(collectedViolations, scannedRoutes)

    try {
      await mkdir(dirname(output), { recursive: true })
      await writeFile(output, report, 'utf-8')
      logger.success(`Report written to ${output}`)

      if (collectedViolations.length > 0) {
        const stats = getStats(collectedViolations)
        logger.warn(`Found ${stats.totalViolations} violations (${stats.byImpact.critical || 0} critical, ${stats.byImpact.serious || 0} serious)`)
        if (reportConfig?.failOnViolation) process.exitCode = 1
      }
      else {
        logger.success('No accessibility violations found!')
      }
    }
    catch (err) {
      logger.error('Failed to write report:', err)
    }
  })
})
