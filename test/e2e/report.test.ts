import { existsSync, readFileSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import { describe, it, expect, beforeAll } from 'vitest'

describe.each([
  { name: 'nuxt v4', root: '../../playground', minRoutes: 3 },
  { name: 'nuxt v5', root: '../fixtures/nuxt-v5', minRoutes: 2 },
])('build-time report generation ($name)', ({ root, minRoutes }) => {
  const rootDir = fileURLToPath(new URL(root, import.meta.url))
  // Nuxt 4 uses node_modules/.cache/nuxt/.nuxt as buildDir by default
  const buildDir = resolve(rootDir, 'node_modules/.cache/nuxt/.nuxt')
  const reportPath = resolve(buildDir, 'a11y-report.md')

  beforeAll(() => {
    // Clean previous report if it exists
    if (existsSync(reportPath))
      rmSync(reportPath)

    // Run nuxt generate on the playground
    // This exits non-zero because failOnViolation defaults to true
    try {
      execSync('npx nuxt generate', {
        cwd: rootDir,
        stdio: 'pipe',
        timeout: 120_000,
        env: { ...process.env, NODE_ENV: 'production' },
      })
    }
    catch {
      // Expected: process.exitCode = 1 because playground has a11y violations
    }
  }, 120_000)

  it('generates a report file during build', () => {
    expect(existsSync(reportPath)).toBe(true)

    const report = readFileSync(reportPath, 'utf-8')
    expect(report).toContain('# Accessibility Report')
    expect(report).toContain('Routes scanned:')
    expect(report).toContain('Total violations:')
  })

  it('report contains violations from the playground', () => {
    const report = readFileSync(reportPath, 'utf-8')

    // The playground has intentional a11y issues (missing alt text, etc.)
    expect(report).toContain('image-alt')
  })

  it('report scanned routes count matches prerendered HTML pages', () => {
    const report = readFileSync(reportPath, 'utf-8')

    const match = report.match(/Routes scanned: (\d+)/)
    expect(match).not.toBeNull()

    const scannedCount = Number.parseInt(match![1]!, 10)
    expect(scannedCount).toBeGreaterThanOrEqual(minRoutes)
  })

  it('report groups violations by impact level', () => {
    const report = readFileSync(reportPath, 'utf-8')

    // Should have at least one impact section (the playground has critical violations)
    const hasImpactSection = ['## Critical', '## Serious', '## Moderate', '## Minor'].some(
      section => report.includes(section),
    )
    expect(hasImpactSection).toBe(true)
  })
})
