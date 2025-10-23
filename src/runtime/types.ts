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
}

export type ViolationsByImpact = Record<NonNullable<axe.ImpactValue>, A11yViolation[]>

export type ImpactColor = '#720026' | '#f25c54' | '#cf863e' | '#f7e167'

export interface ImpactStat {
  impact: NonNullable<axe.ImpactValue>
  count: number
  color: ImpactColor
}
