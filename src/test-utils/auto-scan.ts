import type { AutoScanOptions, ScanResult } from './types'
import { runA11yScan } from './index'

/**
 * Create a multi-route auto-scan utility that accumulates accessibility
 * scan results across multiple pages and supports threshold-based failure.
 *
 * @param options - Configuration for route exclusion and violation threshold
 * @returns An object with methods to scan HTML, retrieve results, and check thresholds
 *
 * @example
 * ```ts
 * import { $fetch } from '@nuxt/test-utils'
 * import { createAutoScan } from '@nuxt/a11y/test-utils'
 *
 * const autoScan = createAutoScan({ threshold: 10, exclude: ['/admin'] })
 *
 * for (const route of ['/', '/about', '/contact']) {
 *   const html = await $fetch<string>(route, { responseType: 'text' })
 *   await autoScan.scanFetchedHtml(route, html)
 * }
 *
 * const results = autoScan.getResults()
 * if (autoScan.exceedsThreshold()) {
 *   console.error('Too many accessibility violations!')
 * }
 * ```
 */
export function createAutoScan(options: AutoScanOptions = {}) {
  const { exclude = [], threshold = 0 } = options
  const results = new Map<string, ScanResult>()

  function normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url, 'http://nuxt-a11y.local')
      return `${parsed.pathname}${parsed.search}`
    }
    catch {
      return url
    }
  }

  function isExcluded(url: string): boolean {
    const normalizedUrl = normalizeUrl(url)
    return exclude.some(pattern =>
      typeof pattern === 'string' ? normalizedUrl.includes(pattern) : pattern.test(normalizedUrl),
    )
  }

  function mergeResult(url: string, result: ScanResult): void {
    const key = normalizeUrl(url)
    const existing = results.get(key)
    if (!existing) {
      results.set(key, result)
      return
    }

    results.set(key, {
      ...result,
      violations: [...existing.violations, ...result.violations],
      violationCount: existing.violationCount + result.violationCount,
      getByImpact: level => [...existing.violations, ...result.violations].filter(v => v.impact === level),
      getByRule: ruleId => [...existing.violations, ...result.violations].filter(v => v.id === ruleId),
      getByTag: tag => [...existing.violations, ...result.violations].filter(v => v.tags.includes(tag)),
    })
  }

  return {
    /**
     * Scan fetched HTML for a given URL and accumulate results.
     * Excluded URLs are silently skipped.
     *
     * @param url - The route URL being scanned
     * @param html - The HTML content to scan
     */
    async scanFetchedHtml(url: string, html: string): Promise<void> {
      if (isExcluded(url))
        return

      const normalizedUrl = normalizeUrl(url)
      const result = await runA11yScan(html, { route: normalizedUrl })
      mergeResult(normalizedUrl, result)
    },

    addResult(url: string, result: ScanResult): void {
      if (isExcluded(url))
        return
      mergeResult(url, result)
    },

    /**
     * Get all accumulated scan results keyed by URL.
     *
     * @returns A record mapping URLs to their scan results
     */
    getResults(): Record<string, ScanResult> {
      return Object.fromEntries(results)
    },

    /**
     * Check if the total violation count exceeds the configured threshold.
     *
     * @returns `true` if total violations exceed the threshold, `false` otherwise
     */
    exceedsThreshold(): boolean {
      let total = 0
      for (const result of results.values()) {
        total += result.violationCount
      }
      return total > threshold
    },
  }
}
