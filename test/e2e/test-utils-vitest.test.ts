import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import { runA11yScan } from '../../src/test-utils/index'
import { toHaveNoA11yViolations } from '../../src/test-utils/matchers'

expect.extend({ toHaveNoA11yViolations })

describe('vitest test-utils integration with playground', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../../playground', import.meta.url)),
  })

  async function fetchHtml(route: string): Promise<string> {
    return await $fetch<string>(route, { responseType: 'text' })
  }

  it('runA11yScan returns a valid ScanResult for the index page', async () => {
    const html = await fetchHtml('/')
    const result = await runA11yScan(html)

    expect(result).toBeDefined()
    expect(result.violations).toBeInstanceOf(Array)
    expect(typeof result.violationCount).toBe('number')
    expect(result.violationCount).toBeGreaterThan(0)
  })

  it('detects violations on /about-us', async () => {
    const html = await fetchHtml('/about-us')
    const result = await runA11yScan(html)

    expect(result.violationCount).toBeGreaterThan(0)
    expect(result.violations.some(v => v.id === 'html-has-lang' || v.id === 'document-title')).toBe(true)
  })

  it('detects violations on /contact', async () => {
    const html = await fetchHtml('/contact')
    const result = await runA11yScan(html)

    expect(result.violationCount).toBeGreaterThan(0)
  })

  it('ScanResult helper methods filter correctly', async () => {
    const html = await fetchHtml('/')
    const result = await runA11yScan(html)

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
  })

  it('getByImpact returns empty array for non-matching level', async () => {
    const html = await fetchHtml('/')
    const result = await runA11yScan(html)

    const minor = result.getByImpact('minor')
    expect(minor).toBeInstanceOf(Array)
    expect(minor.every(v => v.impact === 'minor')).toBe(true)
  })

  it('getByRule returns empty array for non-existent rule', async () => {
    const html = await fetchHtml('/')
    const result = await runA11yScan(html)

    const nonExistent = result.getByRule('non-existent-rule')
    expect(nonExistent).toHaveLength(0)
  })

  it('toHaveNoA11yViolations fails on pages with violations', async () => {
    const html = await fetchHtml('/')
    const result = await runA11yScan(html)

    expect(() => {
      expect(result).toHaveNoA11yViolations()
    }).toThrow()
  })

  it('toHaveNoA11yViolations failure message includes violation details', async () => {
    const html = await fetchHtml('/')
    const result = await runA11yScan(html)

    let failureMessage = ''
    try {
      expect(result).toHaveNoA11yViolations()
    }
    catch (error) {
      failureMessage = (error as Error).message
    }

    expect(failureMessage).toContain('image-alt')
    expect(failureMessage).toContain('critical')
  })

  it('toHaveNoA11yViolations supports filtering by impact', async () => {
    const html = await fetchHtml('/')
    const result = await runA11yScan(html)

    expect(() => {
      expect(result).toHaveNoA11yViolations({ impact: 'critical' })
    }).toThrow()
  })

  it('toHaveNoA11yViolations supports filtering by rules', async () => {
    const html = await fetchHtml('/')
    const result = await runA11yScan(html)

    expect(() => {
      expect(result).toHaveNoA11yViolations({ rules: ['image-alt'] })
    }).toThrow()
  })
}, 60_000)
