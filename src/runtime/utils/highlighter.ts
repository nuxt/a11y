/**
 * Manages highlighting of elements with accessibility violations
 * Supports multiple simultaneous highlights for different violations
 */

const HIGHLIGHT_STYLE_ID = '__nuxt_a11y_highlight_styles__'
const HIGHLIGHT_CLASS = '__nuxt_a11y_highlight__'
const HIGHLIGHT_ID_BADGE_CLASS = '__nuxt_a11y_highlight_id_badge__'

// Void elements that cannot have children
const VOID_ELEMENTS = new Set(['IMG', 'INPUT', 'BR', 'HR', 'AREA', 'BASE', 'COL', 'EMBED', 'LINK', 'META', 'PARAM', 'SOURCE', 'TRACK', 'WBR', 'IFRAME', 'SELECT', 'TEXTAREA', 'VIDEO', 'AUDIO'])

// Elements that should fill wrapper width
const FILL_WIDTH_ELEMENTS = new Set(['SELECT', 'TEXTAREA', 'IFRAME'])

interface HighlightedElement {
  element: HTMLElement
  originalStyles: {
    outline: string
    boxShadow: string
    position: string
    width: string
    height: string
  }
  idBadge?: HTMLElement
  wrapper?: HTMLElement
  color?: string
}

// Store highlighted elements by their selector key
const highlightedElements = new Map<string, HighlightedElement[]>()

// Reference counting: track how many violations have pinned each selector
const selectorRefCount = new Map<string, number>()

/**
 * Check if an element can have child elements
 */
function canHaveChildren(element: HTMLElement): boolean {
  return !VOID_ELEMENTS.has(element.tagName)
}

/**
 * Saves original styles from an element
 */
