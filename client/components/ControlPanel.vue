<script setup lang="ts">
import { isScanRunning, isConstantScanningEnabled, enableConstantScanning, disableConstantScanning, triggerScan, resetViolations } from '../composables/rpc'

defineProps<{
  totalViolations: number
}>()

function toggleConstantScanning() {
  if (isConstantScanningEnabled.value) {
    disableConstantScanning()
  }
  else {
    enableConstantScanning()
  }
}

function handleTriggerScan() {
  triggerScan()
}

function handleReset() {
  resetViolations()
}
</script>

<template>
  <NCard class="p-4 mb-4">
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <div class="flex items-center gap-4 flex-wrap">
        <button
          class="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="isScanRunning"
          @click="handleTriggerScan"
        >
          <span class="flex items-center gap-2">
            <NIcon
              :icon="isScanRunning ? 'i-carbon-renew' : 'i-carbon-play'"
              :class="{ 'animate-spin': isScanRunning }"
            />
            {{ isScanRunning ? 'Scanning' : 'Run Scan' }}
          </span>
        </button>

        <button
          class="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="totalViolations === 0"
          @click="handleReset"
        >
          <span class="flex items-center gap-2">
            <NIcon icon="i-carbon-trash-can" />
            Clear Results
          </span>
        </button>

        <div class="flex items-center gap-2">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              :checked="isConstantScanningEnabled"
              class="w-4 h-4 cursor-pointer"
              @change="toggleConstantScanning"
            >
            <span class="text-sm">Auto-scan on user events</span>
          </label>
          <NIcon
            v-if="isConstantScanningEnabled"
            icon="i-carbon-checkmark-filled"
            class="text-green-500"
          />
        </div>
      </div>

      <div
        v-if="isConstantScanningEnabled"
        class="text-xs opacity-60"
      >
        Scanning automatically on mouse, keyboard, and touch events
      </div>
    </div>
  </NCard>
</template>
