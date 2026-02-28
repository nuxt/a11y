import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, createPage, url } from '@nuxt/test-utils/e2e'
import { injectAxe, runAxeOnPage } from '../../src/test-utils/playwright'
import { toHaveNoA11yViolations } from '../../src/test-utils/matchers'

expect.extend({ toHaveNoA11yViolations })

describe('playwright test-utils integration with playground', async () => {
  await setup({
    dev: true,
    rootDir: fileURLToPath(new URL('../../playground', import.meta.url)),
    browser: true,
  })

  it('runAxeOnPage returns a valid ScanResult for the index page', async () => {
    const page = await createPage()
    await page.goto(url('/'), { waitUntil: 'networkidle' })

    const result = await runAxeOnPage(page)

    expect(result).toBeDefined()
    expect(result.violations).toBeInstanceOf(Array)
    expect(typeof result.violationCount).toBe('number')
    expect(result.violationCount).toBeGreaterThan(0)

    expect(result.getByImpact).toBeTypeOf('function')
    expect(result.getByRule).toBeTypeOf('function')
    expect(result.getByTag).toBeTypeOf('function')

    await page.close()
  })

  it('detects violations on /about-us', async () => {
    const page = await createPage()
    await page.goto(url('/about-us'), { waitUntil: 'networkidle' })

    const result = await runAxeOnPage(page)

    expect(result.violationCount).toBeGreaterThan(0)
    expect(result.violations.some(v => v.id === 'html-has-lang' || v.id === 'document-title')).toBe(true)

    await page.close()
  })

  it('detects violations on /contact', async () => {
    const page = await createPage()
    await page.goto(url('/contact'), { waitUntil: 'networkidle' })

    const result = await runAxeOnPage(page)

    expect(result.violationCount).toBeGreaterThan(0)

    await page.close()
  })

  it('ScanResult helper methods filter correctly on browser results', async () => {
    const page = await createPage()
    await page.goto(url('/'), { waitUntil: 'networkidle' })

    const result = await runAxeOnPage(page)

    const critical = result.getByImpact('critical')
    expect(critical).toBeInstanceOf(Array)
    expect(critical.length).toBeGreaterThan(0)
    expect(critical.every(v => v.impact === 'critical')).toBe(true)

    const imageAlt = result.getByRule('image-alt')
    expect(imageAlt.length).toBeGreaterThan(0)
    expect(imageAlt.every(v => v.id === 'image-alt')).toBe(true)

    const wcag2a = result.getByTag('wcag2a')
    expect(wcag2a).toBeInstanceOf(Array)
    expect(wcag2a.every(v => v.tags.includes('wcag2a'))).toBe(true)

    await page.close()
  })

  it('toHaveNoA11yViolations matcher works with Playwright scan results', async () => {
    const page = await createPage()
    await page.goto(url('/'), { waitUntil: 'networkidle' })

    const result = await runAxeOnPage(page)

    expect(() => {
      expect(result).toHaveNoA11yViolations()
    }).toThrow()

    await page.close()
  })

  it('waitForState: null skips waiting', async () => {
    const page = await createPage()
    await page.goto(url('/'), { waitUntil: 'networkidle' })

    const result = await runAxeOnPage(page, { waitForState: null })

    expect(result).toBeDefined()
    expect(result.violations).toBeInstanceOf(Array)
    expect(typeof result.violationCount).toBe('number')

    await page.close()
  })

  it('injectAxe is idempotent', async () => {
    const page = await createPage()
    await page.goto(url('/'), { waitUntil: 'networkidle' })

    await injectAxe(page)
    await injectAxe(page)

    const result = await runAxeOnPage(page)
    expect(result.violations).toBeInstanceOf(Array)

    await page.close()
  })
}, 120_000)
