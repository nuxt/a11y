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
   * Normalizes a CSS selector by removing the highlight wrapper class.
   * This ensures that highlighted elements are recognized as the same elements
   * when compared across scans.
   */
  function normalizeSelector(selector: string): string {
    // Remove the highlight wrapper from the selector path
    // Example: .team-member > .__nuxt_a11y_highlight__ > .avatar
    //       -> .team-member > .avatar
    return selector.replace(/\s*>\s*\.__nuxt_a11y_highlight__\s*>\s*/g, ' > ')
  }

  /**
   * Normalizes a target selector array by removing highlight wrappers.
   * Handles different axe-core target types (string arrays, cross-tree selectors, etc.)
   */
  function normalizeTarget(target: axe.NodeResult['target']): string[] {
    // If it's a simple array of strings
    if (Array.isArray(target) && target.every(t => typeof t === 'string')) {
      return (target as string[]).map(normalizeSelector)
    }
    // For other types (cross-tree, shadow DOM), convert to array if needed
    const targetArray = Array.isArray(target) ? target : [target]
    return targetArray.map(t => typeof t === 'string' ? normalizeSelector(t) : String(t))
  }

  /**
   * Creates a normalized string representation of a target for comparison
   */
  function getTargetKey(target: axe.NodeResult['target']): string {
    return normalizeTarget(target).join(',')
  }

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
          // Use normalized selectors for comparison
          const existingTargets = new Set(
            existingViolation.nodes.map(n => getTargetKey(n.target)),
          )
          const newNodes = v.nodes
            .filter(n => !existingTargets.has(getTargetKey(n.target)))
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
