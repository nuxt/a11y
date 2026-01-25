<script setup lang="ts">
import type { WcagLevel } from '../../../src/runtime/types'
import { isScanRunning, isConstantScanningEnabled, enableConstantScanning, disableConstantScanning, triggerScan, resetViolations, axeViolations, currentRoute } from '../composables/rpc'
import { copyToClipboard } from '../composables/clipboard'
import { formatViolationsReport } from '../utils/format-report'

const props = defineProps<{
  totalViolations: number
  wcagFilter: WcagLevel
  wcagLevelOptions: { value: WcagLevel, label: string }[]
  hasViolations: boolean
}>()

const emit = defineEmits<{
  'update:wcagFilter': [value: WcagLevel]
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
  clearAllPinned()
  resetViolations()
}

async function handleCopyReport() {
  const report = formatViolationsReport(axeViolations.value, currentRoute.value)
  const success = await copyToClipboard(report)

  if (success) {
    devtoolsUiShowNotification({
      message: 'Report copied to clipboard',
      icon: 'i-carbon-checkmark',
      classes: 'text-white bg-green-600/90',
      duration: 3000,
    })
  }
  else {
    devtoolsUiShowNotification({
      message: 'Failed to copy report to clipboard',
      icon: 'i-carbon-close',
      classes: 'text-white bg-red-600/90',
      duration: 5000,
    })
  }
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

        <button
          class="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="totalViolations === 0"
          @click="handleCopyReport"
        >
          <span class="flex items-center gap-2">
            <NIcon icon="i-carbon-copy" />
            Copy Report
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

        <div
          v-if="props.hasViolations"
          class="flex items-center gap-2"
        >
          <span class="text-sm opacity-70">WCAG:</span>
          <NSelect
            :model-value="props.wcagFilter"
            aria-label="WCAG level filter"
            class="text-sm"
            @update:model-value="(value) => emit('update:wcagFilter', value as WcagLevel)"
          >
            <option
              v-for="option in props.wcagLevelOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </NSelect>
        </div>
      </div>

      <div
        v-if="isConstantScanningEnabled"
        class="text-xs opacity-70"
      >
        Scanning automatically on mouse, keyboard, and touch events
      </div>
    </div>
  </NCard>
</template>
