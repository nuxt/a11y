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
   * Normalizes a CSS selector by removing scoped styling attributes.
   */
  function normalizeSelector(selector: string): string {
    return selector
      .replace(/\[data-[vs]-[a-f0-9]+=""\]/g, '')
  }

  /**
   * Normalizes a target selector array by removing highlight wrappers and scoped attributes.
   * Handles both simple string arrays and shadow DOM/cross-tree selectors.
   */
  function normalizeTarget(target: axe.NodeResult['target']): string[] {
    // Handle simple string arrays (most common case)
    if (target.every(t => typeof t === 'string')) {
      return (target as string[]).map(normalizeSelector)
    }
    // Handle shadow DOM and cross-tree selectors (arrays with nested arrays)
    return target.map(t => typeof t === 'string' ? normalizeSelector(t) : String(t))
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
   * Merges nodes from source violation into target, avoiding duplicates
   */
  function mergeViolationNodes(target: axe.Result, source: axe.Result): void {
    const existingTargets = new Set(
      target.nodes.map(n => getTargetKey(n.target)),
    )

    const newNodes = source.nodes.filter(n => !existingTargets.has(getTargetKey(n.target)))
    target.nodes = [...target.nodes, ...newNodes]
  }

  /**
   * Groups violations from current scan by type, deduplicating nodes within the scan
   */
  function groupCurrentScanViolations(violations: axe.Result[], scanRoute: string): Map<string, axe.Result> {
    const grouped = new Map<string, axe.Result>()

    violations.forEach((v) => {
      const violationKey = createViolationKey(scanRoute, v.id, v.impact)

      if (!grouped.has(violationKey)) {
        grouped.set(violationKey, v)
      }
      else {
        mergeViolationNodes(grouped.get(violationKey)!, v)
      }
    })

    return grouped
  }

  /**
   * Converts axe.Result to A11yViolation format
   */
  function createViolationRecord(v: axe.Result, scanRoute: string): A11yViolation {
    return {
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
  }

  /**
   * Adds a new violation to the accumulated violations list
   */
  function addNewViolation(v: axe.Result, scanRoute: string, violationKey: string): void {
    warned.add(violationKey)
    const violation = createViolationRecord(v, scanRoute)
    allViolations.push(violation)
  }

  /**
   * Updates an existing violation with new nodes from current scan
   */
  function updateExistingViolation(v: axe.Result, scanRoute: string): void {
    const existingViolation = allViolations.find(
      av => av.route === scanRoute && av.id === v.id && av.impact === v.impact,
    )

    if (!existingViolation) return

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

  /**
   * Processes violations from an axe scan, merging duplicates and tracking new ones
   * @param violations - The violations from axe scan
   * @param scanRoute - The route that was active when the scan started
   */
  function processViolations(violations: axe.Result[], scanRoute: string): A11yViolation[] {
    const currentScanViolations = groupCurrentScanViolations(violations, scanRoute)

    currentScanViolations.forEach((v, violationKey) => {
      if (!warned.has(violationKey)) {
        addNewViolation(v, scanRoute, violationKey)
      }
      else {
        updateExistingViolation(v, scanRoute)
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
