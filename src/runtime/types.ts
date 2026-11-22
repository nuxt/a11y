import type axe from 'axe-core'

export interface A11yViolationNode {
  target: axe.NodeResult['target']
  html: string
  failureSummary: string | undefined
}

export interface A11yViolation {
  id: string
  impact: axe.ImpactValue | undefined
  help: string
  helpUrl: string
  description: string
  nodes: A11yViolationNode[]
  tags: axe.TagValue[]
  timestamp: number
  route?: string
}

export type ViolationsByImpact = Record<NonNullable<axe.ImpactValue>, A11yViolation[]>

export type WcagLevel = 'all' | 'A' | 'AA' | 'AAA'

export interface ImpactColorSet {
  bg: string
  text: string
}

export interface ImpactColors {
  light: ImpactColorSet
  dark: ImpactColorSet
}

export interface ImpactStat {
  impact: NonNullable<axe.ImpactValue>
  count: number
  elementsCount: number
  colors: ImpactColors
}

/**
 * Window interface with exposed a11y testing functions
 */
export interface A11yWindow extends Window {
  __nuxt_a11y_run__?: () => Promise<void>
  __nuxt_a11y_enableConstantScanning__?: () => void
  __nuxt_a11y_disableConstantScanning__?: () => void
}

export interface ViolationsPayload {
  violations: A11yViolation[]
  currentRoute: string
  tabId: string
}

export interface ActiveTabPayload {
  tabId: string
  isActive: boolean
  totalTabCount: number
}

/**
 * Functions the DevTools client exposes over RPC.
 * The page broadcasts these over Vite's HMR channel and the DevTools server forwards them.
 */
export interface ClientFunctions {
  showViolations: (payload: ViolationsPayload) => void
  scanRunning: (running: boolean) => void
  constantScanningEnabled: (enabled: boolean) => void
  routeChanged: (path: string) => void
  activeTabChanged: (payload: ActiveTabPayload) => void
}

/**
 * Events sent from the DevTools server to the page over Vite's HMR channel
 */
export interface PageEvents {
  connected: undefined
  reset: undefined
  enableConstantScanning: undefined
  disableConstantScanning: undefined
  triggerScan: undefined
  highlightElement: { selector: string, id?: number, color?: string }
  unhighlightElement: string
  unhighlightAll: undefined
  updateElementId: { selector: string, id: number }
  removeElementIdBadge: string
  scrollToElement: string
}
