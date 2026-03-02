import { describe, it, expect } from 'vitest'
import type { A11yViolation } from '../../src/runtime/types'
import { formatViolations } from '../../src/test-utils/format'

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

describe('formatViolations', () => {
  it('returns a clean message for zero violations', () => {
    const output = formatViolations([])
    expect(output).toBe('No accessibility violations found.')
  })

  it('groups violations by rule in the output', () => {
    const violations = [
      createViolation({ id: 'image-alt', nodes: [{ target: ['.img-1'], html: '<img>', failureSummary: 'fix' }] }),
      createViolation({ id: 'image-alt', nodes: [{ target: ['.img-2'], html: '<img>', failureSummary: 'fix' }] }),
      createViolation({ id: 'link-name', impact: 'serious', help: 'Links must have discernible text', helpUrl: 'https://dequeuniversity.com/rules/axe/4.11/link-name', nodes: [{ target: ['a.nav'], html: '<a>', failureSummary: 'fix' }] }),
    ]

    const output = formatViolations(violations)

    expect(output).toContain('image-alt (2 element(s))')
    expect(output).toContain('link-name (1 element(s))')
  })

  it('includes impact level per rule group', () => {
    const violations = [
      createViolation({ impact: 'critical' }),
      createViolation({ id: 'color-contrast', impact: 'serious', help: 'Elements must meet color contrast', helpUrl: 'https://example.com/color-contrast', nodes: [{ target: ['.text'], html: '<p>', failureSummary: 'fix' }] }),
    ]

    const output = formatViolations(violations)

    expect(output).toContain('[critical] image-alt')
    expect(output).toContain('[serious] color-contrast')
  })

  it('includes help text and help URL per rule group', () => {
    const violations = [createViolation()]
    const output = formatViolations(violations)

    expect(output).toContain('Images must have alternative text')
    expect(output).toContain('https://dequeuniversity.com/rules/axe/4.11/image-alt')
  })

  it('lists affected selectors per rule group', () => {
    const violations = [
      createViolation({
        nodes: [
          { target: ['.img-1'], html: '<img>', failureSummary: 'fix' },
          { target: ['.img-2'], html: '<img>', failureSummary: 'fix' },
        ],
      }),
    ]

    const output = formatViolations(violations)

    expect(output).toContain('- .img-1')
    expect(output).toContain('- .img-2')
  })

  it('truncates at 3 nodes per rule with a summary message', () => {
    const nodes = Array.from({ length: 5 }, (_, i) => ({
      target: [`.item-${i}`] as string[],
      html: `<img class="item-${i}">`,
      failureSummary: `Fix item ${i}` as string | undefined,
    }))
    const violations = [createViolation({ nodes })]

    const output = formatViolations(violations)

    expect(output).toContain('- .item-0')
    expect(output).toContain('- .item-1')
    expect(output).toContain('- .item-2')
    expect(output).not.toContain('- .item-3')
    expect(output).not.toContain('- .item-4')
    expect(output).toContain('... and 2 more element(s)')
  })

  it('does not show truncation message when nodes are exactly 3', () => {
    const nodes = Array.from({ length: 3 }, (_, i) => ({
      target: [`.item-${i}`] as string[],
      html: `<img class="item-${i}">`,
      failureSummary: `Fix item ${i}` as string | undefined,
    }))
    const violations = [createViolation({ nodes })]

    const output = formatViolations(violations)

    expect(output).toContain('- .item-0')
    expect(output).toContain('- .item-1')
    expect(output).toContain('- .item-2')
    expect(output).not.toContain('... and')
  })

  it('handles multiple rules at different impact levels', () => {
    const violations = [
      createViolation({ id: 'image-alt', impact: 'critical' }),
      createViolation({ id: 'color-contrast', impact: 'serious', help: 'Elements must meet color contrast', helpUrl: 'https://example.com/cc', nodes: [{ target: ['.text'], html: '<p>', failureSummary: 'fix' }] }),
      createViolation({ id: 'heading-order', impact: 'moderate', help: 'Heading levels should increase by one', helpUrl: 'https://example.com/ho', nodes: [{ target: ['h3'], html: '<h3>', failureSummary: 'fix' }] }),
    ]

    const output = formatViolations(violations)

    expect(output).toContain('3 accessibility violation(s) found:')
    expect(output).toContain('[critical] image-alt')
    expect(output).toContain('[serious] color-contrast')
    expect(output).toContain('[moderate] heading-order')
  })

  it('handles undefined impact as unknown', () => {
    const violations = [createViolation({ impact: undefined })]
    const output = formatViolations(violations)

    expect(output).toContain('[unknown] image-alt')
  })

  it('flattens shadow DOM selectors (nested arrays)', () => {
    const violations = [
      createViolation({
        nodes: [{
          target: [['#shadow-host', '.inner']] as unknown as string[],
          html: '<div>',
          failureSummary: 'fix',
        }],
      }),
    ]

    const output = formatViolations(violations)

    expect(output).toContain('- #shadow-host > .inner')
  })

  it('aggregates nodes across multiple violations of the same rule', () => {
    const violations = [
      createViolation({ id: 'image-alt', nodes: [{ target: ['.a'], html: '<img>', failureSummary: 'fix' }, { target: ['.b'], html: '<img>', failureSummary: 'fix' }] }),
      createViolation({ id: 'image-alt', nodes: [{ target: ['.c'], html: '<img>', failureSummary: 'fix' }] }),
    ]

    const output = formatViolations(violations)

    expect(output).toContain('image-alt (3 element(s))')
    expect(output).toContain('- .a')
    expect(output).toContain('- .b')
    expect(output).toContain('- .c')
  })

  it('shows violation count in the header', () => {
    const violations = [
      createViolation(),
      createViolation({ id: 'link-name', impact: 'serious', help: 'Links must have text', helpUrl: 'https://example.com', nodes: [{ target: ['a'], html: '<a>', failureSummary: 'fix' }] }),
    ]

    const output = formatViolations(violations)

    expect(output).toContain('2 accessibility violation(s) found:')
  })
})
