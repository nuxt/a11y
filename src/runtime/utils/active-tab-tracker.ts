/**
 * Active Tab Tracker
 * Tracks which browser tab is currently active/visible to the user.
 * All tabs can scan independently and maintain their own results.
 * The DevTools shows results from whichever tab the user is currently viewing.
 */

const ACTIVE_TAB_CHANNEL_NAME = 'nuxt-a11y-active-tab'
const TAB_ID_STORAGE_KEY = 'nuxt-a11y-tab-id'
const ACTIVE_TAB_STORAGE_KEY = 'nuxt-a11y-active-tab-id'

export interface ActiveTabStatus {
  tabId: string
  isActive: boolean
  totalTabCount: number
}

type StatusChangeCallback = (status: ActiveTabStatus) => void

export function createActiveTabTracker(onStatusChange: StatusChangeCallback) {
  // Generate or retrieve persistent tab ID from sessionStorage
  // This ensures the tab keeps the same ID across HMR reloads
  let TAB_ID: string
  try {
    const storedId = sessionStorage.getItem(TAB_ID_STORAGE_KEY)
    if (storedId) {
      TAB_ID = storedId
    }
    else {
      TAB_ID = crypto.randomUUID()
      sessionStorage.setItem(TAB_ID_STORAGE_KEY, TAB_ID)
    }
  }
  catch {
    // Fallback if sessionStorage is not available
    TAB_ID = crypto.randomUUID()
  }

  let isActive = false
  let tabChannel: BroadcastChannel | null = null
  let totalTabCount = 1
  let visibilityChangeHandler: (() => void) | null = null
  let focusHandler: (() => void) | null = null
  let blurHandler: (() => void) | null = null
  let broadcastTabLeaving: (() => void) | null = null

  // Track window focus and document visibility separately
  let windowHasFocus = false
  let documentIsVisible = false

  const updateStatus = (newIsActive: boolean, newTabCount: number = totalTabCount) => {
    const statusChanged = isActive !== newIsActive
    const countChanged = totalTabCount !== newTabCount

    if (newTabCount >= 1 && (statusChanged || countChanged)) {
      isActive = newIsActive
      totalTabCount = newTabCount

      // Store active tab ID in localStorage for persistence across reloads
      if (isActive) {
        try {
          localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, TAB_ID)
        }
        catch {
          // Ignore if localStorage is not available
        }
      }

      onStatusChange({ tabId: TAB_ID, isActive, totalTabCount })
    }
  }

  const checkAndUpdateActive = () => {
    // Only become active if BOTH window has focus AND document is visible
    const shouldBeActive = windowHasFocus && documentIsVisible

    if (shouldBeActive && !isActive) {
      // Becoming active - broadcast to other tabs
      updateStatus(true)
      tabChannel?.postMessage({ type: 'tab-focused', tabId: TAB_ID })
    }
    else if (!shouldBeActive && isActive) {
      // Becoming inactive
      updateStatus(false)
    }
  }

  const countAliveTabs = () => {
    return new Promise<number>((resolve) => {
      const aliveTabs = new Set<string>([TAB_ID])

      const responseHandler = (event: MessageEvent) => {
        if (event.data.type === 'tab-alive' && event.data.tabId !== TAB_ID) {
          aliveTabs.add(event.data.tabId)
        }
      }

      tabChannel?.addEventListener('message', responseHandler)
      tabChannel?.postMessage({ type: 'tab-count-ping' })

      setTimeout(() => {
        tabChannel?.removeEventListener('message', responseHandler)
        resolve(aliveTabs.size)
      }, 100)
    })
  }

  const initialize = () => {
    // Initialize BroadcastChannel for inter-tab communication
    if (typeof BroadcastChannel !== 'undefined') {
      tabChannel = new BroadcastChannel(ACTIVE_TAB_CHANNEL_NAME)

      tabChannel.addEventListener('message', (event) => {
        if (event.data.type === 'tab-focused' && event.data.tabId !== TAB_ID) {
          // Another tab became active, this tab becomes inactive
          updateStatus(false)
        }
        else if (event.data.type === 'tab-count-ping') {
          // Respond to tab count requests
          tabChannel?.postMessage({ type: 'tab-alive', tabId: TAB_ID })
        }
        else if (event.data.type === 'tab-joined' && event.data.tabId !== TAB_ID) {
          // A new tab joined - increment our count and broadcast our updated count
          const newCount = totalTabCount + 1
          updateStatus(isActive, newCount)
          // Let the new tab know our count
          tabChannel?.postMessage({ type: 'tab-count-sync', tabId: TAB_ID, count: newCount })
        }
        else if (event.data.type === 'tab-count-sync' && event.data.tabId !== TAB_ID) {
          // Another tab is reporting their count - use the maximum to sync
          if (event.data.count > totalTabCount) {
            updateStatus(isActive, event.data.count)
          }
        }
        else if (event.data.type === 'tab-leaving' && event.data.tabId !== TAB_ID) {
          updateStatus(isActive, Math.max(1, totalTabCount - 1))
        }
      })

      // Add a small random delay to allow all tabs to join the channel
      // This prevents race conditions during HMR reloads when multiple tabs initialize simultaneously
      const initializationDelay = Math.random() * 150

      setTimeout(async () => {
        // Count tabs and determine initial state
        const count = await countAliveTabs()

        // Initialize focus and visibility state
        windowHasFocus = typeof document !== 'undefined' && document.hasFocus()
        documentIsVisible = typeof document !== 'undefined' && !document.hidden

        // Check if this tab was the active one before reload
        let wasActiveBeforeReload = false
        try {
          const lastActiveTabId = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY)
          wasActiveBeforeReload = lastActiveTabId === TAB_ID
        }
        catch {
          // Ignore if localStorage is not available
        }

        // Determine if this tab should be active
        // Priority: was active before reload > currently focused and visible
        const shouldBeActive = wasActiveBeforeReload || (windowHasFocus && documentIsVisible)
        updateStatus(shouldBeActive, count)

        // Announce this tab's presence
        tabChannel?.postMessage({ type: 'tab-joined', tabId: TAB_ID })

        // If we're claiming active status, broadcast it
        if (shouldBeActive) {
          tabChannel?.postMessage({ type: 'tab-focused', tabId: TAB_ID })
        }
      }, initializationDelay)

      // Notify other tabs when this tab closes
      broadcastTabLeaving = () => {
        tabChannel?.postMessage({ type: 'tab-leaving', tabId: TAB_ID })

        // Clean up stored tab ID when tab is actually closing
        try {
          sessionStorage.removeItem(TAB_ID_STORAGE_KEY)
          // If this was the active tab, clear the active tab storage
          const activeTabId = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY)
          if (activeTabId === TAB_ID) {
            localStorage.removeItem(ACTIVE_TAB_STORAGE_KEY)
          }
        }
        catch {
          // Ignore if storage is not available
        }
      }

      if (typeof window !== 'undefined') {
        window.addEventListener('beforeunload', broadcastTabLeaving)
        window.addEventListener('pagehide', broadcastTabLeaving)

        // Track when this tab becomes visible/hidden within its window
        visibilityChangeHandler = () => {
          documentIsVisible = !document.hidden
          checkAndUpdateActive()
        }
        document.addEventListener('visibilitychange', visibilityChangeHandler)

        // Track when window gains focus
        focusHandler = () => {
          windowHasFocus = true
          checkAndUpdateActive()
        }
        window.addEventListener('focus', focusHandler)

        // Track when window loses focus
        blurHandler = () => {
          windowHasFocus = false
          checkAndUpdateActive()
        }
        window.addEventListener('blur', blurHandler)
      }
    }
    else {
      // Fallback if BroadcastChannel not supported - single tab
      updateStatus(true, 1)
    }
  }

  const cleanup = () => {
    if (typeof window !== 'undefined' && broadcastTabLeaving) {
      window.removeEventListener('beforeunload', broadcastTabLeaving)
      window.removeEventListener('pagehide', broadcastTabLeaving)
      broadcastTabLeaving = null
    }

    if (typeof document !== 'undefined' && visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', visibilityChangeHandler)
      visibilityChangeHandler = null
    }

    if (typeof window !== 'undefined' && focusHandler) {
      window.removeEventListener('focus', focusHandler)
      focusHandler = null
    }

    if (typeof window !== 'undefined' && blurHandler) {
      window.removeEventListener('blur', blurHandler)
      blurHandler = null
    }

    tabChannel?.close()
    tabChannel = null
  }

  const getStatus = (): ActiveTabStatus => {
    return { tabId: TAB_ID, isActive, totalTabCount }
  }

  const getTabId = (): string => {
    return TAB_ID
  }

  return {
    initialize,
    cleanup,
    getStatus,
    getTabId,
    get isActive() {
      return isActive
    },
  }
}
