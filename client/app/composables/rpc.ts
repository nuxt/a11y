import { getDevToolsRpcClient } from '@vitejs/devtools-kit/client'
import { ref, computed, shallowRef } from 'vue'
import type { ClientFunctions, ServerFunctions } from '../../../src/rpc-types'
import { RPC_NAMESPACE } from '../../../src/rpc-types'
import type { A11yViolation } from '../../../src/runtime/types'
import { handleRouteChange } from './route-watcher'

type ServerRpc = {
  [K in keyof ServerFunctions]: (...args: Parameters<ServerFunctions[K]>) => Promise<Awaited<ReturnType<ServerFunctions[K]>>>
}

const serverFunctionNames = Object.keys({
  getOptions: true,
  reset: true,
  connected: true,
  enableConstantScanning: true,
  disableConstantScanning: true,
  triggerScan: true,
  highlightElement: true,
  unhighlightElement: true,
  unhighlightAll: true,
  updateElementId: true,
  removeElementIdBadge: true,
  scrollToElement: true,
} satisfies Record<keyof ServerFunctions, true>) as (keyof ServerFunctions)[]

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

export const nuxtA11yRpc = shallowRef<ServerRpc>()

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
async function connect() {
  const kit = await getDevToolsRpcClient()
  const { rpc } = kit.scope(RPC_NAMESPACE)

  for (const [name, handler] of Object.entries(clientFunctions)) {
    rpc.register({ name, type: 'event', handler })
  }

  nuxtA11yRpc.value = Object.fromEntries(
    serverFunctionNames.map(name => [name, (...args: unknown[]) => rpc.call(name, ...args)]),
  ) as ServerRpc

  try {
    await nuxtA11yRpc.value.connected()
  }
  catch (error) {
    console.debug('[Nuxt A11y] Initial connection error (expected):', error)
  }
}

connect().catch((error) => {
  console.debug('[Nuxt A11y] Failed to connect to DevTools RPC:', error)
})

export function enableConstantScanning() {
  if (!nuxtA11yRpc.value) return

  nuxtA11yRpc.value.enableConstantScanning().catch(() => {})
}

export function disableConstantScanning() {
  if (!nuxtA11yRpc.value) return

  nuxtA11yRpc.value.disableConstantScanning().catch(() => {})
}

export function triggerScan() {
  if (!nuxtA11yRpc.value) return

  nuxtA11yRpc.value.triggerScan().catch(() => {})
}

export function resetViolations() {
  if (!nuxtA11yRpc.value) return

  nuxtA11yRpc.value.reset().catch(() => {})
}

export async function highlightElement(selector: string, id?: number, color?: string) {
  if (!nuxtA11yRpc.value)
    return
  await nuxtA11yRpc.value.highlightElement(selector, id, color)
}

export function unhighlightElement(selector: string) {
  if (!nuxtA11yRpc.value) return

  nuxtA11yRpc.value.unhighlightElement(selector).catch(() => {})
}

export function unhighlightAll() {
  if (!nuxtA11yRpc.value) return

  nuxtA11yRpc.value.unhighlightAll().catch(() => {})
}

export function updateElementId(selector: string, id: number) {
  if (!nuxtA11yRpc.value) return

  nuxtA11yRpc.value.updateElementId(selector, id).catch(() => {})
}

export function removeElementIdBadge(selector: string) {
  if (!nuxtA11yRpc.value) return

  nuxtA11yRpc.value.removeElementIdBadge(selector).catch(() => {})
}

export function scrollToElement(selector: string) {
  if (!nuxtA11yRpc.value) return

  nuxtA11yRpc.value.scrollToElement(selector).catch(() => {})
}
