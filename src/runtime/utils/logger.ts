import type axe from 'axe-core'
import { IMPACT_COLORS } from '../constants'

/**
 * Logs accessibility violations to the console with styled output
 */
export function createLogger() {
  /**
   * Logs a violation to the console with appropriate styling and severity
   */
  function logViolation(violation: axe.Result): void {
    const impact = violation.impact ?? 'moderate'
    const color = IMPACT_COLORS[impact]

    // Detect if running in e2e test environment
    const isE2ETest = typeof navigator !== 'undefined' && (
      navigator.webdriver === true
      // @ts-expect-error - playwright specific
      || !!window.__playwright
    )

    // E2E test environment - log HTML strings for test readability
    // Normal browser - log DOM elements for interactive inspection
    const logData = isE2ETest
      ? violation.nodes
          .filter(i => !i.target?.includes('html'))
          .map(i => i.html)
      : violation.nodes
          .filter(i => !i.target?.includes('html') && i.element)
          .map(i => i.element)

    console[impact === 'critical' ? 'error' : 'warn'](
      `%ca11y%c ${violation.help}\n  ${violation.helpUrl}\n`,
      `color: white; border-radius: 3px; padding: 2px 3px; font-size: 0.8em; background: ${color};`,
      '',
      ...logData,
    )
  }

  return {
    logViolation,
  }
}
