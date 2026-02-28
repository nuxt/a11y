/**
 * Auto-registers the `toHaveNoA11yViolations` Vitest matcher globally.
 *
 * Add this file to your Vitest `setupFiles` so the matcher is available
 * on all `expect()` calls without manual registration.
 *
 * @example
 * ```ts
 * // vitest.config.ts
 * export default defineConfig({
 *   test: {
 *     setupFiles: ['@nuxt/a11y/test-utils/setup'],
 *   },
 * })
 * ```
 *
 * @example
 * ```ts
 * // In your test file — no manual registration needed:
 * import { $fetch } from '@nuxt/test-utils'
 * import { runA11yScan } from '@nuxt/a11y/test-utils'
 *
 * const html = await $fetch<string>('/', { responseType: 'text' })
 * const result = await runA11yScan(html)
 * expect(result).toHaveNoA11yViolations()
 * ```
 * @module
 */
import type { MatcherOptions } from './types'
import { expect } from 'vitest'
import { toHaveNoA11yViolations } from './matchers'

expect.extend({ toHaveNoA11yViolations })

declare module 'vitest' {
  interface Assertion<T> {
    /**
     * Assert that a `ScanResult` has no accessibility violations.
     *
     * @param options - Optional filters for impact level, rules, or tags
     *
     * @example
     * ```ts
     * import { runA11yScan } from '@nuxt/a11y/test-utils'
     *
     * const result = await runA11yScan(html)
     * expect(result).toHaveNoA11yViolations()
     * expect(result).toHaveNoA11yViolations({ impact: 'serious' })
     * ```
     */
    toHaveNoA11yViolations: (options?: MatcherOptions) => T
  }
}
