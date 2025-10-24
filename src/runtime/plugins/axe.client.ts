import { defineNuxtPlugin, useRuntimeConfig, useRoute } from '#imports'
import type { A11yWindow } from '../types'
import { createAxeRunner } from '../utils/axe-runner'
import { createViolationManager } from '../utils/violation-manager'
import { createScanner } from '../utils/scanner'
import { createHmrBridge } from '../utils/hmr-bridge'
import { createLogger } from '../utils/logger'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig().public.axe
  const route = useRoute()

  // Initialize core components
  const hmr = createHmrBridge()
  const logger = createLogger()

  const violationManager = createViolationManager(() => route.path || route.fullPath || 'unknown')

  const axeRunner = createAxeRunner(config, (isRunning) => {
    hmr.broadcast(hmr.HMR_EVENTS.SCAN_RUNNING, isRunning)
  })

  const scanner = createScanner(async () => {
    const violations = await axeRunner.run()
    if (violations.length > 0) {
      // Log new violations to console
      violations.forEach(v => logger.logViolation(v))

      // Process and send to DevTools
      const allViolations = violationManager.processViolations(violations)
      hmr.broadcast(hmr.HMR_EVENTS.SHOW_VIOLATIONS, allViolations)
    }
  })

  // Setup HMR event handlers
  hmr.onConnected(async () => {
    const violations = await axeRunner.run()
    if (violations.length > 0) {
      violations.forEach(v => logger.logViolation(v))
      const allViolations = violationManager.processViolations(violations)
      hmr.broadcast(hmr.HMR_EVENTS.SHOW_VIOLATIONS, allViolations)
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
    const violations = await axeRunner.run()
    if (violations.length > 0) {
      violations.forEach(v => logger.logViolation(v))
      const allViolations = violationManager.processViolations(violations)
      hmr.broadcast(hmr.HMR_EVENTS.SHOW_VIOLATIONS, allViolations)
    }
  })

  hmr.onReset(() => {
    violationManager.reset()
    hmr.broadcast(hmr.HMR_EVENTS.SHOW_VIOLATIONS, [])
  })

  // Expose functions for testing
  if (typeof window !== 'undefined') {
    const win = window as A11yWindow
    win.__nuxt_a11y_run__ = async () => {
      const violations = await axeRunner.run()
      if (violations.length > 0) {
        violations.forEach(v => logger.logViolation(v))
        const allViolations = violationManager.processViolations(violations)
        hmr.broadcast(hmr.HMR_EVENTS.SHOW_VIOLATIONS, allViolations)
      }
    }
    win.__nuxt_a11y_enableConstantScanning__ = () => {
      scanner.enable()
      hmr.broadcast(hmr.HMR_EVENTS.CONSTANT_SCANNING_ENABLED, true)
    }
    win.__nuxt_a11y_disableConstantScanning__ = () => {
      scanner.disable()
      hmr.broadcast(hmr.HMR_EVENTS.CONSTANT_SCANNING_ENABLED, false)
    }
  }
})
