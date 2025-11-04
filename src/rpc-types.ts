import type { A11yViolation } from './runtime/types'
import type { ModuleOptions } from './module'

export interface ViolationsPayload {
  violations: A11yViolation[]
  currentRoute: string
}

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

export interface ClientFunctions {
  showViolations: (payload: ViolationsPayload) => void
  scanRunning: (running: boolean) => void
  constantScanningEnabled: (enabled: boolean) => void
  routeChanged: (path: string) => void
}
