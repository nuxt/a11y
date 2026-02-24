/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createActiveTabTracker } from '../../src/runtime/utils/active-tab-tracker'

interface MockBroadcastChannel {
  postMessage: ReturnType<typeof vi.fn>
  addEventListener: ReturnType<typeof vi.fn>
  removeEventListener: ReturnType<typeof vi.fn>
  close: ReturnType<typeof vi.fn>
}

describe('active-tab-tracker', () => {
  let mockBroadcastChannel: MockBroadcastChannel
  let messageHandlers: Array<(event: MessageEvent) => void> = []
  const windowEventHandlers: Map<string, EventListener> = new Map()
  const documentEventHandlers: Map<string, EventListener> = new Map()
  let statusChanges: Array<{ tabId: string, isActive: boolean, totalTabCount: number }> = []
  let mockSessionStorage: Map<string, string>
  let mockLocalStorage: Map<string, string>

  // Helper to compute the tab ID that Math.random would produce
  const MOCK_RANDOM = 0.5
  const MOCK_TAB_ID = MOCK_RANDOM.toString(36).substring(2)
  const tabIdFromRandom = (r: number) => r.toString(36).substring(2)

  // Maximum time to wait for initialization (max random delay 150ms + count timeout 100ms)
  const MAX_INIT_TIME = 250

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
    statusChanges = []
    messageHandlers = []
    windowEventHandlers.clear()
    documentEventHandlers.clear()
    mockSessionStorage = new Map()
    mockLocalStorage = new Map()

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

    // eslint-disable-next-line @typescript-eslint/no-extraneous-class
    vi.stubGlobal('BroadcastChannel', class {
      constructor() {
        return mockBroadcastChannel
      }
    })

    // Mock Math.random for predictable tab IDs and delays
    vi.spyOn(Math, 'random').mockReturnValue(MOCK_RANDOM)

    // Mock sessionStorage
    vi.stubGlobal('sessionStorage', {
      getItem: vi.fn((key: string) => mockSessionStorage.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => mockSessionStorage.set(key, value)),
      removeItem: vi.fn((key: string) => mockSessionStorage.delete(key)),
    })

    // Mock localStorage
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => mockLocalStorage.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => mockLocalStorage.set(key, value)),
      removeItem: vi.fn((key: string) => mockLocalStorage.delete(key)),
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

    // Mock document event listeners and properties
    const mockDocument = {
      addEventListener: vi.fn((event: string, handler: EventListener) => {
        documentEventHandlers.set(event, handler)
      }),
      removeEventListener: vi.fn((event: string) => {
        documentEventHandlers.delete(event)
      }),
      hidden: false,
      hasFocus: vi.fn(() => true),
    }
    vi.stubGlobal('document', mockDocument)
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  describe('initialization', () => {
    it('should create tracker with initial status', () => {
      const tracker = createActiveTabTracker((status) => {
        statusChanges.push(status)
      })

      expect(tracker).toBeDefined()
      expect(tracker.isActive).toBe(false)
      expect(tracker.getTabId()).toBe(MOCK_TAB_ID)
    })

    it('should persist tab ID in sessionStorage', () => {
      const tracker = createActiveTabTracker((status) => {
        statusChanges.push(status)
      })

      expect(sessionStorage.setItem).toHaveBeenCalledWith('nuxt-a11y-tab-id', MOCK_TAB_ID)
      expect(tracker.getTabId()).toBe(MOCK_TAB_ID)
    })

    it('should reuse existing tab ID from sessionStorage', () => {
      mockSessionStorage.set('nuxt-a11y-tab-id', 'existing-tab-id')

      const tracker = createActiveTabTracker((status) => {
        statusChanges.push(status)
      })

      expect(tracker.getTabId()).toBe('existing-tab-id')
      expect(Math.random).not.toHaveBeenCalled()
    })

    it.each([
      { random: 0.01, initDelay: 1.5, countDelay: 100 },
      { random: 0.5, initDelay: 75, countDelay: 100 },
      { random: 0.99, initDelay: 148.5, countDelay: 100 },
    ])('should become active when initialized and document is visible and focused (delay: $initDelay ms)', async ({ random, initDelay, countDelay }) => {
      vi.spyOn(Math, 'random').mockReturnValue(random)

      const tracker = createActiveTabTracker((status) => {
        statusChanges.push(status)
      })

      tracker.initialize()

      // Fast-forward through initialization delay and tab counting timeout
      await vi.advanceTimersByTimeAsync(initDelay + countDelay)

      expect(tracker.isActive).toBe(true)
      expect(statusChanges).toContainEqual(
        expect.objectContaining({ isActive: true, totalTabCount: 1 }),
      )
    })

    it.each([
      { random: 0.01, initDelay: 1.5, countDelay: 100 },
      { random: 0.5, initDelay: 75, countDelay: 100 },
      { random: 0.99, initDelay: 148.5, countDelay: 100 },
    ])('should not become active if document is not focused (delay: $initDelay ms)', async ({ random, initDelay, countDelay }) => {
      vi.spyOn(Math, 'random').mockReturnValue(random)

      vi.stubGlobal('document', {
        ...document,
        hasFocus: vi.fn(() => false),
        hidden: false,
      })

      const tracker = createActiveTabTracker((status) => {
        statusChanges.push(status)
      })

      tracker.initialize()

      await vi.advanceTimersByTimeAsync(initDelay + countDelay)

      expect(tracker.isActive).toBe(false)
    })

    it.each([
      { random: 0.01, initDelay: 1.5, countDelay: 100 },
      { random: 0.5, initDelay: 75, countDelay: 100 },
      { random: 0.99, initDelay: 148.5, countDelay: 100 },
    ])('should not become active if document is hidden (delay: $initDelay ms)', async ({ random, initDelay, countDelay }) => {
      vi.spyOn(Math, 'random').mockReturnValue(random)

      vi.stubGlobal('document', {
        ...document,
        hasFocus: vi.fn(() => true),
        hidden: true,
      })

      const tracker = createActiveTabTracker((status) => {
        statusChanges.push(status)
      })

      tracker.initialize()

      await vi.advanceTimersByTimeAsync(initDelay + countDelay)

      expect(tracker.isActive).toBe(false)
    })

    it.each([
      { random: 0.01, initDelay: 1.5, countDelay: 100 },
      { random: 0.5, initDelay: 75, countDelay: 100 },
      { random: 0.99, initDelay: 148.5, countDelay: 100 },
    ])('should restore active status if it was active before reload (delay: $initDelay ms)', async ({ random, initDelay, countDelay }) => {
      vi.spyOn(Math, 'random').mockReturnValue(random)

      const expectedTabId = tabIdFromRandom(random)
      mockLocalStorage.set('nuxt-a11y-active-tab-id', expectedTabId)

      vi.stubGlobal('document', {
        ...document,
        hasFocus: vi.fn(() => false),
        hidden: true,
      })

      const tracker = createActiveTabTracker((status) => {
        statusChanges.push(status)
      })

      tracker.initialize()

      await vi.advanceTimersByTimeAsync(initDelay + countDelay)

      // Should become active because it was active before reload
      expect(tracker.isActive).toBe(true)
    })

    it.each([
      { random: 0.01, initDelay: 1.5, countDelay: 100 },
      { random: 0.5, initDelay: 75, countDelay: 100 },
      { random: 0.99, initDelay: 148.5, countDelay: 100 },
    ])('should count alive tabs on initialization (delay: $initDelay ms)', async ({ random, initDelay, countDelay }) => {
      vi.spyOn(Math, 'random').mockReturnValue(random)

      const tracker = createActiveTabTracker((status) => {
        statusChanges.push(status)
      })

      tracker.initialize()

      // Advance to just after the initialization delay when countAliveTabs postMessage is sent
      await vi.advanceTimersByTimeAsync(initDelay)

      // Now the countAliveTabs postMessage has been sent - simulate other tabs responding
      simulateMessage({ type: 'tab-alive', tabId: 'other-tab-1' })
      simulateMessage({ type: 'tab-alive', tabId: 'other-tab-2' })

      // Wait for the count timeout to complete
      await vi.advanceTimersByTimeAsync(countDelay)

      expect(tracker.getStatus().totalTabCount).toBe(3)
    })

    it.each([
      { random: 0.01, initDelay: 1.5, countDelay: 100 },
      { random: 0.5, initDelay: 75, countDelay: 100 },
      { random: 0.99, initDelay: 148.5, countDelay: 100 },
    ])('should store active tab ID in localStorage when becoming active (delay: $initDelay ms)', async ({ random, initDelay, countDelay }) => {
      vi.spyOn(Math, 'random').mockReturnValue(random)

      const tracker = createActiveTabTracker((status) => {
        statusChanges.push(status)
      })

      tracker.initialize()

      await vi.advanceTimersByTimeAsync(initDelay + countDelay)

      const expectedTabId = tabIdFromRandom(random)
      expect(localStorage.setItem).toHaveBeenCalledWith('nuxt-a11y-active-tab-id', expectedTabId)
    })
  })

  describe('tab visibility tracking', () => {
    it('should become active when tab becomes visible and window has focus', async () => {
      const tracker = createActiveTabTracker((status) => {
        statusChanges.push(status)
      })

      tracker.initialize()
      await vi.advanceTimersByTimeAsync(MAX_INIT_TIME)

      statusChanges = [] // Reset

      // Simulate tab becoming visible
      vi.stubGlobal('document', {
        ...document,
        hidden: false,
      })

      const visibilityHandler = documentEventHandlers.get('visibilitychange')
      visibilityHandler?.({} as Event)

      expect(tracker.isActive).toBe(true)
      expect(mockBroadcastChannel.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'tab-focused' }),
      )
    })

    it('should become inactive when tab becomes hidden', async () => {
      const tracker = createActiveTabTracker((status) => {
        statusChanges.push(status)
      })

      tracker.initialize()
      await vi.advanceTimersByTimeAsync(MAX_INIT_TIME)

      statusChanges = [] // Reset

      // Simulate tab becoming hidden
      vi.stubGlobal('document', {
        ...document,
        hidden: true,
      })

      const visibilityHandler = documentEventHandlers.get('visibilitychange')
      visibilityHandler?.({} as Event)

      expect(tracker.isActive).toBe(false)
    })

    it('should become active on window focus when document is visible', async () => {
      // Start with window not focused
      vi.stubGlobal('document', {
        ...document,
        hasFocus: vi.fn(() => false),
        hidden: false,
      })

      const tracker = createActiveTabTracker((status) => {
        statusChanges.push(status)
      })

      tracker.initialize()
      await vi.advanceTimersByTimeAsync(MAX_INIT_TIME)

      expect(tracker.isActive).toBe(false)

      statusChanges = [] // Reset

      // Simulate window gaining focus
      const focusHandler = windowEventHandlers.get('focus')
      focusHandler?.({} as Event)

      expect(tracker.isActive).toBe(true)
      expect(mockBroadcastChannel.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'tab-focused' }),
      )
    })

    it('should become inactive on window blur', async () => {
      const tracker = createActiveTabTracker((status) => {
        statusChanges.push(status)
      })

      tracker.initialize()
      await vi.advanceTimersByTimeAsync(MAX_INIT_TIME)

      expect(tracker.isActive).toBe(true)

      statusChanges = [] // Reset

      // Simulate window losing focus
      const blurHandler = windowEventHandlers.get('blur')
      blurHandler?.({} as Event)

      expect(tracker.isActive).toBe(false)
    })

    it('should not become active on focus if document is hidden', async () => {
      vi.stubGlobal('document', {
        ...document,
        hasFocus: vi.fn(() => false),
        hidden: true,
      })

      const tracker = createActiveTabTracker((status) => {
        statusChanges.push(status)
      })

      tracker.initialize()
      await vi.advanceTimersByTimeAsync(MAX_INIT_TIME)

      expect(tracker.isActive).toBe(false)

      // Simulate window gaining focus but document still hidden
      const focusHandler = windowEventHandlers.get('focus')
      focusHandler?.({} as Event)

      expect(tracker.isActive).toBe(false)
    })
  })

  describe('inter-tab communication', () => {
    it('should become inactive when another tab becomes focused', async () => {
      const tracker = createActiveTabTracker((status) => {
        statusChanges.push(status)
      })

      tracker.initialize()
      await vi.advanceTimersByTimeAsync(MAX_INIT_TIME)

      expect(tracker.isActive).toBe(true)

      statusChanges = [] // Reset

      simulateMessage({ type: 'tab-focused', tabId: 'other-tab-id' })

      expect(tracker.isActive).toBe(false)
      expect(statusChanges).toContainEqual(
        expect.objectContaining({ isActive: false }),
      )
    })

    it('should update tab count when tab joins', async () => {
      const tracker = createActiveTabTracker((status) => {
        statusChanges.push(status)
      })

      tracker.initialize()
      await vi.advanceTimersByTimeAsync(MAX_INIT_TIME)

      statusChanges = [] // Reset

      simulateMessage({ type: 'tab-joined', tabId: 'other-tab-id' })

      expect(tracker.getStatus().totalTabCount).toBe(2)
    })

    it('should update tab count when tab leaves', async () => {
      const tracker = createActiveTabTracker((status) => {
        statusChanges.push(status)
      })

      tracker.initialize()
      await vi.advanceTimersByTimeAsync(MAX_INIT_TIME)

      // First add a tab
      simulateMessage({ type: 'tab-joined', tabId: 'other-tab-id' })

      statusChanges = [] // Reset

      simulateMessage({ type: 'tab-leaving', tabId: 'other-tab-id' })

      expect(tracker.getStatus().totalTabCount).toBe(1)
    })

    it('should sync tab count when receiving higher count from another tab', async () => {
      const tracker = createActiveTabTracker((status) => {
        statusChanges.push(status)
      })

      tracker.initialize()
      await vi.advanceTimersByTimeAsync(MAX_INIT_TIME)

      expect(tracker.getStatus().totalTabCount).toBe(1)

      // Receive a count sync from another tab with higher count
      simulateMessage({ type: 'tab-count-sync', tabId: 'other-tab-id', count: 4 })

      expect(tracker.getStatus().totalTabCount).toBe(4)
    })

    it('should not decrease tab count when receiving lower count sync', async () => {
      const tracker = createActiveTabTracker((status) => {
        statusChanges.push(status)
      })

      tracker.initialize()
      await vi.advanceTimersByTimeAsync(MAX_INIT_TIME)

      // First set count to 4
      simulateMessage({ type: 'tab-count-sync', tabId: 'other-tab-id', count: 4 })
      expect(tracker.getStatus().totalTabCount).toBe(4)

      // Try to sync with lower count - should not decrease
      simulateMessage({ type: 'tab-count-sync', tabId: 'another-tab-id', count: 2 })
      expect(tracker.getStatus().totalTabCount).toBe(4)
    })

    it('should broadcast count sync when a new tab joins', async () => {
      const tracker = createActiveTabTracker((status) => {
        statusChanges.push(status)
      })

      tracker.initialize()
      await vi.advanceTimersByTimeAsync(MAX_INIT_TIME)

      mockBroadcastChannel.postMessage.mockClear()

      // Simulate a new tab joining
      simulateMessage({ type: 'tab-joined', tabId: 'new-tab-id' })

      // Should broadcast updated count to help sync
      expect(mockBroadcastChannel.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'tab-count-sync',
          count: 2, // Started at 1, incremented to 2
        }),
      )
    })
  })

  describe('cleanup', () => {
    it('should close BroadcastChannel on cleanup', async () => {
      const tracker = createActiveTabTracker((status) => {
        statusChanges.push(status)
      })

      tracker.initialize()
      await vi.advanceTimersByTimeAsync(MAX_INIT_TIME)

      tracker.cleanup()

      expect(mockBroadcastChannel.close).toHaveBeenCalled()
    })

    it('should remove event listeners on cleanup', async () => {
      const tracker = createActiveTabTracker((status) => {
        statusChanges.push(status)
      })

      tracker.initialize()
      await vi.advanceTimersByTimeAsync(MAX_INIT_TIME)

      tracker.cleanup()

      expect(windowEventHandlers.size).toBe(0)
      expect(documentEventHandlers.size).toBe(0)
    })

    it('should remove tab ID from sessionStorage when tab is closing', async () => {
      const tracker = createActiveTabTracker((status) => {
        statusChanges.push(status)
      })

      tracker.initialize()
      await vi.advanceTimersByTimeAsync(MAX_INIT_TIME)

      // Simulate beforeunload event
      const beforeUnloadHandler = windowEventHandlers.get('beforeunload')
      beforeUnloadHandler?.({} as Event)

      expect(sessionStorage.removeItem).toHaveBeenCalledWith('nuxt-a11y-tab-id')
    })

    it('should remove active tab ID from localStorage when active tab is closing', async () => {
      const tracker = createActiveTabTracker((status) => {
        statusChanges.push(status)
      })

      tracker.initialize()
      await vi.advanceTimersByTimeAsync(MAX_INIT_TIME)

      expect(tracker.isActive).toBe(true)

      // Simulate beforeunload event
      const beforeUnloadHandler = windowEventHandlers.get('beforeunload')
      beforeUnloadHandler?.({} as Event)

      expect(localStorage.removeItem).toHaveBeenCalledWith('nuxt-a11y-active-tab-id')
    })

    it('should not remove active tab ID from localStorage when inactive tab is closing', async () => {
      mockLocalStorage.set('nuxt-a11y-active-tab-id', 'other-tab-id')

      // Make this tab not focused/visible so it won't become active
      vi.stubGlobal('document', {
        ...document,
        hasFocus: vi.fn(() => false),
        hidden: true,
      })

      const tracker = createActiveTabTracker((status) => {
        statusChanges.push(status)
      })

      tracker.initialize()
      await vi.advanceTimersByTimeAsync(MAX_INIT_TIME)

      // This tab should not be active since another tab ID is stored and this tab is not focused
      expect(tracker.isActive).toBe(false)

      vi.mocked(localStorage.removeItem).mockClear()

      // Simulate beforeunload event
      const beforeUnloadHandler = windowEventHandlers.get('beforeunload')
      beforeUnloadHandler?.({} as Event)

      // Should not remove the active tab ID since this tab is not active
      expect(localStorage.removeItem).not.toHaveBeenCalledWith('nuxt-a11y-active-tab-id')
    })
  })

  describe('persistence across reloads', () => {
    it('should maintain same tab ID after simulated HMR reload', () => {
      const tracker1 = createActiveTabTracker((status) => {
        statusChanges.push(status)
      })

      const tabId1 = tracker1.getTabId()
      expect(tabId1).toBe(MOCK_TAB_ID)

      // Simulate HMR reload - create new tracker instance
      const tracker2 = createActiveTabTracker((status) => {
        statusChanges.push(status)
      })

      const tabId2 = tracker2.getTabId()

      // Should reuse the same ID from sessionStorage
      expect(tabId2).toBe(tabId1)
    })

    it('should prioritize previous active status over current focus state', async () => {
      // Set this tab as previously active
      mockLocalStorage.set('nuxt-a11y-active-tab-id', MOCK_TAB_ID)
      mockSessionStorage.set('nuxt-a11y-tab-id', MOCK_TAB_ID)

      // But make the document not focused
      vi.stubGlobal('document', {
        ...document,
        hasFocus: vi.fn(() => false),
        hidden: true,
      })

      const tracker = createActiveTabTracker((status) => {
        statusChanges.push(status)
      })

      tracker.initialize()
      await vi.advanceTimersByTimeAsync(MAX_INIT_TIME)

      // Should still become active because it was active before
      expect(tracker.isActive).toBe(true)
    })
  })
})
