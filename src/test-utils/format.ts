import type { A11yViolation } from '../runtime/types'

/**
 * Formats an array of accessibility violations into a readable string
 * suitable for test failure messages.
 *
 * Output is grouped by rule, showing impact level, help URL, and affected
 * element selectors. Truncates at 3 nodes per rule.
 *
 * @param violations - Array of violations to format
 * @returns Formatted string describing all violations
 *
 * @example
 * ```ts
 * const result = await runA11yScan(html)
 * if (result.violations.length > 0) {
 *   console.log(formatViolations(result.violations))
 * }
 * ```
 */
export function formatViolations(violations: A11yViolation[]): string {
  if (violations.length === 0) {
    return 'No accessibility violations found.'
  }

  const grouped = groupByRule(violations)
  const lines: string[] = []

  lines.push(`${violations.length} accessibility violation(s) found:\n`)

  for (const [ruleId, ruleViolations] of Object.entries(grouped)) {
    const first = ruleViolations[0]!
    const impact = first.impact || 'unknown'
    const allNodes = ruleViolations.flatMap(v => v.nodes)

    lines.push(`  [${impact}] ${ruleId} (${allNodes.length} element(s))`)
    lines.push(`  ${first.help}`)
    lines.push(`  ${first.helpUrl}`)

    const maxNodes = 3
    for (const node of allNodes.slice(0, maxNodes)) {
      const selector = flattenSelector(node.target)
      lines.push(`    - ${selector}`)
    }
    if (allNodes.length > maxNodes) {
      lines.push(`    ... and ${allNodes.length - maxNodes} more element(s)`)
    }

    lines.push('')
  }

  return lines.join('\n')
}

function flattenSelector(target: (string | string[])[]): string {
  return target.flatMap(t => Array.isArray(t) ? t : [t]).join(' > ')
}

function groupByRule(violations: A11yViolation[]): Record<string, A11yViolation[]> {
  const grouped: Record<string, A11yViolation[]> = {}
  for (const v of violations) {
    (grouped[v.id] ??= []).push(v)
  }
  return grouped
}
