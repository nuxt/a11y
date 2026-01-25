<script setup lang="ts">
import { axeViolations, currentRoute } from './composables/rpc'
import { computed, ref, onMounted } from 'vue'
import type { ViolationsByImpact, ImpactStat, A11yViolation, WcagLevel } from '../../src/runtime/types'
import { IMPACT_LEVELS, IMPACT_COLORS } from '../../src/runtime/constants'
import type axe from 'axe-core'
import { initAutoHighlight } from './composables/auto-highlight'

const showCurrentPageFirst = ref(true)
const wcagFilter = ref<WcagLevel>('all')

const wcagLevelOptions: { value: WcagLevel, label: string }[] = [
  { value: 'all', label: 'No filter' },
  { value: 'A', label: 'Level A' },
  { value: 'AA', label: 'Level AA' },
  { value: 'AAA', label: 'Level AAA' },
]

function matchesWcagLevel(tags: string[], level: WcagLevel): boolean {
  if (level === 'all') return true
  const levelLength = level.length
  return tags.some((tag) => {
    if (!tag.startsWith('wcag')) return false
    const match = tag.match(/wcag\d+(a{1,3})$/)
    return match?.[1] && match[1].length <= levelLength
  })
}

const { version: axeVersion, docsUrl: axeDocsUrl } = useAxeVersion()
const { isShowingSkeleton } = useSkeletonLoader()

onMounted(() => initAutoHighlight())

const violations = computed(() =>
  axeViolations.value.filter(v => matchesWcagLevel(v.tags, wcagFilter.value)),
)

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
    colors: IMPACT_COLORS[impact],
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

    <!-- Can be uncommented if you want status insights about multi tab -->
    <!-- <MultiTabStatus /> -->

    <ControlPanel
      v-model:wcag-filter="wcagFilter"
      :total-violations="totalViolations"
      :wcag-level-options="wcagLevelOptions"
      :has-violations="axeViolations.length > 0"
    />

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
