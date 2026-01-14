import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, createPage, url } from '@nuxt/test-utils/e2e'

describe('ssr', async () => {
  await setup({
    dev: true,
    rootDir: fileURLToPath(new URL('../../playground', import.meta.url)),
    browser: true,
  })

  it('renders the index page and runs axe-core scan', async () => {
    const page = await createPage()
    const logs: string[] = []
    page.on('console', (msg) => {
      logs.push(msg.text())
    })
    await page.goto(url('/'), { waitUntil: 'hydration' })

    // Trigger the axe scan using the exposed test helper
    await page.evaluate(async () => {
      type TestWindow = Window & {
        __nuxt_a11y_run__?: () => Promise<void>
      }

      const win = window as TestWindow

      // Call the exposed run function if available
      if (win.__nuxt_a11y_run__) {
        await win.__nuxt_a11y_run__()
      }
    })

    // Filter for a11y violation logs
    const a11yLogs = logs.filter(l => l.includes('%ca11y%c'))

    // Expect violations to be logged
    expect(a11yLogs).toMatchInlineSnapshot(`
      [
        "%ca11y%c Elements must meet minimum color contrast ratio thresholds
        https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=axeAPI
       color: white; border-radius: 3px; padding: 2px 3px; font-size: 0.8em; background: #431407;  <a href="#" class="button-primary" style="background:#888;color:#aaa;" data-v-02281a80="">Get Started</a> <p style="color:#999;" data-v-02281a80=""> We create beautiful designs that may or may not be accessible. </p> <p style="color:#999;" data-v-02281a80=""> Building web applications with various accessibility challenges. </p> <p style="color:#999;" data-v-02281a80=""> Creating mobile experiences for testing purposes. </p> <p data-v-433a9abd="">© 2025 A11y Playground. All rights reserved.</p>",
        "%ca11y%c Documents must have <title> element to aid in navigation
        https://dequeuniversity.com/rules/axe/4.11/document-title?application=axeAPI
       color: white; border-radius: 3px; padding: 2px 3px; font-size: 0.8em; background: #431407; ",
        "%ca11y%c Heading levels should only increase by one
        https://dequeuniversity.com/rules/axe/4.11/heading-order?application=axeAPI
       color: white; border-radius: 3px; padding: 2px 3px; font-size: 0.8em; background: #422006;  <h4 data-v-02281a80="">Discover common accessibility issues in modern web applications</h4> <h4 data-v-433a9abd="">About Us</h4>",
        "%ca11y%c <html> element must have a lang attribute
        https://dequeuniversity.com/rules/axe/4.11/html-has-lang?application=axeAPI
       color: white; border-radius: 3px; padding: 2px 3px; font-size: 0.8em; background: #431407; ",
        "%ca11y%c Images must have alternative text
        https://dequeuniversity.com/rules/axe/4.11/image-alt?application=axeAPI
       color: white; border-radius: 3px; padding: 2px 3px; font-size: 0.8em; background: #450a0a;  <img src="https://placehold.co/150x50/4F46E5/ffffff?text=A11y+Test" class="logo-img" data-v-433a9abd=""> <img src="https://placehold.co/800x400/6366F1/ffffff?text=Hero+Image" class="hero-image" data-v-02281a80=""> <img src="https://placehold.co/300x200/EF4444/ffffff?text=Image+1" data-v-02281a80=""> <img src="https://placehold.co/300x200/10B981/ffffff?text=Image+2" data-v-02281a80=""> <img src="https://placehold.co/300x200/3B82F6/ffffff?text=Image+3" data-v-02281a80=""> <img src="https://placehold.co/300x200/F59E0B/ffffff?text=Image+4" data-v-02281a80="">",
        "%ca11y%c Form elements must have labels
        https://dequeuniversity.com/rules/axe/4.11/label?application=axeAPI
       color: white; border-radius: 3px; padding: 2px 3px; font-size: 0.8em; background: #450a0a;  <input id="agree" type="checkbox" data-v-02281a80="">",
        "%ca11y%c Links must have discernible text
        https://dequeuniversity.com/rules/axe/4.11/link-name?application=axeAPI
       color: white; border-radius: 3px; padding: 2px 3px; font-size: 0.8em; background: #431407;  <a aria-current="page" href="/" class="router-link-active router-link-exact-active logo" data-v-433a9abd=""><img src="https://placehold.co/150x50/4F46E5/ffffff?text=A11y+Test" class="logo-img" data-v-433a9abd=""></a> <a href="#" class="button-secondary" data-v-02281a80=""></a>",
        "%ca11y%c Elements must meet minimum color contrast ratio thresholds
        https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=axeAPI
       color: white; border-radius: 3px; padding: 2px 3px; font-size: 0.8em; background: #431407;  <a href="#" class="button-primary" style="background:#888;color:#aaa;" data-v-02281a80="">Get Started</a> <p style="color:#999;" data-v-02281a80=""> We create beautiful designs that may or may not be accessible. </p> <p style="color:#999;" data-v-02281a80=""> Building web applications with various accessibility challenges. </p> <p style="color:#999;" data-v-02281a80=""> Creating mobile experiences for testing purposes. </p> <p data-v-433a9abd="">© 2025 A11y Playground. All rights reserved.</p>",
        "%ca11y%c Documents must have <title> element to aid in navigation
        https://dequeuniversity.com/rules/axe/4.11/document-title?application=axeAPI
       color: white; border-radius: 3px; padding: 2px 3px; font-size: 0.8em; background: #431407; ",
        "%ca11y%c Heading levels should only increase by one
        https://dequeuniversity.com/rules/axe/4.11/heading-order?application=axeAPI
       color: white; border-radius: 3px; padding: 2px 3px; font-size: 0.8em; background: #422006;  <h4 data-v-02281a80="">Discover common accessibility issues in modern web applications</h4> <h4 data-v-433a9abd="">About Us</h4>",
        "%ca11y%c <html> element must have a lang attribute
        https://dequeuniversity.com/rules/axe/4.11/html-has-lang?application=axeAPI
       color: white; border-radius: 3px; padding: 2px 3px; font-size: 0.8em; background: #431407; ",
        "%ca11y%c Images must have alternative text
        https://dequeuniversity.com/rules/axe/4.11/image-alt?application=axeAPI
       color: white; border-radius: 3px; padding: 2px 3px; font-size: 0.8em; background: #450a0a;  <img src="https://placehold.co/150x50/4F46E5/ffffff?text=A11y+Test" class="logo-img" data-v-433a9abd=""> <img src="https://placehold.co/800x400/6366F1/ffffff?text=Hero+Image" class="hero-image" data-v-02281a80=""> <img src="https://placehold.co/300x200/EF4444/ffffff?text=Image+1" data-v-02281a80=""> <img src="https://placehold.co/300x200/10B981/ffffff?text=Image+2" data-v-02281a80=""> <img src="https://placehold.co/300x200/3B82F6/ffffff?text=Image+3" data-v-02281a80=""> <img src="https://placehold.co/300x200/F59E0B/ffffff?text=Image+4" data-v-02281a80="">",
        "%ca11y%c Form elements must have labels
        https://dequeuniversity.com/rules/axe/4.11/label?application=axeAPI
       color: white; border-radius: 3px; padding: 2px 3px; font-size: 0.8em; background: #450a0a;  <input id="agree" type="checkbox" data-v-02281a80="">",
        "%ca11y%c Links must have discernible text
        https://dequeuniversity.com/rules/axe/4.11/link-name?application=axeAPI
       color: white; border-radius: 3px; padding: 2px 3px; font-size: 0.8em; background: #431407;  <a aria-current="page" href="/" class="router-link-active router-link-exact-active logo" data-v-433a9abd=""><img src="https://placehold.co/150x50/4F46E5/ffffff?text=A11y+Test" class="logo-img" data-v-433a9abd=""></a> <a href="#" class="button-secondary" data-v-02281a80=""></a>",
      ]
    `)

    await page.close()
  }, 20000)

  it('navigates between pages and runs scans on each page', async () => {
    const page = await createPage()
    const logs: string[] = []

    page.on('console', (msg) => {
      logs.push(msg.text())
    })

    // Helper function to run axe scan
    const runAxeScan = async () => {
      await page.evaluate(async () => {
        type TestWindow = Window & {
          __nuxt_a11y_run__?: () => Promise<void>
        }
        const win = window as TestWindow
        if (win.__nuxt_a11y_run__) {
          await win.__nuxt_a11y_run__()
        }
      })
    }

    // Helper function to get a11y logs since last check
    const getNewA11yLogs = () => {
      const a11yLogs = logs.filter(l => l.includes('%ca11y%c'))
      const newLogs = [...a11yLogs]
      logs.length = 0 // Clear logs for next page
      return newLogs
    }

    // 1. Start at home page
    await page.goto(url('/'), { waitUntil: 'hydration' })
    await runAxeScan()
    const homeLogs = getNewA11yLogs()

    expect(homeLogs.length).toBeGreaterThan(0)
    expect(homeLogs.some(log => log.includes('image-alt'))).toBe(true)
    expect(homeLogs.some(log => log.includes('document-title'))).toBe(true)
    expect(homeLogs.some(log => log.includes('select-name') || log.includes('frame-title'))).toBe(false)

    // 2. Navigate to About Us page
    await page.goto(url('/about-us'), { waitUntil: 'hydration' })
    await page.waitForTimeout(500) // Wait for page to settle
    await runAxeScan()
    const aboutLogs = getNewA11yLogs()

    expect(aboutLogs.length).toBeGreaterThan(0)
    // About page should still have common violations like document-title, html-has-lang
    expect(aboutLogs.some(log => log.includes('document-title') || log.includes('html-has-lang'))).toBe(true)
    expect(aboutLogs.some(log => log.includes('select-name') || log.includes('frame-title'))).toBe(false)

    // 3. Navigate to Contact page
    await page.goto(url('/contact'), { waitUntil: 'hydration' })
    await page.waitForTimeout(500) // Wait for page to settle
    await runAxeScan()
    const contactLogs = getNewA11yLogs()

    expect(contactLogs.length).toBeGreaterThan(0)
    // Contact page might have form-related violations
    expect(contactLogs.some(log => log.includes('select-name') || log.includes('frame-title'))).toBe(true)

    // 4. Navigate back to home page
    await page.goto(url('/'), { waitUntil: 'hydration' })
    await page.waitForTimeout(500) // Wait for page to settle
    await runAxeScan()
    const homeAgainLogs = getNewA11yLogs()

    expect(homeAgainLogs.length).toBeGreaterThan(0)
    // Should have similar violations as the first home page scan
    expect(homeAgainLogs.some(log => log.includes('image-alt'))).toBe(true)

    // Verify we're back at home by checking the URL
    expect(page.url()).toBe(url('/'))

    await page.close()
  }, 30000)
})
