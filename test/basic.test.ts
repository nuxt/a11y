import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, createPage, url } from '@nuxt/test-utils/e2e'

describe('ssr', async () => {
  await setup({
    dev: true,
    rootDir: fileURLToPath(new URL('../playground', import.meta.url)),
    browser: true,
  })

  it('renders the index page', async () => {
    const page = await createPage()
    const logs: string[] = []
    page.on('console', (msg) => {
      logs.push(msg.text())
    })
    await page.goto(url('/'), { waitUntil: 'hydration' })
    expect(logs.filter(l => !l.startsWith('[vite]') && !l.startsWith('<Suspense>'))).toMatchInlineSnapshot(`
      [
        "%ca11y%c Documents must have <title> element to aid in navigation
        https://dequeuniversity.com/rules/axe/4.11/document-title?application=axeAPI
       color: white; border-radius: 3px; padding: 2px 3px; font-size: 0.8em; background: #f25c54; ",
        "%ca11y%c Heading levels should only increase by one
        https://dequeuniversity.com/rules/axe/4.11/heading-order?application=axeAPI
       color: white; border-radius: 3px; padding: 2px 3px; font-size: 0.8em; background: #cf863e;  JSHandle@node",
        "%ca11y%c <html> element must have a lang attribute
        https://dequeuniversity.com/rules/axe/4.11/html-has-lang?application=axeAPI
       color: white; border-radius: 3px; padding: 2px 3px; font-size: 0.8em; background: #f25c54; ",
        "%ca11y%c Document should have one main landmark
        https://dequeuniversity.com/rules/axe/4.11/landmark-one-main?application=axeAPI
       color: white; border-radius: 3px; padding: 2px 3px; font-size: 0.8em; background: #cf863e; ",
        "%ca11y%c Page should contain a level-one heading
        https://dequeuniversity.com/rules/axe/4.11/page-has-heading-one?application=axeAPI
       color: white; border-radius: 3px; padding: 2px 3px; font-size: 0.8em; background: #cf863e; ",
        "%ca11y%c All page content should be contained by landmarks
        https://dequeuniversity.com/rules/axe/4.11/region?application=axeAPI
       color: white; border-radius: 3px; padding: 2px 3px; font-size: 0.8em; background: #cf863e;  JSHandle@node",
      ]
    `)
    await page.close()
  })
})
