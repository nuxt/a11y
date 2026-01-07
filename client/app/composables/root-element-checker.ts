/**
 * Client-side check if a selector targets root elements
 * This allows us to prevent pinning and highlighting attempts on elements like <html> and <body>
 */
export function isRootElementSelector(selector: string): boolean {
  try {
    const element = document.querySelector(selector)
    if (!element) return false

    // Find the Nuxt root element
    const nuxtRoot = document.querySelector('#__nuxt')
    if (!nuxtRoot) return false

    // If the selected element contains the Nuxt root (or is the Nuxt root (#__nuxt) itself),
    // it's a root-level element that's too broad to be useful for highlighting
    return element.contains(nuxtRoot)
  }
  catch {
    // If querySelector fails (invalid selector), assume it's not a root element
    return false
  }
}
