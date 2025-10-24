<script setup lang="ts">
import type { ViolationsByImpact } from '../../src/runtime/types'
import { IMPACT_COLORS, IMPACT_LEVELS } from '../../src/runtime/constants'
import { computed } from 'vue'

const props = defineProps<{
  violationsByImpact: ViolationsByImpact
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

// Calculate element counts for each impact level
const elementCounts = computed(() => {
  const counts: Record<string, number> = {}
  for (const impact of IMPACT_LEVELS) {
    counts[impact] = sortedViolationsByImpact.value[impact].reduce(
      (sum, v) => sum + v.nodes.length,
      0,
    )
  }
  return counts
})
</script>

<template>
  <div class="space-y-4">
    <template
      v-for="impact in IMPACT_LEVELS"
      :key="impact"
    >
      <div v-if="sortedViolationsByImpact[impact].length > 0">
        <h3
          :id="`${impact}-issues`"
          class="text-sm font-semibold uppercase tracking-wide opacity-70 mb-3 flex items-center gap-2 scroll-mt-4"
        >
          {{ impact }} Issues
          <NBadge>
            {{ sortedViolationsByImpact[impact].length }}
          </NBadge>
          <span class="text-xs font-normal opacity-60">
            ({{ elementCounts[impact] }} element{{ elementCounts[impact] !== 1 ? 's' : '' }})
          </span>
        </h3>

        <div class="space-y-3">
          <ViolationCard
            v-for="v in sortedViolationsByImpact[impact]"
            :key="v.id + v.timestamp"
            :violation="v"
            :impact-color="v.impact ? IMPACT_COLORS[v.impact] : 'gray'"
          />
        </div>
      </div>
    </template>
  </div>
</template>
