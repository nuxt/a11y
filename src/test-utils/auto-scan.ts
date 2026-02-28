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

  function isExcluded(url: string): boolean {
    return exclude.some(pattern =>
      typeof pattern === 'string' ? url.includes(pattern) : pattern.test(url),
    )
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

      const result = await runA11yScan(html, { route: url })
      results.set(url, result)
    },

    addResult(url: string, result: ScanResult): void {
      if (isExcluded(url))
        return
      results.set(url, result)
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
