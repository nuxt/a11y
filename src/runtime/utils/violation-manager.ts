import type axe from 'axe-core'
import type { A11yViolation } from '../types'

/**
 * Manages accessibility violations: tracking, merging, and deduplication.
 * Maintains separate violation stores per browser tab for complete isolation.
 */
export function createViolationManager() {
  // Store violations per tab: Map<tabId, { violations: A11yViolation[], warned: Set<string> }>
  const tabStores = new Map<string, { violations: A11yViolation[], warned: Set<string> }>()

  /**
   * Gets or creates a store for a specific tab
   */
  function getTabStore(tabId: string) {
    if (!tabStores.has(tabId)) {
      tabStores.set(tabId, {
        violations: [],
        warned: new Set<string>(),
      })
    }
    return tabStores.get(tabId)!
  }

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
   * Adds a new violation to the accumulated violations list for a specific tab
   */
  function addNewViolation(v: axe.Result, scanRoute: string, violationKey: string, tabId: string): void {
    const store = getTabStore(tabId)
    store.warned.add(violationKey)
    const violation = createViolationRecord(v, scanRoute)
    store.violations.push(violation)
  }

  /**
   * Updates an existing violation with new nodes from current scan for a specific tab
   */
  function updateExistingViolation(v: axe.Result, scanRoute: string, tabId: string): void {
    const store = getTabStore(tabId)
    const existingViolation = store.violations.find(
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
   * @param tabId - The unique identifier for the browser tab
   */
  function processViolations(violations: axe.Result[], scanRoute: string, tabId: string): A11yViolation[] {
    const currentScanViolations = groupCurrentScanViolations(violations, scanRoute)
    const store = getTabStore(tabId)

    currentScanViolations.forEach((v, violationKey) => {
      if (!store.warned.has(violationKey)) {
        addNewViolation(v, scanRoute, violationKey, tabId)
      }
      else {
        updateExistingViolation(v, scanRoute, tabId)
      }
    })

    return store.violations
  }

  /**
   * Gets all accumulated violations for a specific tab
   */
  function getAll(tabId: string): A11yViolation[] {
    const store = getTabStore(tabId)
    return store.violations
  }

  /**
   * Resets all violations and tracking state for a specific tab
   */
  function reset(tabId: string): void {
    const store = getTabStore(tabId)
    store.violations.length = 0
    store.warned.clear()
  }

  /**
   * Resets all violations for all tabs (used for complete cleanup)
   */
  function resetAll(): void {
    tabStores.clear()
  }

  return {
    processViolations,
    getAll,
    reset,
    resetAll,
  }
}
