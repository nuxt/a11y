/// <reference types="vite/client" />

import { HMR_EVENT_PREFIX } from '../constants'
import type { ClientFunctions, PageEvents } from '../types'

/**
 * Creates an HMR bridge for DevTools communication
 */
export function createHmrBridge() {
  /**
   * Broadcasts an event to the DevTools client
   */
  function broadcast<K extends keyof ClientFunctions>(event: K, payload: Parameters<ClientFunctions[K]>[0]): void {
    if (!import.meta.hot) {
      console.warn('No hot context')
      return
    }
    try {
      import.meta.hot.send(`${HMR_EVENT_PREFIX}:${event}` as string, payload)
    }
    catch {
      // Silent fail
    }
  }

  /**
   * Registers a handler for an event sent from the DevTools server
   */
  function on<K extends keyof PageEvents>(event: K, handler: (payload: PageEvents[K]) => void): void {
    import.meta.hot?.on(`${HMR_EVENT_PREFIX}:${event}`, handler)
  }

  return { broadcast, on }
}
