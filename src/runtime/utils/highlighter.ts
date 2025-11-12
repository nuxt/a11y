/**
 * Manages highlighting of elements with accessibility violations
 * Uses inline styles for highlighting and floating tooltips for ID badges
 */

const HIGHLIGHT_STYLE_ID = '__nuxt_a11y_highlight_styles__'
const HIGHLIGHT_ID_BADGE_CLASS = '__nuxt_a11y_highlight_id_badge__'
const BADGE_CONTAINER_ID = '__nuxt_a11y_badge_container__'

interface HighlightedElement {
  element: HTMLElement
  originalStyles: {
    outline: string
    boxShadow: string
    position: string
    zIndex: string
  }
  idBadge?: HTMLElement
  color?: string
}

// Store highlighted elements by their selector key
const highlightedElements = new Map<string, HighlightedElement[]>()

// Reference counting: track how many violations have pinned each selector
const selectorRefCount = new Map<string, number>()

// Badge container element
let badgeContainer: HTMLElement | null = null

// Track if position update listener is attached
let positionUpdateListenerAttached = false

/**
 * Updates all badge positions
 */
function updateAllBadgePositions(): void {
  highlightedElements.forEach((highlighted) => {
    highlighted.forEach((item) => {
      if (item.idBadge) {
        positionBadge(item.idBadge, item.element)
      }
    })
  })
}

/**
 * Attaches listeners to update badge positions on scroll/resize
 */
function attachPositionUpdateListeners(): void {
  if (positionUpdateListenerAttached) return

  window.addEventListener('scroll', updateAllBadgePositions, { passive: true, capture: true })
  window.addEventListener('resize', updateAllBadgePositions, { passive: true })
  positionUpdateListenerAttached = true
}

/**
 * Removes position update listeners
 */
function removePositionUpdateListeners(): void {
  if (!positionUpdateListenerAttached) return

  window.removeEventListener('scroll', updateAllBadgePositions, true)
  window.removeEventListener('resize', updateAllBadgePositions)
  positionUpdateListenerAttached = false
}

/**
 * Saves original styles from an element
 */
function saveOriginalStyles(element: HTMLElement): HighlightedElement['originalStyles'] {
  return {
    outline: element.style.outline,
    boxShadow: element.style.boxShadow,
    position: element.style.position,
    zIndex: element.style.zIndex,
  }
}

/**
 * Restores original styles to an element
 */
function restoreOriginalStyles(element: HTMLElement, originalStyles: HighlightedElement['originalStyles']): void {
  const props = [
    { key: 'outline', value: originalStyles.outline },
    { key: 'box-shadow', value: originalStyles.boxShadow },
    { key: 'position', value: originalStyles.position },
    { key: 'z-index', value: originalStyles.zIndex },
  ]

  props.forEach(({ key, value }) => {
    if (value) {
      element.style.setProperty(key, value)
    }
    else {
      element.style.removeProperty(key)
    }
  })
}

/**
 * Injects CSS styles for ID badges into the document
 */
function injectStyles(): void {
  if (document.getElementById(HIGHLIGHT_STYLE_ID)) {
    return
  }

  const style = document.createElement('style')
  style.id = HIGHLIGHT_STYLE_ID
  style.textContent = `
    #${BADGE_CONTAINER_ID} {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      pointer-events: none !important;
      z-index: 999999 !important;
    }

    .${HIGHLIGHT_ID_BADGE_CLASS} {
      position: absolute !important;
      width: 28px !important;
      height: 28px !important;
      border-radius: 50% !important;
      background-color: black !important;
      color: white !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-size: 12px !important;
      font-weight: bold !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
      z-index: 1000000 !important;
      pointer-events: none !important;
      border: 2px solid white;
    }
  `
  document.head.appendChild(style)
}

/**
 * Gets or creates the badge container
 */
function getBadgeContainer(): HTMLElement {
  if (badgeContainer && document.body.contains(badgeContainer)) {
    return badgeContainer
  }

  badgeContainer = document.createElement('div')
  badgeContainer.id = BADGE_CONTAINER_ID
  document.body.appendChild(badgeContainer)
  return badgeContainer
}

