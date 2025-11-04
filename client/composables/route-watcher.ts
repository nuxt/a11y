import { clearAllPinned } from './pinned-elements'
import { axeViolations, isScanRunning, nuxtA11yRpc } from './rpc'

/**
 * Handle route change event from the user's app
 * Clears all pinned element state and violations in the DevTools
 */
export function handleRouteChange() {
  clearAllPinned()
  // Also unhighlight all elements on the user screen
  nuxtA11yRpc.value?.unhighlightAll()
  // Set scanning state to true immediately to show loading skeleton
  isScanRunning.value = true
  // Clear violations to prevent flickering - new scan results will arrive shortly
  axeViolations.value = []
}
