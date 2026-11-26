import { watch } from 'vue'
import { useDark } from '@vueuse/core'
import { IMPACT_COLORS } from '../../../src/runtime/constants'
import { axeViolations, callServer, currentRoute, moduleOptions } from './rpc'
import { isRootElementSelector } from '../utils/root-element-checker'
import { pinElement, isElementPinned, clearAllPinned } from './pinned-elements'

/**
 * Auto-highlight violations on the current route when the `defaultHighlight` module option is enabled
 */
export function useAutoHighlight() {
  const isDark = useDark()

  // Watch for new violations and auto-highlight them
  watch([moduleOptions, axeViolations, currentRoute], ([options, violations, route]) => {
    if (!options?.defaultHighlight) return
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
          const colors = IMPACT_COLORS[violation.impact ?? 'moderate']
          callServer('highlightElement', selector, id, isDark.value ? colors.dark.text : colors.light.text)
        })
      })
  }, { immediate: true })
}