/**
 * Parses a CSS selector array from axe-core and returns a valid selector string
 */
function parseSelector(target: string[]): string {
  // axe-core returns target as an array like ['#app', 'div.content', 'button']
  return target.join(' ')
}

/**
 * Creates an ID badge element positioned as a tooltip
 */
function createIdBadge(id: number, color?: string): HTMLElement {
  const badge = document.createElement('div')
  badge.className = HIGHLIGHT_ID_BADGE_CLASS
  badge.textContent = String(id)
  if (color) badge.style.borderColor = color
  return badge
}

/**
 * Positions a badge relative to an element
 */
function positionBadge(badge: HTMLElement, element: HTMLElement): void {
  const rect = element.getBoundingClientRect()

  // Position badge at bottom-center of the element
  const left = rect.left + rect.width / 2 - 12 // 12 = half of badge width (24px)
  const top = rect.bottom + 8 // 8px below the element

  badge.style.left = `${left}px`
  badge.style.top = `${top}px`
}

/**
 * Applies highlight styles directly to an element using inline styles
 */
function applyHighlightStyles(element: HTMLElement, color?: string): void {
  // Set position to relative if it's static, so absolute positioned badge works
  const position = window.getComputedStyle(element).position
  if (position === 'static') {
    element.style.setProperty('position', 'relative', 'important')
  }

  // Apply highlight outline and shadow
  element.style.setProperty('outline', `6px dotted black`, 'important')
  element.style.setProperty('box-shadow', `0 0 0 6px ${color ? color : 'white'}`, 'important')

  // Ensure element is above other content
  element.style.setProperty('z-index', '999998', 'important')
}

/**
 * Checks if an element is visible in viewport
 */
function isElementVisible(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect()
  const vw = window.innerWidth || document.documentElement.clientWidth
  const vh = window.innerHeight || document.documentElement.clientHeight
  return rect.top >= 0 && rect.left >= 0 && rect.bottom <= vh && rect.right <= vw
}

/**
 * Updates or creates an ID badge for an element
 */
function updateOrCreateBadge(
  highlighted: HighlightedElement[],
  element: HTMLElement,
  idBadge: HTMLElement | undefined,
  id: number,
  color?: string,
): HTMLElement {
  const container = getBadgeContainer()

  if (idBadge) {
    idBadge.textContent = String(id)
    if (color) idBadge.style.borderColor = color
    positionBadge(idBadge, element)
    return idBadge
  }

  const newBadge = createIdBadge(id, color)
  container.appendChild(newBadge)
  positionBadge(newBadge, element)

  const index = highlighted.findIndex(h => h.element === element)
  if (index !== -1 && highlighted[index]) {
    highlighted[index].idBadge = newBadge
  }

  return newBadge
}

/**
 * Highlights elements matching the given selector
 * Supports multiple simultaneous highlights by using a unique key
 * Uses reference counting to support multiple violations affecting the same element
 */
export function highlightElement(selector: string, id?: number, color?: string, scrollIntoView = false): void {
  injectStyles()

  // Attach position update listeners
  attachPositionUpdateListeners()

  // If already highlighted, increment reference count and update/add ID badge if provided
  if (highlightedElements.has(selector)) {
    const currentCount = selectorRefCount.get(selector) || 1
    selectorRefCount.set(selector, currentCount + 1)

    if (id !== undefined) {
      const highlighted = highlightedElements.get(selector)!
      highlighted.forEach(({ element, idBadge }) => {
        updateOrCreateBadge(highlighted, element, idBadge, id, color)
      })
    }
    return
  }

  try {
    const elements = document.querySelectorAll<HTMLElement>(selector)
    if (elements.length === 0) {
      console.debug(`[Nuxt A11y] No elements found for selector: ${selector}`)
      return
    }

    const highlighted: HighlightedElement[] = []

    elements.forEach((element) => {
      const originalStyles = saveOriginalStyles(element)

      // Apply highlight styles
      applyHighlightStyles(element, color)

      // Create ID badge if needed (added to floating container)
      let idBadge: HTMLElement | undefined
      if (id !== undefined) {
        const container = getBadgeContainer()
        idBadge = createIdBadge(id, color)
        container.appendChild(idBadge)
        positionBadge(idBadge, element)
      }

      // Scroll into view if needed
      if (scrollIntoView && !isElementVisible(element)) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }

      highlighted.push({
        element,
        originalStyles,
        idBadge,
        color,
      })
    })

    highlightedElements.set(selector, highlighted)
    selectorRefCount.set(selector, 1)
  }
  catch (error) {
    console.error('[Nuxt A11y] Error highlighting element:', error)
  }
}

