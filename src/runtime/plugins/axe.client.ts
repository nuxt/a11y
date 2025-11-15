import { defineNuxtPlugin, useRuntimeConfig, useRoute } from '#imports'
import { watch, nextTick } from 'vue'
import type { A11yWindow } from '../types'
import { createAxeRunner } from '../utils/axe-runner'
import { createViolationManager } from '../utils/violation-manager'
import { createScanner } from '../utils/scanner'
import { createHmrBridge } from '../utils/hmr-bridge'
import { createLogger } from '../utils/logger'
import { createHighlighter } from '../utils/highlighter'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig().public.axe
  const route = useRoute()

  // Initialize core components
  const hmr = createHmrBridge()
  const logger = createLogger()
  const highlighter = createHighlighter()
  const violationManager = createViolationManager()

  const axeRunner = createAxeRunner(config, (isRunning) => {
    hmr.broadcast(hmr.HMR_EVENTS.SCAN_RUNNING, isRunning)
  })

  const scanner = createScanner(async () => {
    // Capture the route at the start of the scan, not when processing
    const routeAtScanTime = route.path || route.fullPath || 'unknown'

    const violations = await axeRunner.run()
    if (violations.length > 0) {
      // Log new violations to console
      violations.forEach(v => logger.logViolation(v))

      // Process and send to DevTools with the route captured at scan start
      const allViolations = violationManager.processViolations(violations, routeAtScanTime)
      hmr.broadcast(hmr.HMR_EVENTS.SHOW_VIOLATIONS, { violations: allViolations, currentRoute: routeAtScanTime })
    }
  })

  // Setup HMR event handlers
  hmr.onConnected(async () => {
    // Send current route first
    const currentRoutePath = route.path || route.fullPath || 'unknown'
    hmr.broadcast(hmr.HMR_EVENTS.ROUTE_CHANGED, currentRoutePath)

    const violations = await axeRunner.run()
    if (violations.length > 0) {
      violations.forEach(v => logger.logViolation(v))
      const allViolations = violationManager.processViolations(violations, currentRoutePath)
      hmr.broadcast(hmr.HMR_EVENTS.SHOW_VIOLATIONS, { violations: allViolations, currentRoute: currentRoutePath })
    }
  })

  hmr.onEnableScanning(() => {
    scanner.enable()
    hmr.broadcast(hmr.HMR_EVENTS.CONSTANT_SCANNING_ENABLED, true)
  })

  hmr.onDisableScanning(() => {
    scanner.disable()
    hmr.broadcast(hmr.HMR_EVENTS.CONSTANT_SCANNING_ENABLED, false)
  })

  hmr.onTriggerScan(async () => {
    const routeAtScanTime = route.path || route.fullPath || 'unknown'
    const violations = await axeRunner.run()
    if (violations.length > 0) {
      violations.forEach(v => logger.logViolation(v))
      const allViolations = violationManager.processViolations(violations, routeAtScanTime)
      hmr.broadcast(hmr.HMR_EVENTS.SHOW_VIOLATIONS, { violations: allViolations, currentRoute: routeAtScanTime })
    }
  })

  hmr.onReset(() => {
    violationManager.reset()
    highlighter.unhighlightAll()
    const currentRoutePath = route.path || route.fullPath || 'unknown'
    hmr.broadcast(hmr.HMR_EVENTS.SHOW_VIOLATIONS, { violations: [], currentRoute: currentRoutePath })
  })

  hmr.onHighlightElement((payload) => {
    highlighter.highlightElement(payload.selector, payload.id, payload.color)
  })

  hmr.onUnhighlightElement((selector) => {
    highlighter.unhighlightElement(selector)
  })

  hmr.onUnhighlightAll(() => {
    highlighter.unhighlightAll()
  })

  hmr.onUpdateElementId((payload) => {
    highlighter.updateElementId(payload.selector, payload.id)
  })

  hmr.onRemoveElementIdBadge((selector) => {
    highlighter.removeElementIdBadge(selector)
  })

  hmr.onScrollToElement((selector) => {
    highlighter.scrollToElement(selector)
  })

  // Watch for route changes and broadcast to DevTools
  watch(() => route.path, async (newPath, oldPath) => {
    if (newPath !== oldPath) {
      // Unhighlight all elements on the user screen
      highlighter.unhighlightAll()

      // Broadcast route change to DevTools FIRST
      hmr.broadcast(hmr.HMR_EVENTS.ROUTE_CHANGED, newPath)

      // Wait for DevTools to process the route change
      await new Promise(resolve => setTimeout(resolve, 150))
    }
  })

  // Hook into Nuxt's page lifecycle to scan when page is fully rendered
  nuxtApp.hook('page:finish', async () => {
    // Wait for next tick to ensure all Vue components are mounted
    await nextTick()

    // Add a small delay to ensure all async operations are complete
    await new Promise(resolve => setTimeout(resolve, 100))

    const currentRoutePath = route.path || route.fullPath || 'unknown'
    const violations = await axeRunner.run()

    if (violations.length > 0) {
      violations.forEach(v => logger.logViolation(v))
      const allViolations = violationManager.processViolations(violations, currentRoutePath)
      hmr.broadcast(hmr.HMR_EVENTS.SHOW_VIOLATIONS, { violations: allViolations, currentRoute: currentRoutePath })
    }
    else {
      // Still send the accumulated violations (from other routes)
      hmr.broadcast(hmr.HMR_EVENTS.SHOW_VIOLATIONS, { violations: violationManager.getAll(), currentRoute: currentRoutePath })
    }
  })

  // Expose functions for testing
  if (typeof window !== 'undefined') {
    const win = window as A11yWindow
    win.__nuxt_a11y_run__ = async () => {
      const routeAtScanTime = route.path || route.fullPath || 'unknown'
      const violations = await axeRunner.run()
      if (violations.length > 0) {
        violations.forEach(v => logger.logViolation(v))
        const allViolations = violationManager.processViolations(violations, routeAtScanTime)
        hmr.broadcast(hmr.HMR_EVENTS.SHOW_VIOLATIONS, { violations: allViolations, currentRoute: routeAtScanTime })
      }
    }
  }
})
