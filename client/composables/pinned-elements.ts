import { ref } from 'vue'
import { updateElementId } from './rpc'

/**
 * Global state management for pinned elements with unique IDs
 * IDs are assigned sequentially in the order elements are pinned
 */

// Global map of selector -> ID
const pinnedElements = ref<Map<string, number>>(new Map())

// Counter for the next available ID
let nextId = 1

/**
 * Pin an element and assign it an ID
 * Returns the assigned ID
 */
export function pinElement(selector: string): number {
  if (pinnedElements.value.has(selector)) {
    return pinnedElements.value.get(selector)!
  }

  const id = nextId++
  pinnedElements.value.set(selector, id)

  // Trigger reactivity
  pinnedElements.value = new Map(pinnedElements.value)

  return id
}

/**
 * Unpin an element and reassign IDs sequentially
 */
export function unpinElement(selector: string): void {
  if (!pinnedElements.value.has(selector)) {
    return
  }

  pinnedElements.value.delete(selector)

  // Reassign IDs sequentially based on insertion order
  const entries = Array.from(pinnedElements.value.entries())
  pinnedElements.value.clear()

  entries.forEach(([sel], index) => {
    const newId = index + 1
    pinnedElements.value.set(sel, newId)
    // Update the displayed ID on the screen
    updateElementId(sel, newId)
  })

  // Update next ID
  nextId = pinnedElements.value.size + 1

  // Trigger reactivity
  pinnedElements.value = new Map(pinnedElements.value)
}

/**
 * Get the ID for a pinned element
 * Returns undefined if not pinned
 */
export function getElementId(selector: string): number | undefined {
  return pinnedElements.value.get(selector)
}

/**
 * Check if an element is pinned
 */
export function isElementPinned(selector: string): boolean {
  return pinnedElements.value.has(selector)
}

/**
 * Get all pinned elements with their IDs
 */
export function getPinnedElements(): Map<string, number> {
  return pinnedElements.value
}

/**
 * Clear all pinned elements
 */
export function clearAllPinned(): void {
  pinnedElements.value.clear()
  nextId = 1
  pinnedElements.value = new Map(pinnedElements.value)
}

/**
 * Get the count of pinned elements
 */
export function getPinnedCount(): number {
  return pinnedElements.value.size
}
