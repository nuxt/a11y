<script setup lang="ts">
import { totalTabCount, currentRoute, currentActiveTabId } from '../composables/rpc'
import { computed, ref } from 'vue'

const STORAGE_KEY = 'nuxt-a11y-dismissed-tabs'

// Load dismissed tabs from localStorage
function loadDismissedTabs(): Set<string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? new Set(JSON.parse(stored)) : new Set()
  }
  catch {
    return new Set()
  }
}

// Save dismissed tabs to localStorage
function saveDismissedTabs(tabs: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...tabs]))
  }
  catch {
    // Ignore localStorage errors
  }
}

// Store dismissed state per tab (synced with localStorage)
const dismissedTabs = ref<Set<string>>(loadDismissedTabs())

const showMultiTabInfo = computed(() => {
  return totalTabCount.value > 1 && !dismissedTabs.value.has(currentActiveTabId.value)
})

const dismiss = () => {
  if (currentActiveTabId.value) {
    dismissedTabs.value.add(currentActiveTabId.value)
    saveDismissedTabs(dismissedTabs.value)
  }
}

// Watch for storage events from other windows/tabs
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) {
      dismissedTabs.value = loadDismissedTabs()
    }
  })
}
</script>

<template>
  <div
    v-if="showMultiTabInfo"
    class="mb-4 p-3 rounded-lg border bg-blue-500/10 border-blue-500/30 relative"
  >
    <button
      class="absolute top-2 right-2 p-1 rounded hover:bg-blue-500/20 transition-colors"
      title="Dismiss"
      @click="dismiss"
    >
      <NIcon
        icon="i-carbon-close"
        class="text-base text-blue-500"
      />
    </button>
    <div class="flex items-start gap-3 pr-8">
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
