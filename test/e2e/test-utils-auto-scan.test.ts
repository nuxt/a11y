import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import { createAutoScan } from '../../src/test-utils/auto-scan'

describe('auto-scan integration with playground', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../../playground', import.meta.url)),
  })

  const routes = ['/', '/about-us', '/contact', '/interactive']

  async function fetchHtml(route: string): Promise<string> {
    return await $fetch<string>(route, { responseType: 'text' })
  }

  it('scans all playground routes and accumulates results', async () => {
    const autoScan = createAutoScan({ threshold: 50 })

    for (const route of routes) {
      const html = await fetchHtml(route)
      await autoScan.scanFetchedHtml(route, html)
    }

    const results = autoScan.getResults()

    for (const route of routes) {
      expect(results[route]).toBeDefined()
      expect(results[route]!.violations).toBeInstanceOf(Array)
      expect(typeof results[route]!.violationCount).toBe('number')
    }
  })

  it('detects violations on playground pages', async () => {
    const autoScan = createAutoScan()

    for (const route of routes) {
      const html = await fetchHtml(route)
      await autoScan.scanFetchedHtml(route, html)
    }

    const results = autoScan.getResults()
    const totalViolations = Object.values(results).reduce(
      (sum, r) => sum + r.violationCount,
      0,
    )

    expect(totalViolations).toBeGreaterThan(0)
  })

  it('exceedsThreshold returns false when within high threshold', async () => {
    const autoScan = createAutoScan({ threshold: 500 })

    for (const route of routes) {
      const html = await fetchHtml(route)
      await autoScan.scanFetchedHtml(route, html)
    }

    expect(autoScan.exceedsThreshold()).toBe(false)
  })

  it('exceedsThreshold returns true with low threshold', async () => {
    const autoScan = createAutoScan({ threshold: 1 })

    for (const route of routes) {
      const html = await fetchHtml(route)
      await autoScan.scanFetchedHtml(route, html)
    }

    expect(autoScan.exceedsThreshold()).toBe(true)
  })

  it('excludes routes matching string patterns', async () => {
    const autoScan = createAutoScan({ exclude: ['/interactive'] })

    for (const route of routes) {
      const html = await fetchHtml(route)
      await autoScan.scanFetchedHtml(route, html)
    }

    const results = autoScan.getResults()

    expect(results['/interactive']).toBeUndefined()
    expect(results['/']).toBeDefined()
    expect(results['/about-us']).toBeDefined()
    expect(results['/contact']).toBeDefined()
  })

  it('excludes routes matching RegExp patterns', async () => {
    const autoScan = createAutoScan({ exclude: [/interactive/] })

    for (const route of routes) {
      const html = await fetchHtml(route)
      await autoScan.scanFetchedHtml(route, html)
    }

    const results = autoScan.getResults()

    expect(results['/interactive']).toBeUndefined()
    expect(Object.keys(results)).toHaveLength(3)
  })

  it('ScanResult helper methods work on accumulated results', async () => {
    const autoScan = createAutoScan()

    const html = await fetchHtml('/')
    await autoScan.scanFetchedHtml('/', html)

    const results = autoScan.getResults()
    const indexResult = results['/']!

    expect(indexResult.getByImpact).toBeTypeOf('function')
    expect(indexResult.getByRule).toBeTypeOf('function')
    expect(indexResult.getByTag).toBeTypeOf('function')

    const critical = indexResult.getByImpact('critical')
    expect(critical).toBeInstanceOf(Array)

    const imageAlt = indexResult.getByRule('image-alt')
    expect(imageAlt.length).toBeGreaterThan(0)
  })

  it('exceedsThreshold defaults to 0 (any violation exceeds)', async () => {
    const autoScan = createAutoScan()

    const html = await fetchHtml('/')
    await autoScan.scanFetchedHtml('/', html)

    expect(autoScan.exceedsThreshold()).toBe(true)
  })
}, 60_000)
