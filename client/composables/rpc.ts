import type { NuxtDevtoolsClient } from '@nuxt/devtools-kit/types'
import type { BirpcReturn } from 'birpc'
import type { ClientFunctions, ServerFunctions } from '../../src/rpc-types'
import { onDevtoolsClientConnected } from '@nuxt/devtools-kit/iframe-client'
import { ref } from 'vue'
import type { A11yViolation } from '../../src/runtime/types'
import { handleRouteChange } from './route-watcher'

const RPC_NAMESPACE = 'nuxt-a11y-rpc'

export const axeViolations = ref<A11yViolation[]>([])
export const isScanRunning = ref(false)
export const isConstantScanningEnabled = ref(false)
export const currentRoute = ref<string>('/')
export const isRouteChangeScan = ref(false)

export const devtools = ref<NuxtDevtoolsClient>()
export const nuxtA11yRpc = ref<BirpcReturn<ServerFunctions>>()
export const devtoolsRpc = ref<NuxtDevtoolsClient['rpc']>()

// Initialize RPC connection and register handlers
onDevtoolsClientConnected(async (client) => {
  devtoolsRpc.value = client.devtools.rpc
  devtools.value = client.devtools

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error untyped
  nuxtA11yRpc.value = client.devtools.extendClientRpc<ServerFunctions, ClientFunctions>(RPC_NAMESPACE, {
    showViolations(payload) {
      // Update currentRoute from the payload - this is the authoritative source
      currentRoute.value = payload.currentRoute
      // Set the violations
      axeViolations.value = payload.violations
    },
    scanRunning(running: boolean) {
      isScanRunning.value = running
    },
    constantScanningEnabled(enabled: boolean) {
      isConstantScanningEnabled.value = enabled
    },
    routeChanged(path: string) {
      currentRoute.value = path
      handleRouteChange()
    },
  })

  try {
    await nuxtA11yRpc.value!.connected()
  }
  catch (error) {
    console.debug('[Nuxt A11y] Initial connection error (expected):', error)
  }
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
