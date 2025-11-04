import type axe from 'axe-core'
import type { ImpactColor } from './types'

export const IMPACT_LEVELS: readonly NonNullable<axe.ImpactValue>[] = ['critical', 'serious', 'moderate', 'minor'] as const

export const IMPACT_COLORS: Record<NonNullable<axe.ImpactValue>, ImpactColor> = {
  critical: '#ff1e1eff',
  serious: '#FF6E40',
  moderate: '#FFB300',
  minor: '#FFEB3B',
} as const

/**
 * DOM events that trigger accessibility scans.
 * These are the most optimal and minimal events needed for constant scanning.
 */
export const SCAN_EVENTS = [
  // User interactions that commonly trigger DOM changes
  'click', // Buttons, links, toggles, accordions
  'input', // Form field changes
  'change', // Select dropdowns, checkboxes, radio buttons
  'submit', // Form submissions

  // Keyboard navigation
  'keydown', // Keyboard interactions (Enter, Space, Escape, Tab, etc.)

  // Layout changes
  'resize', // Window/viewport changes
  'scroll', // Lazy-loaded content, infinite scroll
] as const

/**
 * Debounce delay in milliseconds for scan operations.
 * Waits this long after the last event before triggering a scan.
 */
export const DEBOUNCE_DELAY = 500

/**
 * HMR event prefix for all Nuxt A11y DevTools events
 */
export const HMR_EVENT_PREFIX = 'nuxt-a11y'
