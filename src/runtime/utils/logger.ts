import type axe from 'axe-core'
import { useRuntimeConfig } from '#app'
import { IMPACT_COLORS } from '../constants'

/**
 * Logs accessibility violations to the console with styled output
 */
export function createLogger() {
  /**
   * Logs a violation to the console with appropriate styling and severity
   */
  function logViolation(violation: axe.Result): void {
    const config = useRuntimeConfig()

    // Skip logging if disabled
    if (!config.public.a11yLogIssues) {
      return
    }

    const elements = violation.nodes
      .filter(i => !i.target?.includes('html') && i.element)
      .map(i => i.element)

    const impact = violation.impact ?? 'moderate'
    const color = IMPACT_COLORS[impact]

    console[impact === 'critical' ? 'error' : 'warn'](
      `%ca11y%c ${violation.help}\n  ${violation.helpUrl}\n`,
      `color: white; border-radius: 3px; padding: 2px 3px; font-size: 0.8em; background: ${color};`,
      '',
      ...elements,
    )
  }

  return {
    logViolation,
  }
}
