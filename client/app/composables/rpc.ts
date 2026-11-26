import { getDevToolsRpcClient } from '@vitejs/devtools-kit/client'
import { ref, computed, shallowRef } from 'vue'
import type { ClientFunctions, ServerFunctions } from '../../../src/rpc-types'
import { RPC_NAMESPACE } from '../../../src/rpc-types'
import type { A11yViolation } from '../../../src/runtime/types'
import type { ModuleOptions } from '../../../src/module'
import { handleRouteChange } from './route-watcher'

// Store violations per tab
const violationsByTab = ref<Map<string, A11yViolation[]>>(new Map())
export const currentActiveTabId = shallowRef<string>('')

// Current route per tab
const routeByTab = ref<Map<string, string>>(new Map())

export const isScanRunning = shallowRef(false)
export const isConstantScanningEnabled = shallowRef(false)
export const isRouteChangeScan = shallowRef(false)
export const totalTabCount = shallowRef(1)

// Computed values for the currently active tab
export const axeViolations = computed(() => {
  return violationsByTab.value.get(currentActiveTabId.value) || []
})

export const currentRoute = computed(() => {
  return routeByTab.value.get(currentActiveTabId.value) || '/'
})

export const moduleOptions = shallowRef<ModuleOptions>()

const clientFunctions: ClientFunctions = {
  showViolations(payload) {
    // Store violations for this specific tab
    violationsByTab.value.set(payload.tabId, payload.violations)
    // Update route for this tab
    routeByTab.value.set(payload.tabId, payload.currentRoute)
  },
  scanRunning(running) {
    isScanRunning.value = running
  },
  constantScanningEnabled(enabled) {
    isConstantScanningEnabled.value = enabled
  },
  routeChanged(path) {
    // Only handle route change if it's for the active tab
    if (currentActiveTabId.value) {
      routeByTab.value.set(currentActiveTabId.value, path)
      handleRouteChange()
    }
  },
  activeTabChanged(payload) {
    // Update which tab is currently active
    currentActiveTabId.value = payload.tabId
    totalTabCount.value = payload.totalTabCount
  },
}

// Initialize RPC connection and register handlers
async function connectDevtoolsRpc() {
  try {
    const kit = await getDevToolsRpcClient()
    const { rpc } = kit.scope(RPC_NAMESPACE)

    for (const [name, handler] of Object.entries(clientFunctions)) {
      rpc.register({ name, type: 'event', handler })
    }

    return rpc
  }
  catch (error) {
    console.debug('[Nuxt A11y] Failed to connect to DevTools RPC:', error)
  }
}

const devtoolsRpcPromise = connectDevtoolsRpc()

/**
 * Call a server function once the DevTools RPC connection is ready.
 * Resolves to `undefined` if the connection or the call fails.
 */
export async function callServer<K extends keyof ServerFunctions>(
  method: K,
  ...args: Parameters<ServerFunctions[K]>
): Promise<Awaited<ReturnType<ServerFunctions[K]>> | undefined> {
  const rpc = await devtoolsRpcPromise

  if (!rpc)
    return undefined

  try {
    return await rpc.call(method, ...args) as Awaited<ReturnType<ServerFunctions[K]>>
  }
  catch (error) {
    console.debug(`[Nuxt A11y] Server call "${method}" failed:`, error)
    return undefined
  }
}

async function initialize() {
  moduleOptions.value = await callServer('getOptions')
  await callServer('connected')
}

initialize()
