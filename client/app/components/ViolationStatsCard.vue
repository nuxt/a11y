<script setup lang="ts">
import type { ImpactStat } from '../../../src/runtime/types'
import { useDark } from '@vueuse/core'

defineProps<{
  stats: ImpactStat[]
}>()

const isDark = useDark()
</script>

<template>
  <div class="grid grid-cols-4 gap-3">
    <a
      v-for="stat in stats"
      :key="stat.impact + stat.count + stat.colors.light.bg"
      :href="stat.count > 0 ? `#${stat.impact}-issues` : undefined"
      class="block"
      :class="{ 'cursor-pointer': stat.count > 0, 'cursor-default': stat.count === 0 }"
    >
      <NCard
        class="p-3 h-full transition-colors"
        :class="{ 'hover:border-primary': stat.count > 0 }"
      >
        <div class="flex items-center justify-between mb-2">
          <NBadge
            class="text-xs capitalize font-semibold"
            :style="{
              backgroundColor: isDark ? stat.colors.dark.bg : stat.colors.light.bg,
              color: isDark ? stat.colors.dark.text : stat.colors.light.text,
            }"
          >
            {{ stat.impact }}
          </NBadge>
        </div>
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <div class="text-2xl font-bold">
              {{ stat.count }}
            </div>
            <div class="text-xs opacity-70 mt-1">
              {{ stat.elementsCount }} element{{ stat.elementsCount !== 1 ? 's' : '' }}
            </div>
          </div>
        </div>
      </NCard>
    </a>
  </div>
</template>
