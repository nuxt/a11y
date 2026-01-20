import type { A11yViolation } from '../../../src/runtime/types'

const DIVIDER = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

function extractWcagLevel(tags: string[]): string {
  for (const tag of tags) {
    if (!tag.startsWith('wcag')) continue
    const match = tag.match(/wcag\d+(a{1,3})$/i)
    if (match?.[1]) {
      return match[1].toUpperCase()
    }
  }
  return 'N/A'
}

function formatImpact(impact: string | null | undefined): string {
  if (!impact) return 'UNKNOWN'
  return impact.toUpperCase()
}

function formatSelector(target: (string | string[])[]): string {
  return target.map(t => Array.isArray(t) ? t.join(' > ') : t).join(' > ')
}

function formatViolation(violation: A11yViolation): string {
  const impact = formatImpact(violation.impact)
  const wcagLevel = extractWcagLevel(violation.tags)
  const elementCount = violation.nodes.length

  const lines = [
    `[${impact}] ${violation.id}`,
    violation.description,
    `WCAG: ${wcagLevel} | Elements: ${elementCount}`,
    `Learn more: ${violation.helpUrl}`,
    '',
    'Affected elements:',
  ]

  for (const node of violation.nodes) {
    const selector = formatSelector(node.target)
    lines.push(`  • ${selector}`)
  }

  return lines.join('\n')
}

export function formatViolationsReport(
  violations: A11yViolation[],
  route?: string,
): string {
  const timestamp = new Date().toISOString()
  const routeDisplay = route || 'Unknown'
  const totalCount = violations.length

  const header = [
    'Accessibility Report',
    `Generated: ${timestamp}`,
    `Route: ${routeDisplay}`,
    `Total Issues: ${totalCount}`,
    '',
    DIVIDER,
  ].join('\n')

  if (violations.length === 0) {
    return header
  }

  const formattedViolations = violations
    .map(formatViolation)
    .join(`\n\n${DIVIDER}\n\n`)

  return `${header}\n\n${formattedViolations}`
}
