import type axe from 'axe-core'
import type { ImpactColor } from './types'

export const IMPACT_LEVELS: readonly NonNullable<axe.ImpactValue>[] = ['critical', 'serious', 'moderate', 'minor'] as const

export const IMPACT_COLORS: Record<NonNullable<axe.ImpactValue>, ImpactColor> = {
  critical: '#720026',
  serious: '#f25c54',
  moderate: '#cf863e',
  minor: '#f7e167',
} as const
