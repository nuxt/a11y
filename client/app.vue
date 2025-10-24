<script setup lang="ts">
import { axeViolations, isScanRunning } from './composables/rpc'
import { computed } from 'vue'
import type { ViolationsByImpact, ImpactStat, A11yViolation } from '../src/runtime/types'
import { IMPACT_LEVELS, IMPACT_COLORS } from '../src/runtime/constants'
import type axe from 'axe-core'

const violations = computed(() => axeViolations.value)

const violationsByImpact = computed<ViolationsByImpact>(() => {
  const grouped: ViolationsByImpact = {
    critical: [],
    serious: [],
    moderate: [],
    minor: [],
  }

  violations.value.forEach((v: A11yViolation) => {
    const impact = (v.impact || 'moderate') as NonNullable<axe.ImpactValue>
    grouped[impact].push(v)
  })

  return grouped
})

const totalViolations = computed(() => violations.value.length)
const totalElements = computed(() =>
  violations.value.reduce((sum, v) => sum + v.nodes.length, 0),
)
const totalPages = computed(() => {
  const uniqueRoutes = new Set(violations.value.map(v => v.route).filter(Boolean))
  return uniqueRoutes.size
})

const impactStats = computed<ImpactStat[]>(() =>
  IMPACT_LEVELS.map(impact => ({
    impact,
    count: violationsByImpact.value[impact].length,
    elementsCount: violationsByImpact.value[impact].reduce((sum, v) => sum + v.nodes.length, 0),
    color: IMPACT_COLORS[impact],
  })),
)
</script>

<template>
  <div class="p-4">
    <div class="mb-4">
      <div class="flex items-center gap-3 mb-2">
        <NIcon
          icon="i-carbon-accessibility-alt"
          class="text-xl"
        />
        <h1 class="text-xl font-semibold">
          Accessibility Violations
        </h1>
      </div>
      <p class="text-sm opacity-70 ml-8">
        Automated accessibility testing results powered by axe-core
      </p>
    </div>

    <ControlPanel :total-violations="totalViolations" />

    <div
      v-if="totalViolations > 0"
      class="mb-6"
    >
      <div class="mb-3 text-sm opacity-70">
        <span class="font-semibold">{{ totalViolations }}</span> violation{{ totalViolations !== 1 ? 's' : '' }} affecting
        <span class="font-semibold">{{ totalElements }}</span> element{{ totalElements !== 1 ? 's' : '' }}
        <span v-if="totalPages > 0">
          on <span class="font-semibold">{{ totalPages }}</span> page{{ totalPages !== 1 ? 's' : '' }}
        </span>
      </div>
      <ViolationStatsCard :stats="impactStats" />
    </div>

    <EmptyState v-if="!isScanRunning && totalViolations === 0" />

    <ViolationsList
      v-else
      :violations-by-impact="violationsByImpact"
    />

    <ScrollToTop />
  </div>
</template>
