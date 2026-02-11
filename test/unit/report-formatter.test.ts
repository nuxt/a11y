import { describe, it, expect } from 'vitest'
import type { A11yViolation } from '../../src/runtime/types'
import { formatMarkdownReport, formatConsoleSummary, getStats } from '../../src/utils/report-formatter'

function createViolation(overrides: Partial<A11yViolation> = {}): A11yViolation {
  return {
    id: 'image-alt',
    impact: 'critical',
    help: 'Images must have alternative text',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.11/image-alt',
    description: 'Ensures <img> elements have alternate text',
    tags: ['wcag2a'],
    timestamp: Date.now(),
    route: '/',
    nodes: [
      {
        target: ['.hero-image'],
        html: '<img src="hero.jpg" class="hero-image">',
        failureSummary: 'Fix any of the following:\n  Element does not have an alt attribute',
      },
    ],
    ...overrides,
  }
}

describe('report-formatter', () => {
  describe('getStats', () => {
    it('should return zero totals for empty violations', () => {
      const stats = getStats([])
      expect(stats.totalViolations).toBe(0)
      expect(stats.byImpact).toEqual({})
    })

    it('should count violations by impact', () => {
      const violations = [
        createViolation({ impact: 'critical' }),
        createViolation({ impact: 'critical', id: 'label' }),
        createViolation({ impact: 'serious' }),
        createViolation({ impact: 'moderate' }),
      ]
      const stats = getStats(violations)
      expect(stats.totalViolations).toBe(4)
      expect(stats.byImpact).toEqual({ critical: 2, serious: 1, moderate: 1 })
    })

    it('should handle undefined impact as unknown', () => {
      const stats = getStats([createViolation({ impact: undefined })])
      expect(stats.byImpact).toEqual({ unknown: 1 })
    })
  })

  describe('formatMarkdownReport', () => {
    it('should produce a report header with correct route count', () => {
      const violations = [createViolation({ route: '/' })]
      const report = formatMarkdownReport(violations, 5)

      expect(report).toContain('# Accessibility Report')
      expect(report).toContain('Routes scanned: 5')
      expect(report).toContain('Total violations: 1')
    })

    it('should produce a clean report when no violations exist', () => {
      const report = formatMarkdownReport([], 3)

      expect(report).toContain('Routes scanned: 3')
      expect(report).toContain('Total violations: 0')
      expect(report).toContain('No accessibility violations found!')
    })

    it('should group violations by impact level', () => {
      const violations = [
        createViolation({ impact: 'critical', id: 'image-alt' }),
        createViolation({ impact: 'serious', id: 'color-contrast' }),
        createViolation({ impact: 'moderate', id: 'heading-order' }),
      ]
      const report = formatMarkdownReport(violations, 1)

      const criticalIndex = report.indexOf('## Critical')
      const seriousIndex = report.indexOf('## Serious')
      const moderateIndex = report.indexOf('## Moderate')

      // All sections exist
      expect(criticalIndex).toBeGreaterThan(-1)
      expect(seriousIndex).toBeGreaterThan(-1)
      expect(moderateIndex).toBeGreaterThan(-1)

      // Ordered by severity
      expect(criticalIndex).toBeLessThan(seriousIndex)
      expect(seriousIndex).toBeLessThan(moderateIndex)
    })

    it('should group violations by rule within impact', () => {
      const violations = [
        createViolation({ route: '/' }),
        createViolation({ route: '/about' }),
      ]
      const report = formatMarkdownReport(violations, 2)

      // Should appear once as a rule heading, with both routes listed
      expect(report).toContain('### image-alt')
      expect(report).toContain('Routes: /, /about')
    })

    it('should truncate elements list at 10', () => {
      const nodes = Array.from({ length: 15 }, (_, i) => ({
        target: [`.item-${i}`] as string[],
        html: `<img class="item-${i}">`,
        failureSummary: `Fix item ${i}` as string | undefined,
      }))
      const violations = [createViolation({ nodes })]
      const report = formatMarkdownReport(violations, 1)

      expect(report).toContain('`.item-0`')
      expect(report).toContain('`.item-9`')
      expect(report).not.toContain('`.item-10`')
      expect(report).toContain('... and 5 more elements')
    })

    it('should handle shadow DOM selectors (nested arrays)', () => {
      const violations = [
        createViolation({
          nodes: [{
            target: [['#shadow-host', '.inner-element']] as unknown as string[],
            html: '<div class="inner-element">',
            failureSummary: 'Fix this',
          }],
        }),
      ]
      const report = formatMarkdownReport(violations, 1)

      // Should flatten nested arrays correctly
      expect(report).toContain('`#shadow-host > .inner-element`')
    })

    it('should include help URLs', () => {
      const violations = [createViolation()]
      const report = formatMarkdownReport(violations, 1)

      expect(report).toContain('[More info](https://dequeuniversity.com/rules/axe/4.11/image-alt)')
    })

    it('should skip impact levels with no violations', () => {
      const violations = [createViolation({ impact: 'critical' })]
      const report = formatMarkdownReport(violations, 1)

      expect(report).toContain('## Critical')
      expect(report).not.toContain('## Serious')
      expect(report).not.toContain('## Moderate')
      expect(report).not.toContain('## Minor')
    })
  })

  describe('formatConsoleSummary', () => {
    it('should include totals and impact breakdown', () => {
      const violations = [
        createViolation({ impact: 'critical' }),
        createViolation({ impact: 'serious', id: 'link-name', help: 'Links must have discernible text', route: '/about' }),
      ]
      const summary = formatConsoleSummary(violations, 3)

      expect(summary).toContain('2 violations across 3 routes')
      expect(summary).toContain('1 critical')
      expect(summary).toContain('1 serious')
    })

    it('should list each rule with impact, element count, and description', () => {
      const violations = [
        createViolation({ route: '/' }),
        createViolation({ route: '/about' }),
      ]
      const summary = formatConsoleSummary(violations, 5)

      expect(summary).toContain('critical')
      expect(summary).toContain('image-alt')
      expect(summary).toContain('2 elements across 2 routes')
      expect(summary).toContain('Images must have alternative text')
    })

    it('should count elements across nodes, not violations', () => {
      const violations = [
        createViolation({
          route: '/',
          nodes: [
            { target: ['.a'], html: '<img>', failureSummary: 'fix' },
            { target: ['.b'], html: '<img>', failureSummary: 'fix' },
          ],
        }),
        createViolation({
          route: '/about',
          nodes: [
            { target: ['.c'], html: '<img>', failureSummary: 'fix' },
          ],
        }),
      ]
      const summary = formatConsoleSummary(violations, 2)

      expect(summary).toContain('3 elements across 2 routes')
    })
  })
})
