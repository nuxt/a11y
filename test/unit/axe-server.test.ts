import { describe, it, expect } from 'vitest'
import { runAxeOnHtml } from '../../src/utils/axe-server'

const VALID_HTML = `<!DOCTYPE html>
<html lang="en">
<head><title>Test Page</title></head>
<body>
  <main>
    <h1>Hello World</h1>
    <p>Some content</p>
  </main>
</body>
</html>`

const HTML_WITH_VIOLATIONS = `<!DOCTYPE html>
<html>
<head></head>
<body>
  <img src="test.jpg">
  <img src="test2.jpg">
</body>
</html>`

describe('axe-server', () => {
  it('should return no violations for accessible HTML', async () => {
    const violations = await runAxeOnHtml(VALID_HTML, '/')
    expect(violations).toEqual([])
  })

  it('should detect violations in inaccessible HTML', async () => {
    const violations = await runAxeOnHtml(HTML_WITH_VIOLATIONS, '/')

    expect(violations.length).toBeGreaterThan(0)

    // Should detect missing alt text
    const imageAlt = violations.find(v => v.id === 'image-alt')
    expect(imageAlt).toBeDefined()
    expect(imageAlt!.impact).toBe('critical')
    expect(imageAlt!.route).toBe('/')
    expect(imageAlt!.nodes.length).toBeGreaterThan(0)
  })

  it('should set the route on each violation', async () => {
    const violations = await runAxeOnHtml(HTML_WITH_VIOLATIONS, '/about')

    for (const v of violations) {
      expect(v.route).toBe('/about')
    }
  })

  it('should return empty array for HTML without body', async () => {
    const violations = await runAxeOnHtml('<html><head></head></html>', '/')
    expect(violations).toEqual([])
  })

  it('should return empty array for empty body', async () => {
    const html = '<!DOCTYPE html><html><head></head><body>   </body></html>'
    const violations = await runAxeOnHtml(html, '/')
    expect(violations).toEqual([])
  })

  it('should return empty array for incomplete HTML', async () => {
    const violations = await runAxeOnHtml('<h1>Just a fragment</h1>', '/')
    expect(violations).toEqual([])
  })

  it('should include node targets and html in violations', async () => {
    const violations = await runAxeOnHtml(HTML_WITH_VIOLATIONS, '/')
    const imageAlt = violations.find(v => v.id === 'image-alt')

    expect(imageAlt).toBeDefined()
    for (const node of imageAlt!.nodes) {
      expect(node.target).toBeDefined()
      expect(node.target.length).toBeGreaterThan(0)
      expect(node.html).toBeDefined()
      expect(typeof node.html).toBe('string')
    }
  })

  it('should include tags and help URLs', async () => {
    const violations = await runAxeOnHtml(HTML_WITH_VIOLATIONS, '/')

    for (const v of violations) {
      expect(v.tags).toBeDefined()
      expect(Array.isArray(v.tags)).toBe(true)
      expect(v.helpUrl).toBeDefined()
      expect(typeof v.helpUrl).toBe('string')
    }
  })

  it('should not pollute globalThis after execution', async () => {
    const prevWindow = (globalThis as Record<string, unknown>).window
    const prevDocument = (globalThis as Record<string, unknown>).document
    const prevNode = (globalThis as Record<string, unknown>).Node

    await runAxeOnHtml(HTML_WITH_VIOLATIONS, '/')

    expect((globalThis as Record<string, unknown>).window).toBe(prevWindow)
    expect((globalThis as Record<string, unknown>).document).toBe(prevDocument)
    expect((globalThis as Record<string, unknown>).Node).toBe(prevNode)
  })

  it('should accept axe run options', async () => {
    // Run with only specific rules
    const violations = await runAxeOnHtml(HTML_WITH_VIOLATIONS, '/', {
      runOptions: { runOnly: { type: 'rule', values: ['image-alt'] } },
    })

    // Should only find image-alt violations
    expect(violations.every(v => v.id === 'image-alt')).toBe(true)
  })
})
