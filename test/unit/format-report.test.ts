import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type axe from 'axe-core'
import type { A11yViolation } from '../../src/runtime/types'
import { formatViolationsReport } from '../../client/app/utils/format-report'

describe('format-report', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T10:30:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function createMockViolation(overrides: Partial<A11yViolation> = {}): A11yViolation {
    return {
      id: 'color-contrast',
      impact: 'serious',
      help: 'Elements must have sufficient color contrast',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.11/color-contrast',
      description: 'Ensures the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds',
      tags: ['wcag2aa', 'cat.color'],
      nodes: [
        {
          html: '<button>Click me</button>',
          target: ['.button'],
          failureSummary: 'Fix any of the following: Element has insufficient color contrast',
        },
      ],
      timestamp: Date.now(),
      route: '/home',
      ...overrides,
    }
  }

  describe('header formatting', () => {
    it('should include timestamp, route, and total count', () => {
      const result = formatViolationsReport([], '/home')

      expect(result).toContain('Accessibility Report')
      expect(result).toContain('Generated: 2024-01-15T10:30:00.000Z')
      expect(result).toContain('Route: /home')
      expect(result).toContain('Total Issues: 0')
    })

    it('should use "Unknown" when route is not provided', () => {
      const result = formatViolationsReport([])

      expect(result).toContain('Route: Unknown')
    })

    it('should show correct total count', () => {
      const violations = [
        createMockViolation({ id: 'color-contrast' }),
        createMockViolation({ id: 'image-alt' }),
      ]
      const result = formatViolationsReport(violations, '/home')

      expect(result).toContain('Total Issues: 2')
    })
  })

  describe('violation formatting', () => {
    it('should format severity as uppercase', () => {
      const violation = createMockViolation({ impact: 'critical' })
      const result = formatViolationsReport([violation], '/home')

      expect(result).toContain('[CRITICAL]')
    })

    it('should include rule ID', () => {
      const violation = createMockViolation({ id: 'image-alt' })
      const result = formatViolationsReport([violation], '/home')

      expect(result).toContain('image-alt')
    })

    it('should include description', () => {
      const violation = createMockViolation({
        description: 'Images must have alternate text',
      })
      const result = formatViolationsReport([violation], '/home')

      expect(result).toContain('Images must have alternate text')
    })

    it('should include help URL', () => {
      const violation = createMockViolation({
        helpUrl: 'https://example.com/help',
      })
      const result = formatViolationsReport([violation], '/home')

      expect(result).toContain('Learn more: https://example.com/help')
    })

    it('should include element count', () => {
      const violation = createMockViolation({
        nodes: [
          { html: '<img>', target: ['.img1'], failureSummary: 'Fix' },
          { html: '<img>', target: ['.img2'], failureSummary: 'Fix' },
          { html: '<img>', target: ['.img3'], failureSummary: 'Fix' },
        ],
      })
      const result = formatViolationsReport([violation], '/home')

      expect(result).toContain('Elements: 3')
    })

    it('should handle undefined impact', () => {
      const violation = createMockViolation({ impact: undefined })
      const result = formatViolationsReport([violation], '/home')

      expect(result).toContain('[UNKNOWN]')
    })
  })

  describe('WCAG level extraction', () => {
    it('should extract WCAG level A from tags', () => {
      const violation = createMockViolation({ tags: ['wcag2a', 'cat.structure'] })
      const result = formatViolationsReport([violation], '/home')

      expect(result).toContain('WCAG: A')
    })

    it('should extract WCAG level AA from tags', () => {
      const violation = createMockViolation({ tags: ['wcag2aa'] })
      const result = formatViolationsReport([violation], '/home')

      expect(result).toContain('WCAG: AA')
    })

    it('should extract WCAG level AAA from tags', () => {
      const violation = createMockViolation({ tags: ['wcag21aaa', 'best-practice'] })
      const result = formatViolationsReport([violation], '/home')

      expect(result).toContain('WCAG: AAA')
    })

    it('should return N/A when no WCAG tag is present', () => {
      const violation = createMockViolation({ tags: ['best-practice', 'cat.color'] })
      const result = formatViolationsReport([violation], '/home')

      expect(result).toContain('WCAG: N/A')
    })
  })

  describe('affected elements', () => {
    it('should list CSS selectors with bullet points', () => {
      const violation = createMockViolation({
        nodes: [
          { html: '<img>', target: ['img.hero-image'], failureSummary: 'Fix' },
          { html: '<img>', target: ['img.logo'], failureSummary: 'Fix' },
        ],
      })
      const result = formatViolationsReport([violation], '/home')

      expect(result).toContain('Affected elements:')
      expect(result).toContain('  • img.hero-image')
      expect(result).toContain('  • img.logo')
    })

    it('should handle complex selectors with multiple parts', () => {
      const violation = createMockViolation({
        nodes: [
          { html: '<button>', target: ['#main', '.container', 'button'], failureSummary: 'Fix' },
        ],
      })
      const result = formatViolationsReport([violation], '/home')

      expect(result).toContain('  • #main > .container > button')
    })

    it('should handle shadow DOM selectors (nested arrays)', () => {
      const violation = createMockViolation({
        nodes: [
          { html: '<button>', target: [['iframe#main', '.shadow-root'], '.button'] as axe.NodeResult['target'], failureSummary: 'Fix' },
        ],
      })
      const result = formatViolationsReport([violation], '/home')

      expect(result).toContain('  • iframe#main > .shadow-root > .button')
    })
  })

  describe('visual dividers', () => {
    it('should separate violations with dividers', () => {
      const violations = [
        createMockViolation({ id: 'color-contrast' }),
        createMockViolation({ id: 'image-alt' }),
      ]
      const result = formatViolationsReport(violations, '/home')

      const divider = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
      const dividerCount = (result.match(new RegExp(divider, 'g')) || []).length
      expect(dividerCount).toBe(2) // Header divider + one between 2 violations
    })

    it('should have divider after header', () => {
      const result = formatViolationsReport([], '/home')

      expect(result).toContain('Total Issues: 0\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    })
  })

  describe('empty state', () => {
    it('should return header only when no violations', () => {
      const result = formatViolationsReport([], '/home')

      expect(result).toContain('Accessibility Report')
      expect(result).toContain('Total Issues: 0')
      expect(result).not.toContain('[CRITICAL]')
      expect(result).not.toContain('[SERIOUS]')
      expect(result).not.toContain('Affected elements:')
    })
  })
})
