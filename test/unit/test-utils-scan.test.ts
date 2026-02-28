import { describe, it, expect } from 'vitest'
import { runA11yScan } from '../../src/test-utils/index'

const ACCESSIBLE_HTML = `<!DOCTYPE html>
<html lang="en">
<head><title>Test Page</title></head>
<body>
  <main>
    <h1>Hello World</h1>
    <p>Some accessible content</p>
    <img src="photo.jpg" alt="A photo">
  </main>
</body>
</html>`

const INACCESSIBLE_HTML = `<!DOCTYPE html>
<html>
<head></head>
<body>
  <img src="hero.jpg">
  <img src="banner.jpg">
</body>
</html>`

describe('runA11yScan', () => {
  it('returns a ScanResult with the expected shape', async () => {
    const result = await runA11yScan(ACCESSIBLE_HTML)

    expect(result).toHaveProperty('violations')
    expect(result).toHaveProperty('violationCount')
    expect(result).toHaveProperty('getByImpact')
    expect(result).toHaveProperty('getByRule')
    expect(result).toHaveProperty('getByTag')
    expect(Array.isArray(result.violations)).toBe(true)
    expect(typeof result.violationCount).toBe('number')
    expect(typeof result.getByImpact).toBe('function')
    expect(typeof result.getByRule).toBe('function')
    expect(typeof result.getByTag).toBe('function')
  })

  it('returns zero violations for accessible HTML', async () => {
    const result = await runA11yScan(ACCESSIBLE_HTML)

    expect(result.violations).toEqual([])
    expect(result.violationCount).toBe(0)
  })

  it('detects violations in inaccessible HTML', async () => {
    const result = await runA11yScan(INACCESSIBLE_HTML)

    expect(result.violationCount).toBeGreaterThan(0)
    expect(result.violations.length).toBe(result.violationCount)

    const imageAlt = result.violations.find(v => v.id === 'image-alt')
    expect(imageAlt).toBeDefined()
    expect(imageAlt!.impact).toBe('critical')
    expect(imageAlt!.nodes.length).toBeGreaterThanOrEqual(2)
  })

  it('getByImpact() filters violations by impact level', async () => {
    const result = await runA11yScan(INACCESSIBLE_HTML)

    const critical = result.getByImpact('critical')
    expect(critical.length).toBeGreaterThan(0)
    expect(critical.every(v => v.impact === 'critical')).toBe(true)

    const minor = result.getByImpact('minor')
    expect(minor.every(v => v.impact === 'minor')).toBe(true)
  })

  it('getByRule() filters violations by rule ID', async () => {
    const result = await runA11yScan(INACCESSIBLE_HTML)

    const imageAlt = result.getByRule('image-alt')
    expect(imageAlt.length).toBeGreaterThan(0)
    expect(imageAlt.every(v => v.id === 'image-alt')).toBe(true)

    const nonExistent = result.getByRule('non-existent-rule')
    expect(nonExistent).toEqual([])
  })

  it('getByTag() filters violations by tag', async () => {
    const result = await runA11yScan(INACCESSIBLE_HTML)

    const wcag2a = result.getByTag('wcag2a')
    expect(wcag2a.length).toBeGreaterThan(0)
    expect(wcag2a.every(v => v.tags.includes('wcag2a'))).toBe(true)

    const nonExistent = result.getByTag('non-existent-tag')
    expect(nonExistent).toEqual([])
  })

  it('passes ScanOptions through to runAxeOnHtml()', async () => {
    const result = await runA11yScan(INACCESSIBLE_HTML, {
      runOptions: { runOnly: { type: 'rule', values: ['image-alt'] } },
    })

    expect(result.violations.every(v => v.id === 'image-alt')).toBe(true)
  })

  it('sets route to "test" on violations', async () => {
    const result = await runA11yScan(INACCESSIBLE_HTML)

    for (const v of result.violations) {
      expect(v.route).toBe('test')
    }
  })
})
