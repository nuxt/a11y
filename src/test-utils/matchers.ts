import type { ScanResult, MatcherOptions } from './types'
import type { A11yViolation } from '../runtime/types'
import { IMPACT_LEVELS } from '../runtime/constants'
import { formatViolations } from './format'

function isScanResult(value: unknown): value is ScanResult {
  return (
    typeof value === 'object'
    && value !== null
    && 'violations' in value
    && 'violationCount' in value
    && Array.isArray((value as ScanResult).violations)
  )
}

function filterViolations(violations: A11yViolation[], options?: MatcherOptions): A11yViolation[] {
  if (!options) return violations

  let filtered = violations

  if (options.impact) {
    const minIndex = IMPACT_LEVELS.indexOf(options.impact)
    filtered = filtered.filter(v =>
      v.impact !== null && v.impact !== undefined && IMPACT_LEVELS.indexOf(v.impact) <= minIndex,
    )
  }

  if (options.rules) {
    const rules = options.rules
    filtered = filtered.filter(v => rules.includes(v.id))
  }

  if (options.tags) {
    const tags = options.tags
    filtered = filtered.filter(v => v.tags.some(t => tags.includes(t)))
  }

  return filtered
}

/**
 * Vitest custom matcher that asserts a `ScanResult` has no accessibility violations.
 *
 * Accepts optional `MatcherOptions` to filter which violations cause failure.
 *
 * @example
 * ```ts
 * import { runA11yScan } from '@nuxt/a11y/test-utils'
 *
 * const result = await runA11yScan(html)
 * expect(result).toHaveNoA11yViolations()
 * expect(result).toHaveNoA11yViolations({ impact: 'serious' })
 * expect(result).toHaveNoA11yViolations({ rules: ['image-alt'] })
 * ```
 */
export function toHaveNoA11yViolations(received: unknown, options?: MatcherOptions) {
  if (!isScanResult(received)) {
    return {
      pass: false,
      message: () =>
        'Expected a ScanResult from runA11yScan() or runAxeOnPage(), '
        + 'but received a non-ScanResult value. '
        + `Got: ${typeof received === 'string' ? `string "${received.slice(0, 100)}..."` : typeof received}`,
    }
  }

  const filtered = filterViolations(received.violations, options)

  return {
    pass: filtered.length === 0,
    message: () =>
      filtered.length === 0
        ? 'Expected ScanResult to have accessibility violations, but none were found.'
        : formatViolations(filtered),
  }
}
