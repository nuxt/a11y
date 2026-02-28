import type axe from 'axe-core'
import type { A11yViolation } from '../runtime/types'

/**
 * Options for running an accessibility scan on an HTML string.
 * Wraps the existing `AxeServerOptions` from `src/utils/axe-server.ts`.
 *
 * @example
 * ```ts
 * const result = await runA11yScan(html, {
 *   axeOptions: { rules: { 'color-contrast': { enabled: false } } },
 *   runOptions: { runOnly: ['wcag2a'] },
 * })
 * ```
 */
export interface ScanOptions {
  /** axe-core configuration options passed to `axe.configure()` */
  axeOptions?: axe.Spec
  /** axe-core runtime options passed to `axe.run()` */
  runOptions?: axe.RunOptions
}

/**
 * The result of an accessibility scan, providing violations and helper methods
 * for filtering them by impact, rule, or tag.
 *
 * @example
 * ```ts
 * // With $fetch (server-side scanning)
 * import { $fetch } from '@nuxt/test-utils'
 * const html = await $fetch<string>('/', { responseType: 'text' })
 * const result = await runA11yScan(html)
 * console.log(result.violationCount)
 *
 * // With mountSuspended (component scanning)
 * import { mountSuspended } from '@nuxt/test-utils/runtime'
 * const wrapper = await mountSuspended(MyComponent)
 * const result = await runA11yScan(wrapper.html())
 * const critical = result.getByImpact('critical')
 * ```
 */
export interface ScanResult {
  /** All violations found during the scan */
  violations: A11yViolation[]
  /** Total number of violations */
  violationCount: number
  /**
   * Filter violations by impact level.
   * @param level - The impact level to filter by
   * @returns Violations matching the given impact level
   */
  getByImpact: (level: NonNullable<axe.ImpactValue>) => A11yViolation[]
  /**
   * Filter violations by axe rule ID.
   * @param ruleId - The rule ID to filter by (e.g., `'image-alt'`)
   * @returns Violations matching the given rule ID
   */
  getByRule: (ruleId: string) => A11yViolation[]
  /**
   * Filter violations by tag.
   * @param tag - The tag to filter by (e.g., `'wcag2a'`, `'wcag2aa'`)
   * @returns Violations matching the given tag
   */
  getByTag: (tag: string) => A11yViolation[]
}

/**
 * Options for the `toHaveNoA11yViolations` Vitest matcher to filter
 * which violations cause the assertion to fail.
 *
 * @example
 * ```ts
 * // Only fail on critical or serious violations
 * expect(result).toHaveNoA11yViolations({ impact: 'serious' })
 *
 * // Only check specific rules
 * expect(result).toHaveNoA11yViolations({ rules: ['image-alt', 'label'] })
 *
 * // Only check WCAG 2.0 Level A
 * expect(result).toHaveNoA11yViolations({ tags: ['wcag2a'] })
 * ```
 */
export interface MatcherOptions {
  /**
   * Minimum impact level to consider a failure.
   * When set, only violations at this level or higher cause the assertion to fail.
   * Severity order: `critical` > `serious` > `moderate` > `minor`.
   */
  impact?: NonNullable<axe.ImpactValue>
  /** Only fail on violations from these specific rule IDs */
  rules?: string[]
  /** Only fail on violations that include at least one of these tags */
  tags?: string[]
}

/**
 * Options for `createAutoScan()` to control multi-route scanning behavior.
 *
 * @example
 * ```ts
 * const autoScan = createAutoScan({
 *   exclude: ['/admin', /^\/api\//],
 *   threshold: 10,
 * })
 * ```
 */
export interface AutoScanOptions {
  /** URL patterns to exclude from scanning (strings use `includes` matching) */
  exclude?: (string | RegExp)[]
  /**
   * Maximum allowed total violation count across all scanned routes.
   * `exceedsThreshold()` returns `true` when this count is exceeded.
   * Defaults to `0` (any violation exceeds the threshold).
   */
  threshold?: number
}

/**
 * Options for `runAxeOnPage()` extending `ScanOptions` with Playwright-specific
 * wait behavior configuration.
 *
 * @example
 * ```ts
 * // Use default networkidle wait
 * const result = await runAxeOnPage(page)
 *
 * // Skip waiting (page already stable)
 * const result = await runAxeOnPage(page, { waitForState: null })
 *
 * // Wait for DOMContentLoaded only
 * const result = await runAxeOnPage(page, { waitForState: 'domcontentloaded' })
 * ```
 */
export interface RunAxeOnPageOptions extends ScanOptions {
  /**
   * Load state to wait for before running the scan.
   * Set to `null` or `false` to skip waiting.
   * @default 'networkidle'
   */
  waitForState?: 'networkidle' | 'load' | 'domcontentloaded' | null | false
}
