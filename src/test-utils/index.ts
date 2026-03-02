import type { A11yViolation } from '../runtime/types'
import type { ScanOptions, ScanResult } from './types'
import { runAxeOnHtml } from '../utils/axe-server'

export { runAxeOnHtml } from '../utils/axe-server'
export { createAutoScan } from './auto-scan'
export { formatViolations } from './format'
export { toHaveNoA11yViolations } from './matchers'
export type { ScanOptions, ScanResult, MatcherOptions, AutoScanOptions, RunAxeOnPageOptions, ObservePageOptions } from './types'
export type { A11yViolation, A11yViolationNode } from '../runtime/types'

/**
 * Create a `ScanResult` from an array of violations.
 *
 * Used internally by `runA11yScan` and `runAxeOnPage` to wrap raw violation
 * arrays with helper methods. Can also be used directly for advanced use cases.
 *
 * @param violations - Array of accessibility violations
 * @returns A `ScanResult` with violation data and filter methods
 *
 * @example
 * ```ts
 * import { createScanResult } from '@nuxt/a11y/test-utils'
 *
 * const result = createScanResult(myViolations)
 * const critical = result.getByImpact('critical')
 * ```
 */
export function createScanResult(violations: A11yViolation[]): ScanResult {
  return {
    violations,
    violationCount: violations.length,
    getByImpact: level => violations.filter(v => v.impact === level),
    getByRule: ruleId => violations.filter(v => v.id === ruleId),
    getByTag: tag => violations.filter(v => v.tags.includes(tag)),
  }
}

/**
 * Scan an HTML string for accessibility violations using axe-core.
 *
 * Wraps `runAxeOnHtml()` and returns a rich `ScanResult` object with
 * helper methods for filtering violations.
 *
 * @param html - The HTML string to scan
 * @param options - Optional scan options including route identifier and axe-core configuration
 * @returns A `ScanResult` with violations and filter methods
 *
 * @example
 * ```ts
 * import { $fetch } from '@nuxt/test-utils'
 * import { runA11yScan } from '@nuxt/a11y/test-utils'
 *
 * const html = await $fetch<string>('/', { responseType: 'text' })
 * const result = await runA11yScan(html, { route: '/' })
 *
 * console.log(result.violationCount)
 * const critical = result.getByImpact('critical')
 * ```
 */
export async function runA11yScan(html: string, options?: ScanOptions): Promise<ScanResult> {
  const violations = await runAxeOnHtml(html, options?.route ?? 'unknown', options)
  return createScanResult(violations)
}
