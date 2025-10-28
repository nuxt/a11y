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

// subset of axe tags relevant for filtering (Axe Core Tags)
const AXE_TAG_WCAG2A  = 'wcag2a'	    // WCAG 2.0 Level A
const AXE_TAG_WCAG2AA  = 'wcag2aa'	    // WCAG 2.0 Level AA
const AXE_TAG_WCAG2AAA = 'wcag2aaa' 	    // WCAG 2.0 Level AAA
const AXE_TAG_WCAG21A  = 'wcag21a'	    // WCAG 2.1 Level A
const AXE_TAG_WCAG21AA = 'wcag21aa' 	    // WCAG 2.1 Level AA
const AXE_TAG_WCAG22AA = 'wcag22aa' 	    // WCAG 2.2 Level AA
const AXE_TAG_BEST_PRACTICE = 'best-practice' // Common accessibility best practices

export const ALL_SUPPORTED_AXE_CORE_TYPES = [
  AXE_TAG_WCAG2A,
  AXE_TAG_WCAG2AA,
  AXE_TAG_WCAG2AAA,
  AXE_TAG_WCAG21A,
  AXE_TAG_WCAG21AA,
  AXE_TAG_WCAG22AA,
  AXE_TAG_BEST_PRACTICE,
] as const;

export type AxeTag = (typeof ALL_SUPPORTED_AXE_CORE_TYPES)[number];

export type ViolationsByImpact = Record<NonNullable<axe.ImpactValue>, A11yViolation[]>

export type ImpactColor = '#720026' | '#f25c54' | '#cf863e' | '#f7e167'

export interface ImpactStat {
  impact: NonNullable<axe.ImpactValue>
  count: number
  elementsCount: number
  color: ImpactColor
}

/**
 * Window interface with exposed a11y testing functions
 */
export interface A11yWindow extends Window {
  __nuxt_a11y_run__?: () => Promise<void>
  __nuxt_a11y_enableConstantScanning__?: () => void
  __nuxt_a11y_disableConstantScanning__?: () => void
}
