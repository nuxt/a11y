import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import type { Page } from 'playwright-core'
import type axe from 'axe-core'
import type { A11yViolation, A11yViolationNode } from '../runtime/types'
import type { ObservePageOptions, RunAxeOnPageOptions, ScanResult } from './types'
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

function mapRawViolations(rawViolations: RawAxeViolation[]): A11yViolation[] {
  return rawViolations.map(v => ({
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
 * import { injectAxe } from '@nuxt/a11y/test-utils/browser'
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
 * import { runAxeOnPage } from '@nuxt/a11y/test-utils/browser'
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

    let attempts = 0
    while (w.axe._running) {
      if (++attempts > 100) throw new Error('axe-core still running after 10 s')
      await new Promise(r => setTimeout(r, 100))
    }

    if (spec) w.axe.configure(spec)
    return w.axe.run(document, run || {}).then((results: any) => results.violations)
  }, { axeOptions: axeOptions || null, runOptions: runOptions || null })
  /* eslint-enable @typescript-eslint/no-explicit-any */

  return createScanResult(mapRawViolations(rawViolations))
}

/**
 * Start continuous accessibility scanning on a Playwright page using a
 * MutationObserver. After DOM mutations settle (debounced), axe-core runs
 * automatically and reports violations via the `onViolations` callback.
 *
 * Skips mutations from the initial page load to avoid duplicating the
 * scan already performed by `runAxeOnPage` in the `goto` wrapper.
 *
 * @param page - A Playwright `Page` instance
 * @param onViolations - Called with the current page URL and a `ScanResult` whenever new violations are found
 * @param options - Observer configuration
 * @returns A function to stop observing
 *
 * @example
 * ```ts
 * import { observePage } from '@nuxt/a11y/test-utils/browser'
 *
 * const stop = await observePage(page, (url, result) => {
 *   console.log(`${result.violationCount} violations on ${url}`)
 * })
 *
 * // ... interact with the page ...
 *
 * await stop()
 * ```
 */
export async function observePage(
  page: Page,
  onViolations: (url: string, result: ScanResult) => void,
  options: ObservePageOptions = {},
): Promise<() => Promise<void>> {
  const { debounceMs = 500, axeOptions, runOptions } = options

  await page.exposeFunction('__nuxtA11yOnViolations__', (rawViolations: RawAxeViolation[]) => {
    try {
      const url = page.url()
      const result = createScanResult(mapRawViolations(rawViolations))
      onViolations(url, result)
    }
    catch {
      // swallow — must not break tests
    }
  })

  const source = getAxeSource()
  await page.addInitScript(source)

  const observerScript = buildObserverScript(debounceMs, axeOptions, runOptions)
  await page.addInitScript(observerScript)

  try {
    await injectAxe(page)
    await page.evaluate(observerScript)
  }
  catch {
    // page may not be navigated yet
  }

  return async () => {
    try {
      await page.evaluate(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const w = window as Record<string, any>
        if (typeof w.__nuxtA11yStopObserving__ === 'function') {
          w.__nuxtA11yStopObserving__()
        }
      })
    }
    catch {
      // page may already be closed
    }
  }
}

function buildObserverScript(
  debounceMs: number,
  axeOptions?: axe.Spec,
  runOptions?: axe.RunOptions,
): string {
  const axeConfigStr = axeOptions ? JSON.stringify(axeOptions) : 'null'
  const runOptionsStr = runOptions ? JSON.stringify(runOptions) : '{}'

  return `(function() {
    if (window.__nuxtA11yObserver__) return;

    var DEBOUNCE_MS = ${debounceMs};
    var timer = null;
    var scanning = false;
    var skipInitial = true;
    var runRetries = 0;

    function runScan() {
      if (scanning) return;
      if (typeof window.axe === 'undefined') return;
      if (window.axe._running) {
        if (++runRetries < 100) timer = setTimeout(runScan, 100);
        return;
      }
      runRetries = 0;
      scanning = true;
      Promise.resolve().then(function() {
        var config = ${axeConfigStr};
        if (config) window.axe.configure(config);
        return window.axe.run(document, ${runOptionsStr});
      }).then(function(results) {
        if (results.violations && results.violations.length > 0) {
          var mapped = results.violations.map(function(v) {
            return {
              id: v.id,
              impact: v.impact,
              help: v.help,
              helpUrl: v.helpUrl,
              description: v.description,
              tags: v.tags,
              nodes: v.nodes.map(function(n) {
                return { target: n.target, html: n.html, failureSummary: n.failureSummary };
              })
            };
          });
          if (typeof window.__nuxtA11yOnViolations__ === 'function') {
            window.__nuxtA11yOnViolations__(mapped);
          }
        }
      }).catch(function() {}).finally(function() {
        scanning = false;
      });
    }

    var observer = new MutationObserver(function() {
      if (skipInitial) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(runScan, DEBOUNCE_MS);
    });

    if (document.documentElement) {
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
      });
    }

    setTimeout(function() { skipInitial = false; }, DEBOUNCE_MS + 100);

    window.__nuxtA11yObserver__ = observer;
    window.__nuxtA11yStopObserving__ = function() {
      observer.disconnect();
      if (timer) clearTimeout(timer);
      window.__nuxtA11yObserver__ = null;
    };
  })();`
}
