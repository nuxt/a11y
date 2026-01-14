import type axe from 'axe-core'
import type { ImpactColors } from './types'

export const IMPACT_LEVELS: readonly NonNullable<axe.ImpactValue>[] = ['critical', 'serious', 'moderate', 'minor'] as const

export const IMPACT_COLORS: Record<NonNullable<axe.ImpactValue>, ImpactColors> = {
  critical: {
    light: { bg: '#fef2f2', text: '#dc2626' },
    dark: { bg: '#450a0a', text: '#fca5a5' },
  },
  serious: {
    light: { bg: '#fff7ed', text: '#ea580c' },
    dark: { bg: '#431407', text: '#fdba74' },
  },
  moderate: {
    light: { bg: '#fefce8', text: '#ca8a04' },
    dark: { bg: '#422006', text: '#fcd34d' },
  },
  minor: {
    light: { bg: '#f3f4f6', text: '#6b7280' },
    dark: { bg: '#374151', text: '#d1d5db' },
  },
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
