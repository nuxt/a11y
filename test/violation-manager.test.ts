import { describe, it, expect, beforeEach } from 'vitest'
import type axe from 'axe-core'
import { createViolationManager } from '../src/runtime/utils/violation-manager'

describe('violation-manager', () => {
  let violationManager: ReturnType<typeof createViolationManager>

  beforeEach(() => {
    violationManager = createViolationManager()
  })

  // Helper to create mock violations with defaults
  function createMockViolation(overrides: Partial<axe.Result> = {}): axe.Result {
    return {
      id: 'color-contrast',
      impact: 'serious',
      help: 'Elements must have sufficient color contrast',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.11/color-contrast',
      description: 'Ensures the contrast between foreground and background colors',
      tags: ['wcag2aa'],
      nodes: [
        {
          html: '<button>Click me</button>',
          target: ['.button'],
          failureSummary: 'Fix',
          any: [],
          all: [],
          none: [],
        },
      ],
      ...overrides,
    }
  }

  // Helper to create a node
  function createNode(html: string, target: axe.NodeResult['target'], failureSummary = 'Fix'): axe.NodeResult {
    return { html, target, failureSummary, any: [], all: [], none: [] }
  }

  describe('processViolations', () => {
    it('should process and merge violations with the same id, impact, and route', () => {
      const result = violationManager.processViolations([
        createMockViolation({ nodes: [createNode('<button>Click me</button>', ['.button'])] }),
        createMockViolation({ nodes: [createNode('<div>Text</div>', ['.text'])] }),
      ], '/home')

      expect(result).toHaveLength(1)
      expect(result[0]!.nodes).toHaveLength(2)
      expect(result[0]!.nodes[0]!.target).toEqual(['.button'])
      expect(result[0]!.nodes[1]!.target).toEqual(['.text'])
    })

    it('should track violations by id, impact, and route separately', () => {
      const baseViolation = createMockViolation()

      // Different IDs
      const result1 = violationManager.processViolations([
        baseViolation,
        createMockViolation({ id: 'button-name', impact: 'critical' }),
      ], '/home')
      expect(result1).toHaveLength(2)

      // Different impacts
      const result2 = violationManager.processViolations([createMockViolation({ impact: 'moderate' })], '/home')
      expect(result2).toHaveLength(3)

      // Different routes
      const result3 = violationManager.processViolations([baseViolation], '/about')
      expect(result3).toHaveLength(4)
    })

    it('should not add duplicates but should add new nodes to existing violations', () => {
      const mockViolation = createMockViolation()

      // First scan
      const result1 = violationManager.processViolations([mockViolation], '/home')
      expect(result1).toHaveLength(1)
      expect(result1[0]!.nodes).toHaveLength(1)

      // Second scan with same violation - should not duplicate
      const result2 = violationManager.processViolations([mockViolation], '/home')
      expect(result2).toHaveLength(1)
      expect(result2[0]!.nodes).toHaveLength(1)

      // Third scan with new node - should add to existing
      const result3 = violationManager.processViolations([
        createMockViolation({ nodes: [createNode('<div>New</div>', ['.new'])] }),
      ], '/home')
      expect(result3).toHaveLength(1)
      expect(result3[0]!.nodes).toHaveLength(2)
    })

    it('should handle shadow DOM selectors (nested arrays)', () => {
      const result = violationManager.processViolations([
        createMockViolation({ nodes: [createNode('<button>Click me</button>', [['iframe#main', '.button']] as axe.NodeResult['target'])] }),
      ], '/home')

      expect(result).toHaveLength(1)
    })

    it('should handle empty violations array', () => {
      expect(violationManager.processViolations([], '/home')).toHaveLength(0)
    })
  })

  describe('getAll', () => {
    it('should return accumulated violations', () => {
      expect(violationManager.getAll()).toEqual([])

      violationManager.processViolations([createMockViolation()], '/home')

      expect(violationManager.getAll()).toHaveLength(1)
      expect(violationManager.getAll()[0]!.id).toBe('color-contrast')
    })
  })

  describe('selector normalization', () => {
    it('should normalize Vue scoped attributes (data-v-*)', () => {
      violationManager.processViolations([
        createMockViolation({ nodes: [createNode('<div>Test</div>', ['.team-member[data-v-7f554ff8=""]'])] }),
      ], '/home')

      const result = violationManager.processViolations([
        createMockViolation({ nodes: [createNode('<div>Test</div>', ['.team-member'])] }),
      ], '/home')

      expect(result[0]!.nodes).toHaveLength(1) // Should recognize as same element
    })

    it('should normalize Nuxt scoped attributes (data-s-*)', () => {
      violationManager.processViolations([
        createMockViolation({ nodes: [createNode('<div>Test</div>', ['.component[data-s-abc12345=""]'])] }),
      ], '/home')

      const result = violationManager.processViolations([
        createMockViolation({ nodes: [createNode('<div>Test</div>', ['.component'])] }),
      ], '/home')

      expect(result[0]!.nodes).toHaveLength(1) // Should recognize as same element
    })

    it('should normalize scoped attributes', () => {
      violationManager.processViolations([
        createMockViolation({ nodes: [createNode('<div>Test</div>', ['.team-member[data-v-7f554ff8=""] > .avatar[data-v-7f554ff8=""]'])] }),
      ], '/home')

      const result = violationManager.processViolations([
        createMockViolation({ nodes: [createNode('<div>Test</div>', ['.team-member > .avatar'])] }),
      ], '/home')

      expect(result[0]!.nodes).toHaveLength(1) // Should normalize scoped attributes and recognize as same
    })

    it('should handle multiple scoped attributes in one selector', () => {
      violationManager.processViolations([
        createMockViolation({ nodes: [createNode('<div>Test</div>', ['.parent[data-v-123abc=""] > .child[data-v-456def=""]'])] }),
      ], '/home')

      const result = violationManager.processViolations([
        createMockViolation({ nodes: [createNode('<div>Test</div>', ['.parent > .child'])] }),
      ], '/home')

      expect(result[0]!.nodes).toHaveLength(1) // Should remove all scoped attributes
    })

    it('should normalize complex selectors with mixed attributes', () => {
      violationManager.processViolations([
        createMockViolation({ nodes: [createNode('<div>Test</div>', ['.container[data-v-abc123=""] > div[data-s-def456=""] > .item'])] }),
      ], '/home')

      const result = violationManager.processViolations([
        createMockViolation({ nodes: [createNode('<div>Test</div>', ['.container > div > .item'])] }),
      ], '/home')

      expect(result[0]!.nodes).toHaveLength(1) // Should handle both data-v and data-s
    })

    it('should deduplicate when scoped attributes differ across multiple violation results', () => {
      const result = violationManager.processViolations([
        createMockViolation({ nodes: [
          createNode('<div>Test 1</div>', ['.team-member[data-v-7f554ff8=""]:nth-child(2) > div[data-v-7f554ff8=""]:nth-child(3)']),
        ] }),
        createMockViolation({ nodes: [
          createNode('<div>Test 2</div>', ['.team-member:nth-child(2) > div:nth-child(3)']),
        ] }),
      ], '/home')

      expect(result[0]!.nodes).toHaveLength(1) // Should recognize as duplicate and merge
    })

    it('should preserve original selectors while normalizing for comparison', () => {
      const result = violationManager.processViolations([
        createMockViolation({ nodes: [createNode('<div>Test</div>', ['.team-member[data-v-7f554ff8=""]'])] }),
      ], '/home')

      // Original selector should be preserved in the stored violation
      expect(result[0]!.nodes[0]!.target).toEqual(['.team-member[data-v-7f554ff8=""]'])
    })
  })

  describe('reset', () => {
    it('should clear all violations and tracking state', () => {
      const mockViolation = createMockViolation()

      // Process and verify
      violationManager.processViolations([mockViolation], '/home')
      expect(violationManager.getAll()).toHaveLength(1)

      // Process again - should not duplicate
      violationManager.processViolations([mockViolation], '/home')
      expect(violationManager.getAll()).toHaveLength(1)

      // Reset
      violationManager.reset()
      expect(violationManager.getAll()).toHaveLength(0)

      // Process after reset - should add again
      violationManager.processViolations([mockViolation], '/home')
      expect(violationManager.getAll()).toHaveLength(1)
    })
  })
})
