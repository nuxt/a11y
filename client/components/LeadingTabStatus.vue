<script setup lang="ts">
import { activeTabCount, isLeadingTab, currentRoute } from '../composables/rpc'
import { computed } from 'vue'

const showMultiTabWarning = computed(() => activeTabCount.value > 1)
</script>

<template>
  <div
    v-if="showMultiTabWarning"
    :class="[
      'mb-4 p-3 rounded-lg border',
      isLeadingTab
        ? 'bg-green-500/10 border-green-500/30'
        : 'bg-amber-500/10 border-amber-500/30',
    ]"
  >
    <div class="flex items-start gap-3">
      <NIcon
        :icon="isLeadingTab ? 'i-carbon-checkmark-filled' : 'i-carbon-warning-alt'"
        :class="[
          'text-lg mt-0.5 flex-shrink-0',
          isLeadingTab ? 'text-green-500' : 'text-amber-500',
        ]"
      />
      <div class="flex-1">
        <h3
          :class="[
            'font-semibold text-sm mb-1',
            isLeadingTab ? 'text-green-500' : 'text-amber-500',
          ]"
        >
          {{ isLeadingTab ? 'This tab is the active scanner' : 'This tab is inactive' }}
        </h3>
        <p class="text-xs opacity-90 leading-relaxed">
          <template v-if="isLeadingTab">
            This tab is <span class="font-semibold">actively scanning</span> and accumulating violations.
            Route: <span class="font-mono font-semibold px-1.5 py-0.5 bg-green-500/20 rounded">{{ currentRoute }}</span>
          </template>
          <template v-else>
            Only <span class="font-semibold">one tab at a time</span> can actively scan.
            The active tab is at route: <span class="font-mono font-semibold px-1.5 py-0.5 bg-amber-500/20 rounded">{{ currentRoute }}</span>
          </template>
        </p>
      </div>
    </div>
  </div>
</template>
