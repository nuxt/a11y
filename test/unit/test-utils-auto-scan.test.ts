import { describe, it, expect } from 'vitest'
import { createAutoScan } from '../../src/test-utils/auto-scan'

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

describe('createAutoScan', () => {
  it('accumulates results from multiple routes', async () => {
    const autoScan = createAutoScan()

    await autoScan.scanFetchedHtml('/', INACCESSIBLE_HTML)
    await autoScan.scanFetchedHtml('/about', INACCESSIBLE_HTML)

    const results = autoScan.getResults()
    expect(Object.keys(results)).toHaveLength(2)
    expect(results['/']).toBeDefined()
    expect(results['/about']).toBeDefined()
  })

  it('returns results keyed by URL with ScanResult shape', async () => {
    const autoScan = createAutoScan()

    await autoScan.scanFetchedHtml('/page-a', INACCESSIBLE_HTML)
    await autoScan.scanFetchedHtml('/page-b', INACCESSIBLE_HTML)

    const results = autoScan.getResults()
    for (const url of ['/page-a', '/page-b']) {
      const result = results[url]!
      expect(result).toBeDefined()
      expect(result.violationCount).toBeGreaterThan(0)
      expect(Array.isArray(result.violations)).toBe(true)
      expect(typeof result.getByImpact).toBe('function')
      expect(typeof result.getByRule).toBe('function')
      expect(typeof result.getByTag).toBe('function')
    }
  })

  it('excludes routes matching string patterns', async () => {
    const autoScan = createAutoScan({ exclude: ['/admin'] })

    await autoScan.scanFetchedHtml('/admin', INACCESSIBLE_HTML)
    await autoScan.scanFetchedHtml('/admin/users', INACCESSIBLE_HTML)
    await autoScan.scanFetchedHtml('/', INACCESSIBLE_HTML)

    const results = autoScan.getResults()
    expect(Object.keys(results)).toEqual(['/'])
  })

  it('excludes routes matching RegExp patterns', async () => {
    const autoScan = createAutoScan({ exclude: [/^\/api\//] })

    await autoScan.scanFetchedHtml('/api/health', INACCESSIBLE_HTML)
    await autoScan.scanFetchedHtml('/api/users', INACCESSIBLE_HTML)
    await autoScan.scanFetchedHtml('/', INACCESSIBLE_HTML)

    const results = autoScan.getResults()
    expect(Object.keys(results)).toEqual(['/'])
  })

  it('scans a mix of accessible and inaccessible pages', async () => {
    const autoScan = createAutoScan()

    await autoScan.scanFetchedHtml('/broken-a', INACCESSIBLE_HTML)
    await autoScan.scanFetchedHtml('/ok', ACCESSIBLE_HTML)
    await autoScan.scanFetchedHtml('/broken-b', INACCESSIBLE_HTML)

    const results = autoScan.getResults()
    expect(Object.keys(results)).toHaveLength(3)
    expect(results['/broken-a']!.violationCount).toBeGreaterThan(0)
    expect(results['/broken-b']!.violationCount).toBeGreaterThan(0)
    expect(results['/ok']!.violationCount).toBeLessThan(results['/broken-a']!.violationCount)
  })

  it('exceedsThreshold() returns false when violations are within threshold', async () => {
    const autoScan = createAutoScan({ threshold: 100 })

    await autoScan.scanFetchedHtml('/', INACCESSIBLE_HTML)

    expect(autoScan.exceedsThreshold()).toBe(false)
  })

  it('exceedsThreshold() returns true when violations exceed threshold', async () => {
    const autoScan = createAutoScan({ threshold: 1 })

    await autoScan.scanFetchedHtml('/', INACCESSIBLE_HTML)
    await autoScan.scanFetchedHtml('/other', INACCESSIBLE_HTML)

    expect(autoScan.exceedsThreshold()).toBe(true)
  })

  it('exceedsThreshold() with default threshold of 0 treats any violation as exceeding', async () => {
    const autoScan = createAutoScan()

    const results = autoScan.getResults()
    expect(Object.keys(results)).toHaveLength(0)
    expect(autoScan.exceedsThreshold()).toBe(false)

    await autoScan.scanFetchedHtml('/broken', INACCESSIBLE_HTML)
    expect(autoScan.exceedsThreshold()).toBe(true)
  })
})
