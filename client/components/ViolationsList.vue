<script setup lang="ts">
import type { ViolationsByImpact } from '../../src/runtime/types'
import { IMPACT_COLORS, IMPACT_LEVELS } from '../../src/runtime/constants'

defineProps<{
  violationsByImpact: ViolationsByImpact
}>()
</script>

<template>
  <div class="space-y-4">
    <template
      v-for="impact in IMPACT_LEVELS"
      :key="impact"
    >
      <div v-if="violationsByImpact[impact].length > 0">
        <h3
          :id="`${impact}-issues`"
          class="text-sm font-semibold uppercase tracking-wide opacity-70 mb-3 flex items-center gap-2 scroll-mt-4"
        >
          {{ impact }} Issues
          <NBadge>
            {{ violationsByImpact[impact].length }}
          </NBadge>
        </h3>

        <div class="space-y-3">
          <ViolationCard
            v-for="v in violationsByImpact[impact]"
            :key="v.id + v.timestamp"
            :violation="v"
            :impact-color="v.impact ? IMPACT_COLORS[v.impact] : 'gray'"
          />
        </div>
      </div>
    </template>
  </div>
</template>
