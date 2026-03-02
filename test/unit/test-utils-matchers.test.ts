import { describe, it, expect } from 'vitest'
import type { A11yViolation } from '../../src/runtime/types'
import type { ScanResult } from '../../src/test-utils/types'
import { toHaveNoA11yViolations } from '../../src/test-utils/matchers'

function createViolation(overrides: Partial<A11yViolation> = {}): A11yViolation {
  return {
    id: 'image-alt',
    impact: 'critical',
    help: 'Images must have alternative text',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.11/image-alt',
    description: 'Ensures <img> elements have alternate text',
    tags: ['wcag2a', 'cat.text-alternatives'],
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

function createScanResult(violations: A11yViolation[]): ScanResult {
  return {
    violations,
    violationCount: violations.length,
    getByImpact: level => violations.filter(v => v.impact === level),
    getByRule: ruleId => violations.filter(v => v.id === ruleId),
    getByTag: tag => violations.filter(v => v.tags.includes(tag)),
  }
}

describe('toHaveNoA11yViolations', () => {
  it('passes when ScanResult has zero violations', () => {
    const result = createScanResult([])
    const matcherResult = toHaveNoA11yViolations(result)

    expect(matcherResult.pass).toBe(true)
    expect(matcherResult.message()).toContain('Expected ScanResult to have accessibility violations')
  })

  it('fails when ScanResult has violations', () => {
    const result = createScanResult([createViolation()])
    const matcherResult = toHaveNoA11yViolations(result)

    expect(matcherResult.pass).toBe(false)
    expect(matcherResult.message()).toContain('image-alt')
    expect(matcherResult.message()).toContain('critical')
  })

  it('filters by impact level — ignores minor violations', () => {
    const result = createScanResult([
      createViolation({ id: 'minor-rule', impact: 'minor', help: 'Minor issue', tags: ['best-practice'] }),
    ])

    const matcherResult = toHaveNoA11yViolations(result, { impact: 'serious' })

    expect(matcherResult.pass).toBe(true)
  })

  it('filters by impact level — includes higher severity', () => {
    const result = createScanResult([
      createViolation({ impact: 'critical' }),
      createViolation({ id: 'moderate-rule', impact: 'moderate', help: 'Moderate issue', tags: ['wcag2a'] }),
    ])

    const matcherResult = toHaveNoA11yViolations(result, { impact: 'moderate' })

    expect(matcherResult.pass).toBe(false)
    const message = matcherResult.message()
    expect(message).toContain('image-alt')
    expect(message).toContain('moderate-rule')
  })

  it('filters by impact level — excludes lower severity', () => {
    const result = createScanResult([
      createViolation({ id: 'moderate-rule', impact: 'moderate', help: 'Moderate issue', tags: ['wcag2a'] }),
      createViolation({ id: 'minor-rule', impact: 'minor', help: 'Minor issue', tags: ['best-practice'] }),
    ])

    const matcherResult = toHaveNoA11yViolations(result, { impact: 'serious' })

    expect(matcherResult.pass).toBe(true)
  })

  it('filters by specific rules', () => {
    const result = createScanResult([
      createViolation({ id: 'image-alt' }),
      createViolation({ id: 'link-name', impact: 'serious', help: 'Links must have text', helpUrl: 'https://dequeuniversity.com/rules/axe/4.11/link-name', tags: ['wcag2a'], nodes: [{ target: ['.nav-link'], html: '<a>', failureSummary: 'fix' }] }),
    ])

    const matcherResult = toHaveNoA11yViolations(result, { rules: ['link-name'] })

    expect(matcherResult.pass).toBe(false)
    const message = matcherResult.message()
    expect(message).toContain('link-name')
    expect(message).not.toContain('[critical] image-alt')
  })

  it('passes when filtered rules have no violations', () => {
    const result = createScanResult([
      createViolation({ id: 'image-alt' }),
    ])

    const matcherResult = toHaveNoA11yViolations(result, { rules: ['color-contrast'] })

    expect(matcherResult.pass).toBe(true)
  })

  it('filters by tags', () => {
    const result = createScanResult([
      createViolation({ id: 'image-alt', tags: ['wcag2a', 'cat.text-alternatives'] }),
      createViolation({ id: 'color-contrast', impact: 'serious', help: 'Color contrast', helpUrl: 'https://dequeuniversity.com/rules/axe/4.11/color-contrast', tags: ['wcag2aa'], nodes: [{ target: ['.text'], html: '<p>', failureSummary: 'fix' }] }),
    ])

    const matcherResult = toHaveNoA11yViolations(result, { tags: ['wcag2aa'] })

    expect(matcherResult.pass).toBe(false)
    const message = matcherResult.message()
    expect(message).toContain('color-contrast')
    expect(message).not.toContain('[critical] image-alt')
  })

  it('passes when filtered tags have no violations', () => {
    const result = createScanResult([
      createViolation({ tags: ['wcag2a'] }),
    ])

    const matcherResult = toHaveNoA11yViolations(result, { tags: ['wcag2aaa'] })

    expect(matcherResult.pass).toBe(true)
  })

  it('produces a helpful error when receiving a raw HTML string', () => {
    const matcherResult = toHaveNoA11yViolations('<html><body></body></html>')

    expect(matcherResult.pass).toBe(false)
    expect(matcherResult.message()).toContain('Expected a ScanResult from runA11yScan()')
    expect(matcherResult.message()).toContain('string')
    expect(matcherResult.message()).toContain('<html>')
  })

  it('produces a helpful error for non-object values', () => {
    const matcherResult = toHaveNoA11yViolations(42)

    expect(matcherResult.pass).toBe(false)
    expect(matcherResult.message()).toContain('Expected a ScanResult from runA11yScan()')
    expect(matcherResult.message()).toContain('number')
  })

  it('produces a helpful error for null', () => {
    const matcherResult = toHaveNoA11yViolations(null)

    expect(matcherResult.pass).toBe(false)
    expect(matcherResult.message()).toContain('Expected a ScanResult from runA11yScan()')
  })

  it('failure messages include violation details', () => {
    const result = createScanResult([
      createViolation({
        id: 'image-alt',
        impact: 'critical',
        help: 'Images must have alternative text',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.11/image-alt',
        nodes: [
          { target: ['.img-1'], html: '<img class="img-1">', failureSummary: 'fix' },
          { target: ['.img-2'], html: '<img class="img-2">', failureSummary: 'fix' },
        ],
      }),
    ])

    const matcherResult = toHaveNoA11yViolations(result)

    expect(matcherResult.pass).toBe(false)
    const message = matcherResult.message()
    expect(message).toContain('[critical] image-alt')
    expect(message).toContain('Images must have alternative text')
    expect(message).toContain('https://dequeuniversity.com/rules/axe/4.11/image-alt')
    expect(message).toContain('.img-1')
    expect(message).toContain('.img-2')
  })
})
