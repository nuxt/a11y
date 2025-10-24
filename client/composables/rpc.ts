import type { NuxtDevtoolsClient } from '@nuxt/devtools-kit/types'
import type { BirpcReturn } from 'birpc'
import type { ClientFunctions, ServerFunctions } from '../../src/rpc-types'
import { onDevtoolsClientConnected } from '@nuxt/devtools-kit/iframe-client'
import { ref } from 'vue'
import type { A11yViolation } from '../../src/runtime/types'

const RPC_NAMESPACE = 'nuxt-a11y-rpc'

export const axeViolations = ref<A11yViolation[]>([])
export const isScanRunning = ref(true)
export const isConstantScanningEnabled = ref(false)

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
      axeViolations.value = payload
    },
    scanRunning(running: boolean) {
      isScanRunning.value = running
    },
    constantScanningEnabled(enabled: boolean) {
      isConstantScanningEnabled.value = enabled
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
