import type {A11yViolation, AxeTag} from './runtime/types'
import type { ModuleOptions } from './module'

export interface ServerFunctions {
  getOptions: () => ModuleOptions
  reset: () => void
  connected: () => void
  enableConstantScanning: () => void
  disableConstantScanning: () => void
  triggerScan: (tags?: AxeTag[]) => void
}

export interface ClientFunctions {
  showViolations: (payload: A11yViolation[]) => void
  scanRunning: (running: boolean) => void
  constantScanningEnabled: (enabled: boolean) => void
}
