import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createLeadingTabManager } from '../../src/runtime/utils/leading-tab-manager'

interface MockBroadcastChannel {
  postMessage: ReturnType<typeof vi.fn>
  addEventListener: ReturnType<typeof vi.fn>
  removeEventListener: ReturnType<typeof vi.fn>
  close: ReturnType<typeof vi.fn>
}

describe('leading-tab-manager', () => {
  let mockBroadcastChannel: MockBroadcastChannel
  let messageHandlers: Array<(event: MessageEvent) => void> = []
  let windowEventHandlers: Map<string, EventListener> = new Map()
  let documentEventHandlers: Map<string, EventListener> = new Map()
  let statusChanges: Array<{ isLeader: boolean, tabCount: number }> = []

  // Helper to create a mock MessageEvent
  const createMessageEvent = (data: unknown): MessageEvent => {
    return { data } as MessageEvent
  }

  // Helper to simulate BroadcastChannel message
  const simulateMessage = (data: unknown) => {
    const event = createMessageEvent(data)
    messageHandlers.forEach(handler => handler(event))
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    messageHandlers = []
    windowEventHandlers = new Map()
    documentEventHandlers = new Map()
    statusChanges = []

    // Mock BroadcastChannel
    mockBroadcastChannel = {
      postMessage: vi.fn(),
      addEventListener: vi.fn((event: string, handler: (event: MessageEvent) => void) => {
        if (event === 'message') {
          messageHandlers.push(handler)
        }
      }),
      removeEventListener: vi.fn((event: string, handler: (event: MessageEvent) => void) => {
        if (event === 'message') {
          const index = messageHandlers.indexOf(handler)
          if (index > -1) {
            messageHandlers.splice(index, 1)
          }
        }
      }),
      close: vi.fn(),
    }

    // Mock global BroadcastChannel as a constructor
    const BroadcastChannelMock = vi.fn(function (this: MockBroadcastChannel) {
      return mockBroadcastChannel
    })
    vi.stubGlobal('BroadcastChannel', BroadcastChannelMock)

    // Mock crypto.randomUUID
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn(() => 'test-tab-id'),
    })

    // Mock window event listeners
    vi.stubGlobal('window', {
      addEventListener: vi.fn((event: string, handler: EventListener) => {
        windowEventHandlers.set(event, handler)
      }),
      removeEventListener: vi.fn((event: string) => {
        windowEventHandlers.delete(event)
      }),
    })

    // Mock document event listeners
    const mockDocument = {
      addEventListener: vi.fn((event: string, handler: EventListener) => {
        documentEventHandlers.set(event, handler)
      }),
      removeEventListener: vi.fn((event: string) => {
        documentEventHandlers.delete(event)
      }),
      hidden: false,
    }
    vi.stubGlobal('document', mockDocument)
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  describe('initialization', () => {
    it('should create manager with initial status', () => {
      const manager = createLeadingTabManager((status) => {
        statusChanges.push(status)
      })

      expect(manager).toBeDefined()
      expect(manager.isLeader).toBe(false)
      expect(manager.getStatus()).toEqual({ isLeader: false, tabCount: 1 })
    })

    it('should become leader when no other leader exists', async () => {
      const manager = createLeadingTabManager((status) => {
        statusChanges.push(status)
      })

      manager.initialize()

      // Fast-forward through checkForLeader timeout
      await vi.advanceTimersByTimeAsync(150)

      expect(manager.isLeader).toBe(true)
      expect(statusChanges).toContainEqual({ isLeader: true, tabCount: 1 })
      expect(mockBroadcastChannel.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'leader-claim' }),
      )
    })

    it('should not become leader when another leader exists', async () => {
      const manager = createLeadingTabManager((status) => {
        statusChanges.push(status)
      })

      manager.initialize()

      // Simulate leader response before timeout
      simulateMessage({ type: 'leader-response' })

      await vi.advanceTimersByTimeAsync(150)

      expect(manager.isLeader).toBe(false)
      expect(statusChanges).not.toContainEqual(expect.objectContaining({ isLeader: true }))
    })

    it('should fallback to leader when BroadcastChannel is not supported', () => {
      vi.stubGlobal('BroadcastChannel', undefined)

      const manager = createLeadingTabManager((status) => {
        statusChanges.push(status)
      })

      manager.initialize()

      expect(manager.isLeader).toBe(true)
      expect(statusChanges).toContainEqual({ isLeader: true, tabCount: 1 })
    })
  })

  describe('message handling', () => {
    it('should step down when another tab claims leadership', async () => {
      const manager = createLeadingTabManager((status) => {
        statusChanges.push(status)
      })

      manager.initialize()
      await vi.advanceTimersByTimeAsync(150)

      statusChanges = [] // Reset

      // Another tab claims leadership
      simulateMessage({
        type: 'leader-claim',
        tabId: 'other-tab-id',
        tabCount: 2,
      })

      expect(manager.isLeader).toBe(false)
      expect(statusChanges).toContainEqual({ isLeader: false, tabCount: 2 })
    })

    it('should ignore leader-claim from self', async () => {
      const manager = createLeadingTabManager((status) => {
        statusChanges.push(status)
      })

      manager.initialize()
      await vi.advanceTimersByTimeAsync(150)

      const initialCount = statusChanges.length

      // Same tab claims leadership
      simulateMessage({
        type: 'leader-claim',
        tabId: 'test-tab-id',
        tabCount: 1,
      })

      expect(statusChanges.length).toBe(initialCount)
    })

    it('should respond to leader-ping when is leader', async () => {
      const manager = createLeadingTabManager((status) => {
        statusChanges.push(status)
      })

      manager.initialize()
      await vi.advanceTimersByTimeAsync(150)

      mockBroadcastChannel.postMessage.mockClear()

      simulateMessage({ type: 'leader-ping' })

      expect(mockBroadcastChannel.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'leader-response' }),
      )
      expect(mockBroadcastChannel.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'tab-alive' }),
      )
    })

    it('should only send tab-alive when not leader', async () => {
      const manager = createLeadingTabManager((status) => {
        statusChanges.push(status)
      })

      manager.initialize()

      // Simulate existing leader
      simulateMessage({ type: 'leader-response' })
      await vi.advanceTimersByTimeAsync(150)

      mockBroadcastChannel.postMessage.mockClear()

      simulateMessage({ type: 'leader-ping' })

      expect(mockBroadcastChannel.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'tab-alive' }),
      )
      expect(mockBroadcastChannel.postMessage).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'leader-response' }),
      )
    })

    it('should increment tab count when tab joins', async () => {
      const manager = createLeadingTabManager((status) => {
        statusChanges.push(status)
      })

      manager.initialize()
      await vi.advanceTimersByTimeAsync(150)

      statusChanges = [] // Reset

      simulateMessage({
        type: 'tab-joined',
        tabId: 'other-tab-id',
      })

      expect(manager.getStatus().tabCount).toBe(2)
      expect(statusChanges).toContainEqual(expect.objectContaining({ tabCount: 2 }))
    })

    it('should ignore tab-joined from self', async () => {
      const manager = createLeadingTabManager((status) => {
        statusChanges.push(status)
      })

      manager.initialize()
      await vi.advanceTimersByTimeAsync(150)

      const initialCount = manager.getStatus().tabCount

      simulateMessage({
        type: 'tab-joined',
        tabId: 'test-tab-id',
      })

      expect(manager.getStatus().tabCount).toBe(initialCount)
    })

    it('should decrement tab count when tab leaves', async () => {
      const manager = createLeadingTabManager((status) => {
        statusChanges.push(status)
      })

      manager.initialize()
      await vi.advanceTimersByTimeAsync(150)

      // Add a tab
      simulateMessage({ type: 'tab-joined', tabId: 'other-tab-id' })
      statusChanges = [] // Reset

      // Tab leaves
      simulateMessage({ type: 'tab-leaving', tabId: 'other-tab-id' })

      expect(manager.getStatus().tabCount).toBe(1)
      expect(statusChanges).toContainEqual(expect.objectContaining({ tabCount: 1 }))
    })

    it('should not decrement tab count below 1', async () => {
      const manager = createLeadingTabManager((status) => {
        statusChanges.push(status)
      })

      manager.initialize()
      await vi.advanceTimersByTimeAsync(150)

      simulateMessage({ type: 'tab-leaving', tabId: 'other-tab-id' })

      expect(manager.getStatus().tabCount).toBe(1)
    })

    it('should ignore tab-leaving from self', async () => {
      const manager = createLeadingTabManager((status) => {
        statusChanges.push(status)
      })

      manager.initialize()
      await vi.advanceTimersByTimeAsync(150)

      const initialCount = manager.getStatus().tabCount

      simulateMessage({ type: 'tab-leaving', tabId: 'test-tab-id' })

      expect(manager.getStatus().tabCount).toBe(initialCount)
    })
  })

  describe('periodic leader check', () => {
    it('should take over leadership if leader disappears', async () => {
      const manager = createLeadingTabManager((status) => {
        statusChanges.push(status)
      })

      manager.initialize()

      // Simulate existing leader
      simulateMessage({ type: 'leader-response' })
      await vi.advanceTimersByTimeAsync(150)

      expect(manager.isLeader).toBe(false)

      statusChanges = [] // Reset

      // Fast-forward 5 seconds (periodic check interval)
      // No leader responds this time
      await vi.advanceTimersByTimeAsync(5100)

      expect(manager.isLeader).toBe(true)
      expect(statusChanges).toContainEqual(expect.objectContaining({ isLeader: true }))
    })

    it('should not check for leader if already leader', async () => {
      const manager = createLeadingTabManager((status) => {
        statusChanges.push(status)
      })

      manager.initialize()
      await vi.advanceTimersByTimeAsync(150)

      expect(manager.isLeader).toBe(true)

      mockBroadcastChannel.postMessage.mockClear()
      statusChanges = []

      // Fast-forward periodic check
      await vi.advanceTimersByTimeAsync(5100)

      // Should not ping for leader
      expect(mockBroadcastChannel.postMessage).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'leader-ping' }),
      )
    })
  })

  describe('window events', () => {
    it('should broadcast tab-leaving on beforeunload', async () => {
      const manager = createLeadingTabManager((status) => {
        statusChanges.push(status)
      })

      manager.initialize()
      await vi.advanceTimersByTimeAsync(150)

      mockBroadcastChannel.postMessage.mockClear()

      const beforeunloadHandler = windowEventHandlers.get('beforeunload')
      expect(beforeunloadHandler).toBeDefined()
      beforeunloadHandler?.({} as Event)

      expect(mockBroadcastChannel.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'tab-leaving', tabId: 'test-tab-id' }),
      )
    })

    it('should broadcast tab-leaving on pagehide', async () => {
      const manager = createLeadingTabManager((status) => {
        statusChanges.push(status)
      })

      manager.initialize()
      await vi.advanceTimersByTimeAsync(150)

      mockBroadcastChannel.postMessage.mockClear()

      const pagehideHandler = windowEventHandlers.get('pagehide')
      expect(pagehideHandler).toBeDefined()
      pagehideHandler?.({} as Event)

      expect(mockBroadcastChannel.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'tab-leaving', tabId: 'test-tab-id' }),
      )
    })

    it('should broadcast status on visibilitychange when visible', async () => {
      const manager = createLeadingTabManager((status) => {
        statusChanges.push(status)
      })

      manager.initialize()
      await vi.advanceTimersByTimeAsync(150)

      statusChanges = []
      vi.stubGlobal('document', {
        ...document,
        hidden: false,
      })

      const visibilityHandler = documentEventHandlers.get('visibilitychange')
      expect(visibilityHandler).toBeDefined()
      visibilityHandler?.({} as Event)

      expect(statusChanges).toContainEqual({ isLeader: true, tabCount: 1 })
    })

    it('should not broadcast status on visibilitychange when hidden', async () => {
      const manager = createLeadingTabManager((status) => {
        statusChanges.push(status)
      })

      manager.initialize()
      await vi.advanceTimersByTimeAsync(150)

      statusChanges = []
      vi.stubGlobal('document', {
        ...document,
        hidden: true,
      })

      const visibilityHandler = documentEventHandlers.get('visibilitychange')
      visibilityHandler?.({} as Event)

      expect(statusChanges).toHaveLength(0)
    })
  })

  describe('status updates', () => {
    it('should not trigger callback if status unchanged', async () => {
      const manager = createLeadingTabManager((status) => {
        statusChanges.push(status)
      })

      manager.initialize()
      await vi.advanceTimersByTimeAsync(150)

      const initialCount = statusChanges.length

      // Simulate same status
      simulateMessage({
        type: 'leader-claim',
        tabId: 'test-tab-id',
        tabCount: 1,
      })

      expect(statusChanges.length).toBe(initialCount)
    })

    it('should not update if tabCount is less than 1', async () => {
      const manager = createLeadingTabManager((status) => {
        statusChanges.push(status)
      })

      manager.initialize()
      await vi.advanceTimersByTimeAsync(150)

      statusChanges = []

      // This should use the fallback value of 2 (invalid count of 0)
      simulateMessage({
        type: 'leader-claim',
        tabId: 'other-tab-id',
        tabCount: 0,
      })

      // Count should fallback to 2, and status changed to false (not leader)
      expect(manager.getStatus().tabCount).toBe(2)
      expect(manager.getStatus().isLeader).toBe(false)
      expect(statusChanges).toContainEqual({ isLeader: false, tabCount: 2 })
    })
  })

  describe('cleanup', () => {
    it('should close BroadcastChannel on cleanup', async () => {
      const manager = createLeadingTabManager((status) => {
        statusChanges.push(status)
      })

      manager.initialize()
      await vi.advanceTimersByTimeAsync(150)

      manager.cleanup()

      expect(mockBroadcastChannel.close).toHaveBeenCalled()
    })

    it('should handle cleanup when BroadcastChannel is null', () => {
      vi.stubGlobal('BroadcastChannel', undefined)

      const manager = createLeadingTabManager((status) => {
        statusChanges.push(status)
      })

      manager.initialize()

      expect(() => manager.cleanup()).not.toThrow()
    })
  })

  describe('getStatus', () => {
    it('should return current status', async () => {
      const manager = createLeadingTabManager((status) => {
        statusChanges.push(status)
      })

      manager.initialize()
      await vi.advanceTimersByTimeAsync(150)

      const status = manager.getStatus()

      expect(status).toEqual({ isLeader: true, tabCount: 1 })
    })
  })

  describe('checkForLeader with multiple tabs', () => {
    it('should count all alive tabs including self', async () => {
      const manager = createLeadingTabManager((status) => {
        statusChanges.push(status)
      })

      manager.initialize()

      // Simulate multiple tabs responding
      simulateMessage({ type: 'tab-alive', tabId: 'tab-2' })
      simulateMessage({ type: 'tab-alive', tabId: 'tab-3' })

      await vi.advanceTimersByTimeAsync(150)

      // Should count self + 2 other tabs = 3
      expect(manager.getStatus().tabCount).toBe(3)
    })
  })
})
