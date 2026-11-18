import type { ModuleOptions } from './module'
import type { ClientFunctions } from './runtime/types'

export type { ActiveTabPayload, ClientFunctions, ViolationsPayload } from './runtime/types'

export const RPC_NAMESPACE = 'nuxt-a11y'

export interface ServerFunctions {
  getOptions: () => ModuleOptions
  reset: () => void
  connected: () => void
  enableConstantScanning: () => void
  disableConstantScanning: () => void
  triggerScan: () => void
  highlightElement: (selector: string, id?: number, color?: string) => void
  unhighlightElement: (selector: string) => void
  unhighlightAll: () => void
  updateElementId: (selector: string, id: number) => void
  removeElementIdBadge: (selector: string) => void
  scrollToElement: (selector: string) => void
}

type Namespaced<T> = {
  [K in keyof T & string as `${typeof RPC_NAMESPACE}:${K}`]: T[K]
}

declare module '@vitejs/devtools-kit' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface DevToolsRpcServerFunctions extends Namespaced<ServerFunctions> {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface DevToolsRpcClientFunctions extends Namespaced<ClientFunctions> {}
}
