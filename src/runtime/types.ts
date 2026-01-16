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
