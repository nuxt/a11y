<script setup lang="ts">
import { axeViolations, currentRoute } from './composables/rpc'
import { computed, ref } from 'vue'
import type { ViolationsByImpact, ImpactStat, A11yViolation } from '../src/runtime/types'
import { IMPACT_LEVELS, IMPACT_COLORS } from '../src/runtime/constants'
import type axe from 'axe-core'

const showCurrentPageFirst = ref(true)

// Get axe-core version for documentation link
const { version: axeVersion, docsUrl: axeDocsUrl } = useAxeVersion()

// Skeleton loader logic
const { isShowingSkeleton } = useSkeletonLoader()

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
        Automated accessibility testing results powered by <NLink
          :href="axeDocsUrl"
          target="_blank"
          class="underline hover:opacity-100"
        >
          axe-core {{ axeVersion }}
        </NLink>
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

      <div
        v-if="totalPages > 1"
        class="mb-3 flex items-center gap-2 text-sm"
      >
        <input
          id="show-current-first"
          v-model="showCurrentPageFirst"
          type="checkbox"
          class="cursor-pointer"
        >
        <label
          for="show-current-first"
          class="cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
        >
          Show issues on current page first
        </label>
      </div>

      <ViolationStatsCard :stats="impactStats" />
    </div>

    <LoadingSkeleton v-if="isShowingSkeleton" />

    <EmptyState v-else-if="totalViolations === 0" />

    <ViolationsList
      v-else
      :violations-by-impact="violationsByImpact"
      :show-current-page-first="showCurrentPageFirst"
      :current-route="currentRoute"
    />

    <ScrollToTop />
    <div
      role="status"
      aria-live="polite"
    >
      <NNotification />
    </div>
  </div>
</template>
