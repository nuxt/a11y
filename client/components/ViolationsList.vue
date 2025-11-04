<script setup lang="ts">
import type { ViolationsByImpact } from '../../src/runtime/types'
import { IMPACT_COLORS, IMPACT_LEVELS } from '../../src/runtime/constants'
import { computed } from 'vue'

const props = defineProps<{
  violationsByImpact: ViolationsByImpact
  showCurrentPageFirst: boolean
  currentRoute: string
}>()

// Sort violations by id within each impact level
const sortedViolationsByImpact = computed(() => {
  const sorted: ViolationsByImpact = {
    critical: [],
    serious: [],
    moderate: [],
    minor: [],
  }

  for (const impact of IMPACT_LEVELS) {
    sorted[impact] = [...props.violationsByImpact[impact]].sort((a, b) =>
      a.id.localeCompare(b.id),
    )
  }

  return sorted
})

// When showing current page first, create a flat array grouped by route, then by impact
const displayGroups = computed(() => {
  if (!props.showCurrentPageFirst) {
    // Normal mode: group by impact level
    return IMPACT_LEVELS.map(impact => ({
      title: `${impact} Issues`,
      impact,
      violations: sortedViolationsByImpact.value[impact],
      elementCount: sortedViolationsByImpact.value[impact].reduce((sum, v) => sum + v.nodes.length, 0),
    })).filter(group => group.violations.length > 0)
  }

  // Current page first mode: separate current page from other pages
  const currentPageViolations: ViolationsByImpact = {
    critical: [],
    serious: [],
    moderate: [],
    minor: [],
  }
  const otherPagesViolations: ViolationsByImpact = {
    critical: [],
    serious: [],
    moderate: [],
    minor: [],
  }

  // Split violations by current page vs other pages
  for (const impact of IMPACT_LEVELS) {
    sortedViolationsByImpact.value[impact].forEach((v) => {
      const isCurrentPage = v.route === props.currentRoute
      if (isCurrentPage) {
        currentPageViolations[impact].push(v)
      }
      else {
        otherPagesViolations[impact].push(v)
      }
    })
  }

  const groups = []

  // Add current page groups first
  for (const impact of IMPACT_LEVELS) {
    if (currentPageViolations[impact].length > 0) {
      groups.push({
        title: `${impact} Issues`,
        impact,
        violations: currentPageViolations[impact],
        elementCount: currentPageViolations[impact].reduce((sum, v) => sum + v.nodes.length, 0),
      })
    }
  }

  // Add other pages groups after
  for (const impact of IMPACT_LEVELS) {
    if (otherPagesViolations[impact].length > 0) {
      groups.push({
        title: `${impact} Issues (Other Pages)`,
        impact,
        violations: otherPagesViolations[impact],
        elementCount: otherPagesViolations[impact].reduce((sum, v) => sum + v.nodes.length, 0),
      })
    }
  }

  return groups
})
</script>

<template>
  <div class="space-y-4">
    <div
      v-for="group in displayGroups"
      :key="group.title"
    >
      <h3
        :id="`${group.impact}-issues`"
        class="text-sm font-semibold uppercase tracking-wide opacity-70 mb-3 flex items-center gap-2 scroll-mt-4"
      >
        {{ group.title }}
        <NBadge>
          {{ group.violations.length }}
        </NBadge>
        <span class="text-xs font-normal opacity-60">
          ({{ group.elementCount }} element{{ group.elementCount !== 1 ? 's' : '' }})
        </span>
      </h3>

      <div class="space-y-3">
        <ViolationCard
          v-for="v in group.violations"
          :key="v.id + v.timestamp"
          :violation="v"
          :impact-color="v.impact ? IMPACT_COLORS[v.impact] : 'gray'"
        />
      </div>
    </div>
  </div>
</template>
