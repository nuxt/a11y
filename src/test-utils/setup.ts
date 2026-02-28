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
