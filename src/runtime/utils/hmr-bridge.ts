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
  ROUTE_CHANGED: 'routeChanged',
  HIGHLIGHT_ELEMENT: 'highlightElement',
  UNHIGHLIGHT_ELEMENT: 'unhighlightElement',
  UNHIGHLIGHT_ALL: 'unhighlightAll',
  UPDATE_ELEMENT_ID: 'updateElementId',
  REMOVE_ELEMENT_ID_BADGE: 'removeElementIdBadge',
  SCROLL_TO_ELEMENT: 'scrollToElement',
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
      // Silent fail
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

  /**
   * Registers a handler for highlight element requests
   */
  function onHighlightElement(handler: (payload: { selector: string, id?: number, color?: string }) => void): void {
    if (import.meta.hot) {
      import.meta.hot.on(`${HMR_EVENT_PREFIX}:${HMR_EVENTS.HIGHLIGHT_ELEMENT}`, handler)
    }
  }

  /**
   * Registers a handler for unhighlight element requests
   */
  function onUnhighlightElement(handler: (selector: string) => void): void {
    if (import.meta.hot) {
      import.meta.hot.on(`${HMR_EVENT_PREFIX}:${HMR_EVENTS.UNHIGHLIGHT_ELEMENT}`, handler)
    }
  }

  /**
   * Registers a handler for unhighlight all elements requests
   */
  function onUnhighlightAll(handler: () => void): void {
    if (import.meta.hot) {
      import.meta.hot.on(`${HMR_EVENT_PREFIX}:${HMR_EVENTS.UNHIGHLIGHT_ALL}`, handler)
    }
  }

  /**
   * Registers a handler for update element ID requests
   */
  function onUpdateElementId(handler: (payload: { selector: string, id: number }) => void): void {
    if (import.meta.hot) {
      import.meta.hot.on(`${HMR_EVENT_PREFIX}:${HMR_EVENTS.UPDATE_ELEMENT_ID}`, handler)
    }
  }

  /**
   * Registers a handler for remove element ID badge requests
   */
  function onRemoveElementIdBadge(handler: (selector: string) => void): void {
    if (import.meta.hot) {
      import.meta.hot.on(`${HMR_EVENT_PREFIX}:${HMR_EVENTS.REMOVE_ELEMENT_ID_BADGE}`, handler)
    }
  }

  /**
   * Registers a handler for scroll to element requests
   */
  function onScrollToElement(handler: (selector: string) => void): void {
    if (import.meta.hot) {
      import.meta.hot.on(`${HMR_EVENT_PREFIX}:${HMR_EVENTS.SCROLL_TO_ELEMENT}`, handler)
    }
  }

  return {
    broadcast,
    onConnected,
    onEnableScanning,
    onDisableScanning,
    onTriggerScan,
    onReset,
    onHighlightElement,
    onUnhighlightElement,
    onUnhighlightAll,
    onUpdateElementId,
    onRemoveElementIdBadge,
    onScrollToElement,
    HMR_EVENTS,
  }
}
