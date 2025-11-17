import { ref, watch } from 'vue'
import type { ModuleOptions } from '../../src/module'
import { IMPACT_COLORS } from '../../src/runtime/constants'
import { axeViolations, currentRoute, highlightElement, nuxtA11yRpc } from './rpc'
import { isRootElementSelector } from './root-element-checker'
import { pinElement, isElementPinned, clearAllPinned } from './pinned-elements'

const autoHighlightEnabled = ref(false)
const isInitialized = ref(false)

/**
 * Initialize auto-highlight feature
 * Fetches module options and sets up watcher
 */
export async function initAutoHighlight() {
  if (isInitialized.value) return

  // Fetch module options
  if (nuxtA11yRpc.value) {
    const options: ModuleOptions = await nuxtA11yRpc.value.getOptions()
    autoHighlightEnabled.value = options.defaultHighlight ?? false
  }

  // Watch for new violations and auto-highlight them
  watch([axeViolations, currentRoute], ([violations, route]) => {
    if (!autoHighlightEnabled.value) return
    if (!violations || violations.length === 0) return

    // Clear all previous pins when violations change
    clearAllPinned()

    // Only auto-highlight violations on the current route
    violations
      .filter(v => v.route === route)
      .forEach((violation) => {
        violation.nodes.forEach((node) => {
          const selector = Array.isArray(node.target)
            ? node.target.join(' ')
            : String(node.target)

          // Skip root elements
          if (isRootElementSelector(selector)) return

          // Skip if already pinned
          if (isElementPinned(selector)) return

          // Pin element and highlight with ID badge
          const id = pinElement(selector)
          const color = IMPACT_COLORS[violation.impact ?? 'moderate']
          highlightElement(selector, id, color)
        })
      })
  }, { immediate: true })

  isInitialized.value = true
}

export function isAutoHighlightEnabled() {
  return autoHighlightEnabled.value
}
