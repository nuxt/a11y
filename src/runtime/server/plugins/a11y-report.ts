import type { H3Event } from 'h3'
import type { NuxtRenderHTMLContext } from 'nuxt/app'
import type { NitroApp } from 'nitropack/types'
import { defineNitroPlugin, useRuntimeConfig, useStorage } from 'nitropack/runtime'

import type { A11yViolation } from '../../types'
import { runAxeOnHtml } from '../utils/axe-server'

const collectedViolations: A11yViolation[] = []
const scannedRoutes = new Set<string>()

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
      collectedViolations.push(...violations)
    }
    catch (err) {
      console.warn(`[a11y] Failed to scan ${route}:`, err)
    }
  })

  nitroApp.hooks.hook('close', async () => {
    await useStorage('a11y').setItem('violations', collectedViolations)
  })
})
