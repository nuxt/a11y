import type { A11yViolation } from '../runtime/types'

export interface ReportStats {
  totalViolations: number
  byImpact: Record<string, number>
}

export function formatMarkdownReport(violations: A11yViolation[], scannedRoutes: number): string {
  const stats = getStats(violations)
  const grouped = groupByImpact(violations)
  const lines: string[] = []

  lines.push('# Accessibility Report\n')
  lines.push(`Generated: ${new Date().toISOString().split('T')[0]}`)
  lines.push(`Routes scanned: ${scannedRoutes}`)
  lines.push(`Total violations: ${stats.totalViolations}\n`)

  if (violations.length === 0) {
    lines.push('No accessibility violations found!')
    return lines.join('\n')
  }

  for (const impact of ['critical', 'serious', 'moderate', 'minor', 'unknown'] as const) {
    const items = grouped[impact]
    if (!items?.length)
      continue

    lines.push(`## ${impact.charAt(0).toUpperCase() + impact.slice(1)} (${items.length})\n`)

    const byRule = groupByRule(items)
    for (const [ruleId, ruleViolations] of Object.entries(byRule)) {
      const first = ruleViolations[0]!
      const routes = [...new Set(ruleViolations.map(v => v.route).filter(Boolean))].join(', ')

      lines.push(`### ${ruleId}`)
      lines.push(`**${first.help}** | Routes: ${routes || 'unknown'}\n`)

      const allNodes = ruleViolations.flatMap(v => v.nodes)
      lines.push('Elements:')
      for (const node of allNodes.slice(0, 10)) {
        const selector = node.target.flatMap(t => Array.isArray(t) ? t : [t]).join(' > ')
        lines.push(`- \`${selector}\` - ${node.failureSummary?.split('\n')[0] || 'No details'}`)
      }
      if (allNodes.length > 10)
        lines.push(`- ... and ${allNodes.length - 10} more elements`)

      lines.push(`\n[More info](${first.helpUrl})\n`)
    }
  }

  return lines.join('\n')
}

export function getStats(violations: A11yViolation[]): ReportStats {
  const byImpact: Record<string, number> = {}

  for (const v of violations) {
    byImpact[v.impact || 'unknown'] = (byImpact[v.impact || 'unknown'] || 0) + 1
  }

  return { totalViolations: violations.length, byImpact }
}

function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  const grouped: Record<string, T[]> = {}
  for (const item of items) (grouped[keyFn(item)] ??= []).push(item)
  return grouped
}

export function formatConsoleSummary(violations: A11yViolation[], scannedRoutes: number): string {
  const stats = getStats(violations)
  const byRule = groupByRule(violations)
  const lines: string[] = []

  lines.push(`${stats.totalViolations} violations across ${scannedRoutes} routes (${stats.byImpact.critical || 0} critical, ${stats.byImpact.serious || 0} serious)\n`)

  for (const [ruleId, ruleViolations] of Object.entries(byRule)) {
    const first = ruleViolations[0]!
    const impact = first.impact || 'unknown'
    const nodes = ruleViolations.reduce((n, v) => n + v.nodes.length, 0)
    const routes = [...new Set(ruleViolations.map(v => v.route).filter(Boolean))]
    lines.push(`  ${impact.padEnd(8)} ${ruleId} (${nodes} elements across ${routes.length} routes)`)
    lines.push(`           ${first.help}`)
  }

  return lines.join('\n')
}

function groupByImpact(violations: A11yViolation[]) {
  return groupBy(violations, v => v.impact || 'unknown')
}

function groupByRule(violations: A11yViolation[]) {
  return groupBy(violations, v => v.id)
}
