import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, createPage, url } from '@nuxt/test-utils/e2e'
import { injectAxe, runAxeOnPage, observePage } from '../../src/test-utils/browser'
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

  it('observePage detects violations after click, input, and DOM mutations', async () => {
    const page = await createPage()
    await page.goto(url('/interactive'), { waitUntil: 'networkidle' })

    const results: { url: string, violationCount: number }[] = []
    const stop = await observePage(page, (pageUrl, result) => {
      results.push({ url: pageUrl, violationCount: result.violationCount })
    }, { debounceMs: 200 })

    await page.waitForTimeout(400)

    // click "Load Notifications" — injects images without alt text
    await page.click('button.load-btn')
    await expect.poll(() => results.length, { timeout: 10_000 }).toBeGreaterThan(0)
    expect(results.some(r => r.violationCount > 0)).toBe(true)

    const afterClick = results.length

    // fill profile form — triggers Vue reactivity, renders preview section
    await page.fill('input[placeholder="Display name"]', 'Test User')
    await expect.poll(() => results.length, { timeout: 10_000 }).toBeGreaterThan(afterClick)

    // select a role — triggers another DOM update
    const afterFill = results.length
    await page.selectOption('select.form-input', 'Developer')
    await expect.poll(() => results.length, { timeout: 10_000 }).toBeGreaterThan(afterFill)

    const afterSelect = results.length

    // inject raw DOM element — img without alt
    await page.evaluate(() => {
      const img = document.createElement('img')
      img.src = 'broken.png'
      document.body.appendChild(img)
    })
    await expect.poll(() => results.length, { timeout: 10_000 }).toBeGreaterThan(afterSelect)

    await stop()
    await page.close()
  })

  it('observePage stop prevents further callbacks across interactions', async () => {
    const page = await createPage()
    await page.goto(url('/interactive'), { waitUntil: 'networkidle' })

    const results: { url: string, violationCount: number }[] = []
    const stop = await observePage(page, (pageUrl, result) => {
      results.push({ url: pageUrl, violationCount: result.violationCount })
    }, { debounceMs: 200 })

    await page.waitForTimeout(400)
    await stop()

    await page.click('button.load-btn')
    await page.waitForTimeout(1000)

    await page.fill('input[placeholder="Display name"]', 'Test User')
    await page.waitForTimeout(1000)

    await page.evaluate(() => {
      const img = document.createElement('img')
      img.src = 'broken.png'
      document.body.appendChild(img)
    })
    await page.waitForTimeout(1000)

    expect(results.length).toBe(0)

    await page.close()
  })

  it('observePage detects violations across SPA navigations and interactions', async () => {
    const page = await createPage()
    await page.goto(url('/interactive'), { waitUntil: 'networkidle' })

    const results: { url: string, violationCount: number }[] = []
    const stop = await observePage(page, (pageUrl, result) => {
      results.push({ url: pageUrl, violationCount: result.violationCount })
    }, { debounceMs: 200 })

    await page.waitForTimeout(400)

    // interact on /interactive — click "Load Notifications"
    await page.click('button.load-btn')
    await expect.poll(() => results.length, { timeout: 10_000 }).toBeGreaterThan(0)

    const afterFirstInteraction = results.length

    // SPA navigate to /contact via NuxtLink — observer survives
    await page.click('a[href="/contact"]')
    await page.waitForFunction(() => window.location.pathname === '/contact')
    await expect.poll(() => results.length, { timeout: 10_000 }).toBeGreaterThan(afterFirstInteraction)

    const afterSpaNav = results.length

    // inject a violation on /contact
    await page.evaluate(() => {
      const form = document.createElement('form')
      const input = document.createElement('input')
      input.type = 'text'
      form.appendChild(input)
      document.body.appendChild(form)
    })
    await expect.poll(() => results.length, { timeout: 10_000 }).toBeGreaterThan(afterSpaNav)

    const afterContactMutation = results.length

    // SPA navigate back to /interactive
    await page.click('a[href="/interactive"]')
    await page.waitForFunction(() => window.location.pathname === '/interactive')
    await expect.poll(() => results.length, { timeout: 10_000 }).toBeGreaterThan(afterContactMutation)

    const afterSecondNav = results.length

    // interact again — fill the comment form and submit
    await page.fill('input[placeholder="Write a comment..."]', 'Test comment')
    await page.click('button[type="submit"]')
    await expect.poll(() => results.length, { timeout: 10_000 }).toBeGreaterThan(afterSecondNav)

    expect(results.every(r => r.url.length > 0)).toBe(true)

    await stop()
    await page.close()
  })
}, 120_000)
