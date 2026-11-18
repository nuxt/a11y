import { defineNuxtPlugin, useRuntimeConfig, useRoute } from '#imports'
import { watch, nextTick } from 'vue'
import type { Plugin, ObjectPlugin } from '#app'
import type { A11yWindow } from '../types'
import { createAxeRunner } from '../utils/axe-runner'
import { createViolationManager } from '../utils/violation-manager'
import { createScanner } from '../utils/scanner'
import { createHmrBridge } from '../utils/hmr-bridge'
import { createLogger } from '../utils/logger'
import { createHighlighter } from '../utils/highlighter'
import { createActiveTabTracker } from '../utils/active-tab-tracker'

// The explicit annotation on a const (not a cast on the export expression)
// keeps the emitted d.ts portable (TS2883 with nuxt >= 4.5) and breaks the
// circular NuxtAppInjections inference in consuming apps (TS7022). It must
// match defineNuxtPlugin's return type exactly so no structural comparison
// (which would re-enter the cycle) is needed.
const plugin: Plugin & ObjectPlugin = defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig().public.axe
  const route = useRoute()

  // Initialize core components
  const hmr = createHmrBridge()
  const logger = createLogger()
  const highlighter = createHighlighter()
  const violationManager = createViolationManager()

  // Initialize active tab tracker
  const activeTabTracker = createActiveTabTracker((status) => {
    // Broadcast status changes to DevTools
    hmr.broadcast('activeTabChanged', status)
  })

  activeTabTracker.initialize()

  // Get this tab's unique ID
  const TAB_ID = activeTabTracker.getTabId()

  const axeRunner = createAxeRunner(config, (isRunning) => {
    hmr.broadcast('scanRunning', isRunning)
  })

  function getCurrentRoute(): string {
    return route.path || route.fullPath || 'unknown'
  }

  // All tabs can scan independently - each tab maintains its own violations
  async function scanAndBroadcast(alwaysBroadcast = false): Promise<void> {
    // Capture the route at the start of the scan, not when processing
    const scanRoute = getCurrentRoute()
    const violations = await axeRunner.run()

    if (violations.length > 0) {
      for (const v of violations) logger.logViolation(v)
      violationManager.processViolations(violations, scanRoute, TAB_ID)
    }

    if (violations.length > 0 || alwaysBroadcast) {
      hmr.broadcast('showViolations', {
        violations: violationManager.getAll(TAB_ID),
        currentRoute: getCurrentRoute(),
        tabId: TAB_ID,
      })
    }
  }

  const scanner = createScanner(() => {
    scanAndBroadcast()
  })

  // Setup HMR event handlers
  hmr.on('connected', async () => {
    // Always send active tab status when DevTools connects
    hmr.broadcast('activeTabChanged', activeTabTracker.getStatus())

    // All tabs respond with their own data
    // Send current route first
    hmr.broadcast('routeChanged', getCurrentRoute())
    await scanAndBroadcast(true)
  })

  hmr.on('enableConstantScanning', () => {
    scanner.enable()
    hmr.broadcast('constantScanningEnabled', true)
  })

  hmr.on('disableConstantScanning', () => {
    scanner.disable()
    hmr.broadcast('constantScanningEnabled', false)
  })

  hmr.on('triggerScan', async () => {
    // All tabs respond to scan triggers
    await scanAndBroadcast(true)
  })

  hmr.on('reset', () => {
    violationManager.reset(TAB_ID)
    highlighter.unhighlightAll()
    hmr.broadcast('showViolations', { violations: [], currentRoute: getCurrentRoute(), tabId: TAB_ID })
  })

  hmr.on('highlightElement', (payload) => {
    highlighter.highlightElement(payload.selector, payload.id, payload.color)
  })

  hmr.on('unhighlightElement', (selector) => {
    highlighter.unhighlightElement(selector)
  })

  hmr.on('unhighlightAll', () => {
    highlighter.unhighlightAll()
  })

  hmr.on('updateElementId', (payload) => {
    highlighter.updateElementId(payload.selector, payload.id)
  })

  hmr.on('removeElementIdBadge', (selector) => {
    highlighter.removeElementIdBadge(selector)
  })

  hmr.on('scrollToElement', (selector) => {
    highlighter.scrollToElement(selector)
  })

  // Watch for route changes and broadcast to DevTools
  watch(() => route.path, async (newPath, oldPath) => {
    if (newPath !== oldPath) {
      // Unhighlight all elements on the user screen
      highlighter.unhighlightAll()

      // All tabs broadcast their own route changes
      // Broadcast route change to DevTools FIRST
      hmr.broadcast('routeChanged', newPath)

      // Wait for DevTools to process the route change
      await new Promise(resolve => setTimeout(resolve, 150))
    }
  })

  // Hook into Nuxt's page lifecycle to scan when page is fully rendered
  nuxtApp.hook('page:finish', async () => {
    // All tabs scan independently
    // Wait for next tick to ensure all Vue components are mounted
    await nextTick()

    // Add a small delay to ensure all async operations are complete
    await new Promise(resolve => setTimeout(resolve, 100))

    await scanAndBroadcast(true)
  })

  // Expose functions for testing
  if (typeof window !== 'undefined') {
    const win = window as A11yWindow
    win.__nuxt_a11y_run__ = () => scanAndBroadcast(true)
  }

  // Cleanup: Close BroadcastChannel when tab/window closes
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      activeTabTracker.cleanup()
    })
  }
})

export default plugin
