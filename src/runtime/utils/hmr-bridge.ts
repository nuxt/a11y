import { HMR_EVENT_PREFIX } from '../constants'

/**
 * Event names for HMR communication
 */
export const HMR_EVENTS = {
  CONNECTED: 'connected',
  SCAN_RUNNING: 'scanRunning',
  SHOW_VIOLATIONS: 'showViolations',
  CONSTANT_SCANNING_ENABLED: 'constantScanningEnabled',
  ENABLE_CONSTANT_SCANNING: 'enableConstantScanning',
  DISABLE_CONSTANT_SCANNING: 'disableConstantScanning',
  TRIGGER_SCAN: 'triggerScan',
  RESET: 'reset',
} as const

/**
 * Creates an HMR bridge for DevTools communication
 */
export function createHmrBridge() {
  /**
   * Broadcasts an event to the DevTools client
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function broadcast(event: string, payload?: any): void {
    if (!import.meta.hot) {
      console.warn('No hot context')
      return
    }
    try {
      import.meta.hot.send(`${HMR_EVENT_PREFIX}:${event}`, payload)
    }
    catch {
      console.log('Failed to send via HMR')
    }
  }

  /**
   * Registers a handler for when DevTools connects
   */
  function onConnected(handler: () => void): void {
    if (import.meta.hot) {
      import.meta.hot.on(`${HMR_EVENT_PREFIX}:${HMR_EVENTS.CONNECTED}`, handler)
    }
  }

  /**
   * Registers a handler for enable constant scanning requests
   */
  function onEnableScanning(handler: () => void): void {
    if (import.meta.hot) {
      import.meta.hot.on(`${HMR_EVENT_PREFIX}:${HMR_EVENTS.ENABLE_CONSTANT_SCANNING}`, handler)
    }
  }

  /**
   * Registers a handler for disable constant scanning requests
   */
  function onDisableScanning(handler: () => void): void {
    if (import.meta.hot) {
      import.meta.hot.on(`${HMR_EVENT_PREFIX}:${HMR_EVENTS.DISABLE_CONSTANT_SCANNING}`, handler)
    }
  }

  /**
   * Registers a handler for manual scan trigger requests
   */
  function onTriggerScan(handler: () => void): void {
    if (import.meta.hot) {
      import.meta.hot.on(`${HMR_EVENT_PREFIX}:${HMR_EVENTS.TRIGGER_SCAN}`, handler)
    }
  }

  /**
   * Registers a handler for reset requests
   */
  function onReset(handler: () => void): void {
    if (import.meta.hot) {
      import.meta.hot.on(`${HMR_EVENT_PREFIX}:${HMR_EVENTS.RESET}`, handler)
    }
  }

  return {
    broadcast,
    onConnected,
    onEnableScanning,
    onDisableScanning,
    onTriggerScan,
    onReset,
    HMR_EVENTS,
  }
}
