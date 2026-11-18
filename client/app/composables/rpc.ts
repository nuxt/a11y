import { getDevToolsRpcClient } from '@vitejs/devtools-kit/client'
import type { DevToolsRpcClient } from '@vitejs/devtools-kit/client'
import { ref, computed, shallowRef } from 'vue'
import { RPC_NAMESPACE } from '../../../src/rpc-types'
import type { ClientFunctions, ServerFunctions } from '../../../src/rpc-types'
import type { A11yViolation } from '../../../src/runtime/types'
import { handleRouteChange } from './route-watcher'

type DevtoolsKit = DevToolsRpcClient
type AsyncServerFunctions = {
  [K in keyof ServerFunctions]: (...args: Parameters<ServerFunctions[K]>) => Promise<Awaited<ReturnType<ServerFunctions[K]>>>
}

const SERVER_FUNCTION_NAMES: Record<keyof ServerFunctions, true> = {
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
}

function createServerRpc(kit: DevtoolsKit): AsyncServerFunctions {
  // functions aren't in the kit's global RPC registry types, so widen `call`
  const call = kit.call.bind(kit) as (method: string, ...args: unknown[]) => Promise<unknown>
  const rpc: Record<string, (...args: unknown[]) => Promise<unknown>> = {}

  for (const name of Object.keys(SERVER_FUNCTION_NAMES))
    rpc[name] = (...args) => call(`${RPC_NAMESPACE}:${name}`, ...args)

  return rpc as AsyncServerFunctions
}

// Store violations per tab
const violationsByTab = ref<Map<string, A11yViolation[]>>(new Map())
export const currentActiveTabId = ref<string>('')

// Current route per tab
const routeByTab = ref<Map<string, string>>(new Map())

export const isScanRunning = ref(false)
export const isConstantScanningEnabled = ref(false)
export const isRouteChangeScan = ref(false)
export const totalTabCount = ref(1)

// Computed values for the currently active tab
export const axeViolations = computed(() => {
  return violationsByTab.value.get(currentActiveTabId.value) || []
})

export const currentRoute = computed(() => {
  return routeByTab.value.get(currentActiveTabId.value) || '/'
})

export const nuxtA11yRpc = shallowRef<AsyncServerFunctions>()

if (import.meta.client) {
  getDevToolsRpcClient()
    .then(setupRpc)
    .catch((error) => {
      console.error('[Nuxt A11y] Failed to connect to DevTools RPC:', error)
    })
}

async function setupRpc(kit: DevtoolsKit) {
  const clientFunctions: ClientFunctions = {
    showViolations(payload) {
      // Store violations for this specific tab
      violationsByTab.value.set(payload.tabId, payload.violations)
      // Update route for this tab
      routeByTab.value.set(payload.tabId, payload.currentRoute)
    },
    scanRunning(running: boolean) {
      isScanRunning.value = running
    },
    constantScanningEnabled(enabled: boolean) {
      isConstantScanningEnabled.value = enabled
    },
    routeChanged(path: string) {
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

  for (const [name, handler] of Object.entries(clientFunctions))
    kit.client.register({ name: `${RPC_NAMESPACE}:${name}`, type: 'event', handler })

  nuxtA11yRpc.value = createServerRpc(kit)

  try {
    await nuxtA11yRpc.value!.connected()
  }
  catch (error) {
    console.debug('[Nuxt A11y] Initial connection error (expected):', error)
  }
}

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
