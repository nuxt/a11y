import type axe from 'axe-core'
import type { A11yViolation } from '../types'

/**
 * Manages accessibility violations: tracking, merging, and deduplication.
 * Accumulates violations across multiple scans and routes.
 */
export function createViolationManager() {
  const warned = new Set<string>()
  const allViolations: A11yViolation[] = []

  /**
   * Creates a unique key for a violation based on route, id, and impact
   */
  function createViolationKey(route: string, id: string, impact?: string | null): string {
    return `${route}:${id}:${impact}`
  }

  /**
   * Processes violations from an axe scan, merging duplicates and tracking new ones
   * @param violations - The violations from axe scan
   * @param scanRoute - The route that was active when the scan STARTED (not when processing)
   */
  function processViolations(violations: axe.Result[], scanRoute: string): A11yViolation[] {
    const currentScanViolations = new Map<string, axe.Result>()

    // Group violations by type (id + impact + route)
    violations.forEach((v: axe.Result) => {
      const violationKey = createViolationKey(scanRoute, v.id, v.impact)

      if (!currentScanViolations.has(violationKey)) {
        currentScanViolations.set(violationKey, v)
      }
      else {
        // Merge nodes from the same violation type
        const existing = currentScanViolations.get(violationKey)!
        existing.nodes = [...existing.nodes, ...v.nodes]
      }
    })

    // Process merged violations
    currentScanViolations.forEach((v, violationKey) => {
      // Only add if we haven't seen this violation before
      if (!warned.has(violationKey)) {
        warned.add(violationKey)

        // Add to accumulated violations
        const violation: A11yViolation = {
          id: v.id,
          impact: v.impact,
          help: v.help,
          helpUrl: v.helpUrl,
          description: v.description,
          nodes: v.nodes.map(n => ({
            target: n.target,
            html: n.html,
            failureSummary: n.failureSummary,
          })),
          tags: v.tags,
          timestamp: Date.now(),
          route: scanRoute,
        }

        allViolations.push(violation)
      }
      else {
        // Update existing violation with new nodes
        const existingViolation = allViolations.find(
          av => av.route === scanRoute && av.id === v.id && av.impact === v.impact,
        )
        if (existingViolation) {
          // Merge new nodes with existing ones, avoiding duplicates
          const existingTargets = new Set(
            existingViolation.nodes.map(n => n.target.join(',')),
          )
          const newNodes = v.nodes
            .filter(n => !existingTargets.has(n.target.join(',')))
            .map(n => ({
              target: n.target,
              html: n.html,
              failureSummary: n.failureSummary,
            }))
          existingViolation.nodes.push(...newNodes)
          existingViolation.timestamp = Date.now()
        }
      }
    })

    return allViolations
  }

  /**
   * Gets all accumulated violations
   */
  function getAll(): A11yViolation[] {
    return allViolations
  }

  /**
   * Resets all violations and tracking state
   */
  function reset(): void {
    allViolations.length = 0
    warned.clear()
  }

  return {
    processViolations,
    getAll,
    reset,
  }
}
