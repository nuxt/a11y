/**
 * Leading Tab Manager
 * Manages leader election across multiple browser tabs.
 * Only one tab is designated as the "leader" at any time - this tab actively scans and reports violations.
 * If the leader tab closes, another tab automatically takes over.
 */

const LEADING_TAB_CHANNEL_NAME = 'nuxt-a11y-leading-tab'

interface LeadingTabStatus {
  isLeader: boolean
  tabCount: number
}

type StatusChangeCallback = (status: LeadingTabStatus) => void

export function createLeadingTabManager(onStatusChange: StatusChangeCallback) {
  const TAB_ID = crypto.randomUUID()
  let isLeader = false
  let leadingTabChannel: BroadcastChannel | null = null
  let activeTabCount = 1
  let leaderCheckInterval: ReturnType<typeof setInterval> | null = null
  let broadcastTabLeaving: (() => void) | null = null
  let visibilityChangeHandler: (() => void) | null = null

  const updateStatus = (newIsLeader: boolean, newTabCount: number = activeTabCount) => {
    const statusChanged = isLeader !== newIsLeader
    const countChanged = activeTabCount !== newTabCount

    if (newTabCount >= 1 && (statusChanged || countChanged)) {
      isLeader = newIsLeader
      activeTabCount = newTabCount
      onStatusChange({ isLeader, tabCount: activeTabCount })
    }
  }

  const becomeLeader = (tabCount: number = activeTabCount) => {
    updateStatus(true, tabCount)
    leadingTabChannel?.postMessage({ type: 'leader-claim', tabId: TAB_ID, tabCount })
  }

  const checkForLeader = () => {
    return new Promise<{ leaderExists: boolean, tabCount: number }>((resolve) => {
      let responseReceived = false
      const aliveTabs = new Set<string>([TAB_ID])

      const responseHandler = (event: MessageEvent) => {
        if (event.data.type === 'leader-response') {
          responseReceived = true
        }
        if (event.data.type === 'tab-alive' && event.data.tabId !== TAB_ID) {
          aliveTabs.add(event.data.tabId)
        }
      }

      leadingTabChannel?.addEventListener('message', responseHandler)
      leadingTabChannel?.postMessage({ type: 'leader-ping' })

      setTimeout(() => {
        leadingTabChannel?.removeEventListener('message', responseHandler)
        resolve({ leaderExists: responseReceived, tabCount: aliveTabs.size })
      }, 100)
    })
  }

  const initialize = () => {
    // Initialize BroadcastChannel for inter-tab communication
    if (typeof BroadcastChannel !== 'undefined') {
      leadingTabChannel = new BroadcastChannel(LEADING_TAB_CHANNEL_NAME)

      leadingTabChannel.addEventListener('message', (event) => {
        if (event.data.type === 'leader-claim' && event.data.tabId !== TAB_ID) {
          updateStatus(false, event.data.tabCount || 2)
        }
        else if (event.data.type === 'leader-ping') {
          if (isLeader) {
            leadingTabChannel?.postMessage({ type: 'leader-response', tabId: TAB_ID })
          }
          leadingTabChannel?.postMessage({ type: 'tab-alive', tabId: TAB_ID })
        }
        else if (event.data.type === 'tab-joined' && event.data.tabId !== TAB_ID) {
          updateStatus(isLeader, activeTabCount + 1)
        }
        else if (event.data.type === 'tab-leaving' && event.data.tabId !== TAB_ID) {
          updateStatus(isLeader, Math.max(1, activeTabCount - 1))
        }
      })

      // Initialize leader status
      checkForLeader().then(({ leaderExists, tabCount }) => {
        if (!leaderExists) {
          becomeLeader(tabCount)
        }
        else {
          updateStatus(false, tabCount)
        }

        leadingTabChannel?.postMessage({ type: 'tab-joined', tabId: TAB_ID })
      })

      // Periodically check if leader still exists
      leaderCheckInterval = setInterval(async () => {
        if (!isLeader) {
          const { leaderExists, tabCount } = await checkForLeader()
          if (!leaderExists) {
            becomeLeader(tabCount)
          }
        }
      }, 5000)

      // Notify other tabs when this tab closes
      broadcastTabLeaving = () => {
        leadingTabChannel?.postMessage({ type: 'tab-leaving', tabId: TAB_ID })
      }

      if (typeof window !== 'undefined') {
        window.addEventListener('beforeunload', broadcastTabLeaving)
        window.addEventListener('pagehide', broadcastTabLeaving)

        // Broadcast status when this tab becomes visible
        visibilityChangeHandler = () => {
          if (!document.hidden) {
            onStatusChange({ isLeader, tabCount: activeTabCount })
          }
        }
        document.addEventListener('visibilitychange', visibilityChangeHandler)
      }
    }
    else {
      // Fallback if BroadcastChannel not supported
      updateStatus(true)
    }
  }

  const cleanup = () => {
    if (leaderCheckInterval) {
      clearInterval(leaderCheckInterval)
      leaderCheckInterval = null
    }

    if (typeof window !== 'undefined' && broadcastTabLeaving) {
      window.removeEventListener('beforeunload', broadcastTabLeaving)
      window.removeEventListener('pagehide', broadcastTabLeaving)
      broadcastTabLeaving = null
    }

    if (typeof document !== 'undefined' && visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', visibilityChangeHandler)
      visibilityChangeHandler = null
    }

    leadingTabChannel?.close()
    leadingTabChannel = null
  }

  const getStatus = (): LeadingTabStatus => {
    return { isLeader, tabCount: activeTabCount }
  }

  return {
    initialize,
    cleanup,
    getStatus,
    get isLeader() {
      return isLeader
    },
  }
}