function saveOriginalStyles(element: HTMLElement): HighlightedElement['originalStyles'] {
  return {
    outline: element.style.outline,
    boxShadow: element.style.boxShadow,
    position: element.style.position,
    width: element.style.width,
    height: element.style.height,
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
    { key: 'width', value: originalStyles.width },
    { key: 'height', value: originalStyles.height },
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
 * Injects CSS styles for highlighting into the document
 */
function injectStyles(): void {
  if (document.getElementById(HIGHLIGHT_STYLE_ID)) {
    return
  }

  const style = document.createElement('style')
  style.id = HIGHLIGHT_STYLE_ID
  style.textContent = `
    .${HIGHLIGHT_CLASS} {
      outline: 3px solid #f59e0b;
      outline-offset: 2px !important;
      z-index: 999998 !important;
      transition: outline 0.2s ease, box-shadow 0.2s ease !important;
    }

    .${HIGHLIGHT_ID_BADGE_CLASS} {
      position: absolute !important;
      bottom: 2px !important;
      left: 50% !important;
      transform: translateX(-50%) !important;
      width: 28px !important;
      height: 28px !important;
      border-radius: 50% !important;
      background-color: #f59e0b;
      color: white !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-size: 14px !important;
      font-weight: bold !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
      z-index: 1000001 !important;
      pointer-events: none !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5) !important;
      border: 2px solid white !important;
    }

    @media (prefers-reduced-motion: reduce) {
      .${HIGHLIGHT_CLASS} {
        transition: none !important;
      }
    }
  `
  document.head.appendChild(style)
}

/**
 * Parses a CSS selector array from axe-core and returns a valid selector string
 */
function parseSelector(target: string[]): string {
  // axe-core returns target as an array like ['#app', 'div.content', 'button']
  return target.join(' ')
}

/**
 * Creates and configures a wrapper element for void elements
 */
function createWrapper(element: HTMLElement): HTMLElement {
  const wrapper = document.createElement('span')
  wrapper.style.position = 'relative'

  const computedStyle = window.getComputedStyle(element)
  const elementDisplay = computedStyle.display
  wrapper.style.display = elementDisplay

  // Preserve dimensions for block/inline-block elements
  if (elementDisplay === 'block' || elementDisplay === 'inline-block') {
    const elementWidth = element.offsetWidth
    const elementHeight = element.offsetHeight
    if (elementWidth > 0) wrapper.style.width = `${elementWidth}px`
    if (elementHeight > 0) wrapper.style.height = `${elementHeight}px`
  }

  return wrapper
}

/**
 * Wraps an element and adjusts its styles
 */
function wrapElement(element: HTMLElement, wrapper: HTMLElement): void {
  element.parentNode?.insertBefore(wrapper, element)
  wrapper.appendChild(element)

  // Ensure certain elements fill the wrapper
  if (FILL_WIDTH_ELEMENTS.has(element.tagName)) {
    element.style.width = '100%'
    if (element.tagName === 'IFRAME' && wrapper.style.height) {
      element.style.height = '100%'
    }
  }

  element.style.position = ''
}

/**
 * Creates an ID badge element
 */
function createIdBadge(id: number, color?: string): HTMLElement {
  const badge = document.createElement('div')
  badge.className = HIGHLIGHT_ID_BADGE_CLASS
  badge.textContent = String(id)
  if (color) badge.style.backgroundColor = color
  return badge
}

/**
 * Applies highlight styles to an element or wrapper
 */
function applyHighlightStyles(target: HTMLElement, color?: string): void {
  target.classList.add(HIGHLIGHT_CLASS)
  if (color) {
    target.style.setProperty('outline', `3px solid ${color}`, 'important')
    target.style.setProperty('box-shadow', `0 0 0 3px ${color}40`, 'important')
  }
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
  wrapper: HTMLElement | undefined,
  idBadge: HTMLElement | undefined,
  id: number,
  color?: string,
): HTMLElement {
  if (idBadge) {
    idBadge.textContent = String(id)
    if (color) idBadge.style.backgroundColor = color
    return idBadge
  }

  const newBadge = createIdBadge(id, color)
  const container = wrapper || element
  container.appendChild(newBadge)

  const index = highlighted.findIndex(h => h.element === element)
  if (index !== -1 && highlighted[index]) {
    highlighted[index].idBadge = newBadge
  }

  return newBadge
}

/**
 * Processes highlighting for a single element
 */
function processElementHighlight(
  element: HTMLElement,
  id: number | undefined,
  color: string | undefined,
): { wrapper?: HTMLElement, idBadge?: HTMLElement } {
  let wrapper: HTMLElement | undefined
  let idBadge: HTMLElement | undefined

  if (!canHaveChildren(element)) {
    // Void elements need wrapping
    wrapper = createWrapper(element)
    wrapElement(element, wrapper)
    if (id !== undefined) {
      idBadge = createIdBadge(id, color)
      wrapper.appendChild(idBadge)
    }
    applyHighlightStyles(wrapper, color)
  }
  else {
    // Normal elements
    const position = window.getComputedStyle(element).position
    if (position === 'static') element.style.position = 'relative'

    if (id !== undefined) {
      idBadge = createIdBadge(id, color)
      element.appendChild(idBadge)
    }
    applyHighlightStyles(element, color)
  }

  return { wrapper, idBadge }
}

/**
 * Highlights elements matching the given selector
 * Supports multiple simultaneous highlights by using a unique key
 * Uses reference counting to support multiple violations affecting the same element
 */
export function highlightElement(selector: string, id?: number, color?: string, scrollIntoView = false): void {
  injectStyles()

  // If already highlighted, increment reference count and update/add ID badge if provided
  if (highlightedElements.has(selector)) {
    const currentCount = selectorRefCount.get(selector) || 1
    selectorRefCount.set(selector, currentCount + 1)

    if (id !== undefined) {
      const highlighted = highlightedElements.get(selector)!
      highlighted.forEach(({ element, idBadge, wrapper }) => {
        updateOrCreateBadge(highlighted, element, wrapper, idBadge, id, color)
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
      const { wrapper, idBadge } = processElementHighlight(element, id, color)

      // Scroll into view if needed
      if (scrollIntoView && !isElementVisible(element)) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }

      highlighted.push({
        element,
        originalStyles,
        idBadge,
        wrapper,
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
 * Unwraps a wrapped element and restores it to its original state
 */
function unwrapElement(element: HTMLElement, wrapper: HTMLElement, originalStyles: HighlightedElement['originalStyles']): void {
  if (!wrapper.parentNode) return

  wrapper.classList.remove(HIGHLIGHT_CLASS)
  wrapper.parentNode.insertBefore(element, wrapper)
  wrapper.parentNode.removeChild(wrapper)
  restoreOriginalStyles(element, originalStyles)
}

/**
 * Removes ID badge from an element
 */
function removeBadge(idBadge: HTMLElement | undefined, parent: HTMLElement): void {
  if (!idBadge) return

  try {
    if (idBadge.parentNode === parent) {
      parent.removeChild(idBadge)
    }
    else if (idBadge.parentNode) {
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
  highlighted.forEach(({ element, originalStyles, idBadge, wrapper }) => {
    if (wrapper && wrapper.parentNode) {
      unwrapElement(element, wrapper, originalStyles)
    }
    else {
      element.classList.remove(HIGHLIGHT_CLASS)
      restoreOriginalStyles(element, originalStyles)
      removeBadge(idBadge, element)
    }
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

  highlighted.forEach((item) => {
    if (item.idBadge) {
      item.idBadge.textContent = String(id)
    }
    else {
      const newBadge = createIdBadge(id)
      item.element.appendChild(newBadge)
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

    const container = item.wrapper || item.element
    removeBadge(item.idBadge, container)
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
