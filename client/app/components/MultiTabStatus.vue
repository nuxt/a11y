<script setup lang="ts">
import { totalTabCount, currentRoute, currentActiveTabId } from '../composables/rpc'
import { computed } from 'vue'

const showMultiTabInfo = computed(() => {
  return totalTabCount.value > 1
})
</script>

<template>
  <div
    v-if="showMultiTabInfo"
    class="mb-4 p-3 rounded-lg border bg-blue-500/10 border-blue-500/30"
  >
    <div class="flex items-start gap-3">
      <NIcon
        icon="i-carbon-information"
        class="text-lg mt-0.5 flex-shrink-0 text-blue-500"
      />
      <div class="flex-1">
        <h3 class="font-semibold text-sm mb-1 text-blue-500">
          Multiple Tabs Detected
        </h3>
        <p class="text-xs opacity-90 leading-relaxed">
          You have <span class="font-semibold">{{ totalTabCount }} tabs</span> open. Each tab maintains its own
          <span class="font-semibold">isolated results</span>. The DevTools shows violations from the tab you're currently viewing.
          Current route: <span class="font-mono font-semibold px-1.5 py-0.5 bg-blue-500/20 rounded">{{ currentRoute }}</span>
        </p>
        <p class="text-xs opacity-75 mt-1">
          Tab ID: <span class="font-mono text-[10px]">{{ currentActiveTabId }}</span>
        </p>
      </div>
    </div>
  </div>
</template>
