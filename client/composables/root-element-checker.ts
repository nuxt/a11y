/**
 * Client-side check if a selector targets root elements
 * This allows us to prevent pinning and highlighting attempts on elements like <html> and <body>
 */
export function isRootElementSelector(selector: string): boolean {
  // Check if selector matches html, body, head (case-insensitive)
  const normalizedSelector = selector.trim().toLowerCase()

  // Match patterns like: html, body, head, html[lang], body.class, etc.
  const rootPatterns = [
    /^html\b/,
    /^body\b/,
    /^head\b/,
    /^document$/,
    /^window$/,
  ]

  return rootPatterns.some(pattern => pattern.test(normalizedSelector))
}
