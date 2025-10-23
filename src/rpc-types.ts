import type { A11yViolation } from './runtime/types'
import type { ModuleOptions } from './module'

export interface ServerFunctions {
  getOptions: () => ModuleOptions
  reset: () => void
  connected: () => void
}

export interface ClientFunctions {
  showViolations: (payload: A11yViolation[]) => void
  scanRunning: (running: boolean) => void
}
