import { describe, it, expect, beforeEach } from 'vitest'
import type axe from 'axe-core'
import { createViolationManager } from '../src/runtime/utils/violation-manager'

describe('violation-manager', () => {
  let manager: ReturnType<typeof createViolationManager>

  beforeEach(() => {
    manager = createViolationManager()
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
      const result = manager.processViolations([
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
      const result1 = manager.processViolations([
        baseViolation,
        createMockViolation({ id: 'button-name', impact: 'critical' }),
      ], '/home')
      expect(result1).toHaveLength(2)

      // Different impacts
      const result2 = manager.processViolations([createMockViolation({ impact: 'moderate' })], '/home')
      expect(result2).toHaveLength(3)

      // Different routes
      const result3 = manager.processViolations([baseViolation], '/about')
      expect(result3).toHaveLength(4)
    })

    it('should not add duplicates but should add new nodes to existing violations', () => {
      const mockViolation = createMockViolation()

      // First scan
      const result1 = manager.processViolations([mockViolation], '/home')
      expect(result1).toHaveLength(1)
      expect(result1[0]!.nodes).toHaveLength(1)

      // Second scan with same violation - should not duplicate
      const result2 = manager.processViolations([mockViolation], '/home')
      expect(result2).toHaveLength(1)
      expect(result2[0]!.nodes).toHaveLength(1)

      // Third scan with new node - should add to existing
      const result3 = manager.processViolations([
        createMockViolation({ nodes: [createNode('<div>New</div>', ['.new'])] }),
      ], '/home')
      expect(result3).toHaveLength(1)
      expect(result3[0]!.nodes).toHaveLength(2)
    })

    it('should normalize highlighted elements to prevent duplicates', () => {
      manager.processViolations([
        createMockViolation({ nodes: [createNode('<button>Click me</button>', ['.team-member > .avatar'])] }),
      ], '/home')

      const result = manager.processViolations([
        createMockViolation({ nodes: [createNode('<button>Click me</button>', ['.team-member > .__nuxt_a11y_highlight__ > .avatar'])] }),
      ], '/home')

      expect(result[0]!.nodes).toHaveLength(1) // Should recognize highlighted element as duplicate
    })

    it('should handle edge cases: spacing variations and complex selectors', () => {
      manager.processViolations([
        createMockViolation({ nodes: [createNode('<div>Text</div>', ['.container>.__nuxt_a11y_highlight__>.text'])] }),
      ], '/home')

      const result = manager.processViolations([
        createMockViolation({ nodes: [createNode('<div>Text</div>', ['.container > .text'])] }),
      ], '/home')

      expect(result[0]!.nodes).toHaveLength(1) // Should handle spacing differences
    })

    it('should handle non-string targets (cross-tree selectors)', () => {
      const result = manager.processViolations([
        createMockViolation({ nodes: [createNode('<button>Click me</button>', [['iframe#main', '.button']] as axe.NodeResult['target'])] }),
      ], '/home')

      expect(result).toHaveLength(1)
    })

    it('should handle mixed-type targets', () => {
      const result = manager.processViolations([
        createMockViolation({ nodes: [createNode('<button>Click me</button>', ['iframe', { selector: '.button' }] as axe.NodeResult['target'])] }),
      ], '/home')

      expect(result).toHaveLength(1)
    })

    it('should handle non-array target', () => {
      const result = manager.processViolations([
        createMockViolation({ nodes: [createNode('<button>Click me</button>', { selector: '.button' } as unknown as axe.NodeResult['target'])] }),
      ], '/home')

      expect(result).toHaveLength(1)
    })

    it('should handle empty violations array', () => {
      expect(manager.processViolations([], '/home')).toHaveLength(0)
    })
  })

  describe('getAll', () => {
    it('should return accumulated violations', () => {
      expect(manager.getAll()).toEqual([])

      manager.processViolations([createMockViolation()], '/home')

      expect(manager.getAll()).toHaveLength(1)
      expect(manager.getAll()[0]!.id).toBe('color-contrast')
    })
  })

  describe('reset', () => {
    it('should clear all violations and tracking state', () => {
      const mockViolation = createMockViolation()

      // Process and verify
      manager.processViolations([mockViolation], '/home')
      expect(manager.getAll()).toHaveLength(1)

      // Process again - should not duplicate
      manager.processViolations([mockViolation], '/home')
      expect(manager.getAll()).toHaveLength(1)

      // Reset
      manager.reset()
      expect(manager.getAll()).toHaveLength(0)

      // Process after reset - should add again
      manager.processViolations([mockViolation], '/home')
      expect(manager.getAll()).toHaveLength(1)
    })
  })
})
