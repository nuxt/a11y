import { getDevToolsRpcClient } from '@vitejs/devtools-kit/client'
import type { DevToolsRpcClient } from '@vitejs/devtools-kit/client'
import { ref, computed, shallowRef } from 'vue'
// Side-effect import: registers the `nuxt-a11y:*` functions in the kit's RPC types
import '../../../src/rpc-types'
import type { A11yViolation } from '../../../src/runtime/types'
import { handleRouteChange } from './route-watcher'

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

const nuxtA11yRpc = shallowRef<DevToolsRpcClient>()

if (import.meta.client) {
  getDevToolsRpcClient()
    .then(setupRpc)
    .catch((error) => {
      console.error('[Nuxt A11y] Failed to connect to DevTools RPC:', error)
    })
}

async function setupRpc(rpc: DevToolsRpcClient) {
  rpc.client.register({
    name: 'nuxt-a11y:showViolations',
    type: 'event',
    handler(payload) {
      // Store violations for this specific tab
      violationsByTab.value.set(payload.tabId, payload.violations)
      // Update route for this tab
      routeByTab.value.set(payload.tabId, payload.currentRoute)
    },
  })

  rpc.client.register({
    name: 'nuxt-a11y:scanRunning',
    type: 'event',
    handler(running) {
      isScanRunning.value = running
    },
  })

  rpc.client.register({
    name: 'nuxt-a11y:constantScanningEnabled',
    type: 'event',
    handler(enabled) {
      isConstantScanningEnabled.value = enabled
    },
  })

  rpc.client.register({
    name: 'nuxt-a11y:routeChanged',
    type: 'event',
    handler(path) {
      // Only handle route change if it's for the active tab
      if (currentActiveTabId.value) {
        routeByTab.value.set(currentActiveTabId.value, path)
        handleRouteChange()
      }
    },
  })

  rpc.client.register({
    name: 'nuxt-a11y:activeTabChanged',
    type: 'event',
    handler(payload) {
      // Update which tab is currently active
      currentActiveTabId.value = payload.tabId
      totalTabCount.value = payload.totalTabCount
    },
  })

  nuxtA11yRpc.value = rpc

  try {
    await rpc.call('nuxt-a11y:connected')
  }
  catch (error) {
    console.debug('[Nuxt A11y] Initial connection error (expected):', error)
  }
}

export function getOptions() {
  return nuxtA11yRpc.value?.call('nuxt-a11y:getOptions')
}

export function enableConstantScanning() {
  nuxtA11yRpc.value?.call('nuxt-a11y:enableConstantScanning').catch(() => {})
}

export function disableConstantScanning() {
  nuxtA11yRpc.value?.call('nuxt-a11y:disableConstantScanning').catch(() => {})
}

export function triggerScan() {
  nuxtA11yRpc.value?.call('nuxt-a11y:triggerScan').catch(() => {})
}

export function resetViolations() {
  nuxtA11yRpc.value?.call('nuxt-a11y:reset').catch(() => {})
}

export async function highlightElement(selector: string, id?: number, color?: string) {
  await nuxtA11yRpc.value?.call('nuxt-a11y:highlightElement', selector, id, color)
}

export function unhighlightElement(selector: string) {
  nuxtA11yRpc.value?.call('nuxt-a11y:unhighlightElement', selector).catch(() => {})
}

export function unhighlightAll() {
  nuxtA11yRpc.value?.call('nuxt-a11y:unhighlightAll').catch(() => {})
}

export function updateElementId(selector: string, id: number) {
  nuxtA11yRpc.value?.call('nuxt-a11y:updateElementId', selector, id).catch(() => {})
}

export function removeElementIdBadge(selector: string) {
  nuxtA11yRpc.value?.call('nuxt-a11y:removeElementIdBadge', selector).catch(() => {})
}

export function scrollToElement(selector: string) {
  nuxtA11yRpc.value?.call('nuxt-a11y:scrollToElement', selector).catch(() => {})
}
