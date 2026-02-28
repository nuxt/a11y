import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import type { Page } from 'playwright-core'
import type axe from 'axe-core'
import type { A11yViolation, A11yViolationNode } from '../runtime/types'
import type { RunAxeOnPageOptions, ScanResult } from './types'
import { createScanResult } from './index'

const require = createRequire(import.meta.url)

interface RawAxeNode {
  target: axe.NodeResult['target']
  html: string
  failureSummary: string | undefined
}

interface RawAxeViolation {
  id: string
  impact: axe.ImpactValue | undefined
  help: string
  helpUrl: string
  description: string
  tags: axe.TagValue[]
  nodes: RawAxeNode[]
}

let axeSource: string | null = null

function getAxeSource(): string {
  if (!axeSource) {
    const axePath = require.resolve('axe-core/axe.min.js')
    axeSource = readFileSync(axePath, 'utf-8')
  }
  return axeSource
}

/**
 * Inject the axe-core library into a Playwright page context.
 *
 * Reads `axe-core/axe.min.js` from `node_modules` at runtime and evaluates it
 * in the page. Safe to call multiple times — subsequent calls are no-ops if
 * axe is already present on the page.
 *
 * @param page - A Playwright `Page` instance (compatible with `NuxtPage` from `@nuxt/test-utils`)
 *
 * @example
 * ```ts
 * import { createPage } from '@nuxt/test-utils'
 * import { injectAxe } from '@nuxt/a11y/test-utils/playwright'
 *
 * const page = await createPage('/')
 * await injectAxe(page)
 * ```
 */
export async function injectAxe(page: Page): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const alreadyInjected = await page.evaluate(() => typeof (window as Record<string, any>).axe !== 'undefined')
  if (alreadyInjected) return

  const source = getAxeSource()
  await page.evaluate(source)
}

/**
 * Run an accessibility scan on a Playwright page using axe-core.
 *
 * Automatically injects axe-core if not already present, waits for the
 * configured load state (defaults to `'networkidle'`), then runs `axe.run()`
 * in the browser and maps the results to a `ScanResult`.
 *
 * @param page - A Playwright `Page` instance (compatible with `NuxtPage` from `@nuxt/test-utils`)
 * @param options - Optional scan options including axe-core config and wait behavior
 * @returns A `ScanResult` with violations and filter methods
 *
 * @example
 * ```ts
 * import { createPage } from '@nuxt/test-utils'
 * import { runAxeOnPage } from '@nuxt/a11y/test-utils/playwright'
 *
 * const page = await createPage('/')
 * const result = await runAxeOnPage(page)
 * expect(result.violationCount).toBe(0)
 *
 * // Skip waiting (page already stable)
 * const result2 = await runAxeOnPage(page, { waitForState: null })
 * ```
 */
export async function runAxeOnPage(page: Page, options: RunAxeOnPageOptions = {}): Promise<ScanResult> {
  const { waitForState = 'networkidle', axeOptions, runOptions } = options

  if (waitForState) {
    await page.waitForLoadState(waitForState)
  }

  await injectAxe(page)

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const rawViolations: RawAxeViolation[] = await page.evaluate(async ({ axeOptions: spec, runOptions: run }) => {
    const w = window as Record<string, any>

    while (w.axe._running) {
      await new Promise(r => setTimeout(r, 100))
    }

    if (spec) w.axe.configure(spec)
    return w.axe.run(document, run || {}).then((results: any) => results.violations)
  }, { axeOptions: axeOptions || null, runOptions: runOptions || null })
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const violations: A11yViolation[] = rawViolations.map(v => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    helpUrl: v.helpUrl,
    description: v.description,
    tags: v.tags,
    timestamp: Date.now(),
    nodes: v.nodes.map((n): A11yViolationNode => ({
      target: n.target,
      html: n.html,
      failureSummary: n.failureSummary,
    })),
  }))

  return createScanResult(violations)
}
