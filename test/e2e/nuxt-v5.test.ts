import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, createPage, url } from '@nuxt/test-utils/e2e'

describe('nuxt v5', async () => {
  await setup({
    dev: true,
    rootDir: fileURLToPath(new URL('../fixtures/nuxt-v5', import.meta.url)),
    browser: true,
  })

  it('navigates between pages and runs scans on each page', async () => {
    const page = await createPage()
    const logs: string[] = []

    page.on('console', (msg) => {
      logs.push(msg.text())
    })

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

    const getNewA11yLogs = () => {
      const a11yLogs = logs.filter(l => l.includes('%ca11y%c'))
      logs.length = 0
      return a11yLogs
    }

    await page.goto(url('/'), { waitUntil: 'hydration' })
    await runAxeScan()
    const homeLogs = getNewA11yLogs()

    expect(homeLogs.some(log => log.includes('image-alt'))).toBe(true)
    expect(homeLogs.some(log => log.includes('document-title'))).toBe(true)
    expect(homeLogs.some(log => log.includes('label?'))).toBe(true)
    expect(homeLogs.some(log => log.includes('select-name') || log.includes('frame-title'))).toBe(false)

    await page.goto(url('/contact'), { waitUntil: 'hydration' })
    await page.waitForTimeout(500)
    await runAxeScan()
    const contactLogs = getNewA11yLogs()

    expect(contactLogs.some(log => log.includes('select-name'))).toBe(true)
    expect(contactLogs.some(log => log.includes('frame-title'))).toBe(true)
    expect(contactLogs.some(log => log.includes('image-alt'))).toBe(false)

    await page.close()
  }, 30000)
})