/**
 * Removes ID badge from the DOM
 */
function removeBadge(idBadge: HTMLElement | undefined): void {
  if (!idBadge) return

  try {
    if (idBadge.parentNode) {
      idBadge.parentNode.removeChild(idBadge)
    }
  }
  catch (error) {
    console.warn('[Nuxt A11y] Error removing ID badge:', error)
  }
}

/**
 * Removes highlight from elements matching the given selector
 * Uses reference counting - only removes highlight when ref count reaches 0
 */
export function unhighlightElement(selector: string): void {
  const highlighted = highlightedElements.get(selector)
  if (!highlighted || highlighted.length === 0) return

  // Decrement reference count
  const currentCount = selectorRefCount.get(selector) || 1
  const newCount = currentCount - 1

  if (newCount > 0) {
    selectorRefCount.set(selector, newCount)
    return
  }

  // Reference count is 0, remove the highlight
  highlighted.forEach(({ element, originalStyles, idBadge }) => {
    restoreOriginalStyles(element, originalStyles)
    removeBadge(idBadge)
  })

  highlightedElements.delete(selector)
  selectorRefCount.delete(selector)
}

/**
 * Removes all highlights
 */
export function unhighlightAll(): void {
  const selectors = Array.from(highlightedElements.keys())
  // Force clear by setting ref counts to 0
  selectors.forEach((selector) => {
    selectorRefCount.set(selector, 1) // Set to 1 so the next call will remove it
    unhighlightElement(selector)
  })

  // Remove position update listeners when no highlights exist
  removePositionUpdateListeners()

  // Remove badge container if it exists
  if (badgeContainer && document.body.contains(badgeContainer)) {
    document.body.removeChild(badgeContainer)
    badgeContainer = null
  }
}

/**
 * Checks if a selector is currently highlighted
 */
export function isHighlighted(selector: string): boolean {
  return highlightedElements.has(selector)
}

/**
 * Updates the ID badge for an already highlighted element
 */
export function updateElementId(selector: string, id: number): void {
  const highlighted = highlightedElements.get(selector)
  if (!highlighted?.length) return

  const container = getBadgeContainer()

  highlighted.forEach((item) => {
    if (item.idBadge) {
      item.idBadge.textContent = String(id)
      positionBadge(item.idBadge, item.element)
    }
    else {
      const newBadge = createIdBadge(id)
      container.appendChild(newBadge)
      positionBadge(newBadge, item.element)
      item.idBadge = newBadge
    }
  })
}

/**
 * Removes the ID badge from a highlighted element without unhighlighting
 */
export function removeElementIdBadge(selector: string): void {
  const highlighted = highlightedElements.get(selector)
  if (!highlighted?.length) return

  highlighted.forEach((item) => {
    if (!item.idBadge) return

    removeBadge(item.idBadge)
    item.idBadge = undefined
  })
}

/**
 * Scroll to an element by selector
 */
export function scrollToElement(selector: string): void {
  try {
    const elements = document.querySelectorAll<HTMLElement>(selector)
    if (elements.length > 0 && elements[0]) {
      elements[0].scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }
  catch (error) {
    console.warn('[Nuxt A11y] Error scrolling to element:', error)
  }
}

/**
 * Creates a highlighter instance
 */
export function createHighlighter() {
  return {
    highlightElement,
    unhighlightElement,
    unhighlightAll,
    isHighlighted,
    updateElementId,
    removeElementIdBadge,
    scrollToElement,
    parseSelector,
  }
}
