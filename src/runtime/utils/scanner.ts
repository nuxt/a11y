import { DEBOUNCE_DELAY, SCAN_EVENTS } from '../constants'

/**
 * Manages event listeners and debouncing for constant accessibility scanning.
 */
export function createScanner(onScan: () => void) {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let eventListenersAttached = false

  /**
   * Debounced scan function to prevent too many scans in quick succession
   */
  function debouncedScan() {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    debounceTimer = setTimeout(() => {
      onScan()
    }, DEBOUNCE_DELAY)
  }

  /**
   * Enables constant scanning by attaching event listeners
   */
  function enable(): void {
    if (eventListenersAttached)
      return

    SCAN_EVENTS.forEach((event) => {
      document.addEventListener(event, debouncedScan, true)
    })
    eventListenersAttached = true
  }

  /**
   * Disables constant scanning by removing event listeners
   */
  function disable(): void {
    if (!eventListenersAttached)
      return

    SCAN_EVENTS.forEach((event) => {
      document.removeEventListener(event, debouncedScan, true)
    })
    eventListenersAttached = false

    // Clear any pending debounced scan
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
  }

  /**
   * Returns whether scanning is currently enabled
   */
  function isEnabled(): boolean {
    return eventListenersAttached
  }

  return {
    enable,
    disable,
    isEnabled,
  }
}
