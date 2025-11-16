import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, createPage, url } from '@nuxt/test-utils/e2e'

describe('ssr', async () => {
  await setup({
    dev: true,
    rootDir: fileURLToPath(new URL('../playground', import.meta.url)),
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
       color: white; border-radius: 3px; padding: 2px 3px; font-size: 0.8em; background: #FF6E40;  JSHandle@node JSHandle@node JSHandle@node JSHandle@node JSHandle@node",
        "%ca11y%c Documents must have <title> element to aid in navigation
        https://dequeuniversity.com/rules/axe/4.11/document-title?application=axeAPI
       color: white; border-radius: 3px; padding: 2px 3px; font-size: 0.8em; background: #FF6E40; ",
        "%ca11y%c Heading levels should only increase by one
        https://dequeuniversity.com/rules/axe/4.11/heading-order?application=axeAPI
       color: white; border-radius: 3px; padding: 2px 3px; font-size: 0.8em; background: #FFB300;  JSHandle@node JSHandle@node",
        "%ca11y%c <html> element must have a lang attribute
        https://dequeuniversity.com/rules/axe/4.11/html-has-lang?application=axeAPI
       color: white; border-radius: 3px; padding: 2px 3px; font-size: 0.8em; background: #FF6E40; ",
        "%ca11y%c Images must have alternative text
        https://dequeuniversity.com/rules/axe/4.11/image-alt?application=axeAPI
       color: white; border-radius: 3px; padding: 2px 3px; font-size: 0.8em; background: #ff1e1eff;  JSHandle@node JSHandle@node JSHandle@node JSHandle@node JSHandle@node JSHandle@node",
        "%ca11y%c Form elements must have labels
        https://dequeuniversity.com/rules/axe/4.11/label?application=axeAPI
       color: white; border-radius: 3px; padding: 2px 3px; font-size: 0.8em; background: #ff1e1eff;  JSHandle@node",
        "%ca11y%c Links must have discernible text
        https://dequeuniversity.com/rules/axe/4.11/link-name?application=axeAPI
       color: white; border-radius: 3px; padding: 2px 3px; font-size: 0.8em; background: #FF6E40;  JSHandle@node JSHandle@node",
        "%ca11y%c Elements must meet minimum color contrast ratio thresholds
        https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=axeAPI
       color: white; border-radius: 3px; padding: 2px 3px; font-size: 0.8em; background: #FF6E40;  JSHandle@node JSHandle@node JSHandle@node JSHandle@node JSHandle@node",
        "%ca11y%c Documents must have <title> element to aid in navigation
        https://dequeuniversity.com/rules/axe/4.11/document-title?application=axeAPI
       color: white; border-radius: 3px; padding: 2px 3px; font-size: 0.8em; background: #FF6E40; ",
        "%ca11y%c Heading levels should only increase by one
        https://dequeuniversity.com/rules/axe/4.11/heading-order?application=axeAPI
       color: white; border-radius: 3px; padding: 2px 3px; font-size: 0.8em; background: #FFB300;  JSHandle@node JSHandle@node",
        "%ca11y%c <html> element must have a lang attribute
        https://dequeuniversity.com/rules/axe/4.11/html-has-lang?application=axeAPI
       color: white; border-radius: 3px; padding: 2px 3px; font-size: 0.8em; background: #FF6E40; ",
        "%ca11y%c Images must have alternative text
        https://dequeuniversity.com/rules/axe/4.11/image-alt?application=axeAPI
       color: white; border-radius: 3px; padding: 2px 3px; font-size: 0.8em; background: #ff1e1eff;  JSHandle@node JSHandle@node JSHandle@node JSHandle@node JSHandle@node JSHandle@node",
        "%ca11y%c Form elements must have labels
        https://dequeuniversity.com/rules/axe/4.11/label?application=axeAPI
       color: white; border-radius: 3px; padding: 2px 3px; font-size: 0.8em; background: #ff1e1eff;  JSHandle@node",
        "%ca11y%c Links must have discernible text
        https://dequeuniversity.com/rules/axe/4.11/link-name?application=axeAPI
       color: white; border-radius: 3px; padding: 2px 3px; font-size: 0.8em; background: #FF6E40;  JSHandle@node JSHandle@node",
      ]
    `)

    await page.close()
  }, 20000)
})
