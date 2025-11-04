<script setup lang="ts">
import type { A11yViolation, A11yViolationNode } from '../../src/runtime/types'
import { highlightElement, unhighlightElement, removeElementIdBadge, scrollToElement, currentRoute } from '../composables/rpc'
import { computed } from 'vue'
import { pinElement, unpinElement, getElementId, isElementPinned } from '../composables/pinned-elements'

const props = defineProps<{
  violation: A11yViolation
  impactColor: string
}>()

// Computed: check if this violation is on the current route
const isOnCurrentRoute = computed(() => {
  return props.violation.route === currentRoute.value
})

// Computed: check if ALL nodes in this violation are pinned
const isViolationPinned = computed(() => {
  return props.violation.nodes.every((node) => {
    const selector = getNodeSelector(node)
    return isElementPinned(selector)
  })
})

// Computed: check if ANY nodes in this violation are pinned
const hasAnyPinnedNodes = computed(() => {
  return props.violation.nodes.some((node) => {
    const selector = getNodeSelector(node)
    return isElementPinned(selector)
  })
})

function getNodeSelector(node: A11yViolationNode): string {
  return Array.isArray(node.target) ? node.target.join(' ') : String(node.target)
}

// Individual node click handler
function handleNodeClick(node: A11yViolationNode) {
  // Don't allow interaction if not on current route
  if (!isOnCurrentRoute.value) return

  const selector = getNodeSelector(node)

  if (isElementPinned(selector)) {
    // Unpin: remove from global state and remove ID badge
    unpinElement(selector)
    removeElementIdBadge(selector)
    // Always unhighlight to balance the highlight call from when we pinned
    unhighlightElement(selector)
  }
  else {
    // Pin: add to global state with ID and highlight
    const id = pinElement(selector)
    highlightElement(selector, id, props.impactColor)
  }
}

function isNodeHighlighted(node: A11yViolationNode): boolean {
  return isElementPinned(getNodeSelector(node))
}

// Check if a node is on the current route
function isNodeOnCurrentRoute(_node: A11yViolationNode): boolean {
  return props.violation.route === currentRoute.value
}

// Scroll to element handler
function handleScrollToElement(node: A11yViolationNode) {
  const selector = getNodeSelector(node)

  // Pin the element if not already pinned
  if (!isElementPinned(selector)) {
    const id = pinElement(selector)
    highlightElement(selector, id, props.impactColor)
  }

  // Scroll to the element
  scrollToElement(selector)
}

// Parent violation card handlers - REMOVED HOVER FUNCTIONALITY
function handleViolationClick() {
  // Don't allow interaction if not on current route
  if (!isOnCurrentRoute.value) return

  if (isViolationPinned.value) {
    // Unpin all nodes in this violation
    props.violation.nodes.forEach((node) => {
      const selector = getNodeSelector(node)
      unpinElement(selector)
      removeElementIdBadge(selector)
      // Always unhighlight to balance the highlight call from when we pinned
      unhighlightElement(selector)
    })
  }
  else {
    // Pin all nodes in this violation
    props.violation.nodes.forEach((node) => {
      const selector = getNodeSelector(node)
      const id = pinElement(selector)
      highlightElement(selector, id, props.impactColor)
    })
  }
}
</script>

<template>
  <NCard
    class="transition-colors"
    :class="{
      'ring-2 ring-primary': isViolationPinned,
      'hover:border-primary cursor-pointer': isOnCurrentRoute,
      'opacity-60 cursor-not-allowed': !isOnCurrentRoute,
    }"
  >
    <div class="p-4">
      <div
        class="flex items-start justify-between gap-4 mb-3"
        :class="isOnCurrentRoute ? 'cursor-pointer' : 'cursor-not-allowed'"
        @click="handleViolationClick"
      >
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2">
            <NBadge
              class="uppercase"
              :style="{
                borderColor: impactColor,
                borderWidth: '1.5px',
                borderStyle: 'solid',
                boxShadow: `0 2px 8px ${impactColor}40`,
              }"
            >
              {{ violation.impact || 'UNKNOWN' }}
            </NBadge>
            <span class="text-sm font-mono opacity-60">{{ violation.id }}</span>
            <div
              v-if="hasAnyPinnedNodes"
              class="flex items-center gap-1 ml-auto"
            >
              <button
                v-for="node in violation.nodes"
                :key="getNodeSelector(node)"
                type="button"
                class="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold cursor-pointer transition-all"
                :class="isNodeHighlighted(node)
                  ? 'bg-primary text-white hover:ring-2 hover:ring-primary hover:ring-offset-2'
                  : 'bg-gray-300 text-gray-600 opacity-50 hover:opacity-75'"
                :title="`Element ${getElementId(getNodeSelector(node)) || '#'} - Click to toggle`"
                :aria-label="`Toggle element ${getElementId(getNodeSelector(node)) || '#'}`"
                :aria-pressed="isNodeHighlighted(node)"
                @click.stop="handleNodeClick(node)"
              >
                {{ getElementId(getNodeSelector(node)) || '#' }}
              </button>
            </div>
          </div>
          <div
            v-if="violation.route"
            class="flex items-center gap-1 mb-2 text-xs opacity-70"
          >
            <NIcon icon="i-carbon-link" />
            <span class="font-mono">{{ violation.route }}</span>
          </div>
          <h4 class="font-semibold text-base mb-2">
            {{ violation.help }}
          </h4>
          <p
            v-if="violation.description"
            class="text-sm opacity-80 mb-3"
          >
            {{ violation.description }}
          </p>
        </div>
      </div>

      <NLink
        :href="violation.helpUrl"
        target="_blank"
        class="text-sm inline-flex items-center gap-1 mb-4"
        @click.stop
      >
        Learn about the <code class="px-1 py-0.5 mx-1 bg-gray-500/10 rounded text-xs font-mono">{{ violation.id }}</code> rule
      </NLink>

      <div
        v-if="violation.nodes && violation.nodes.length > 0"
        class="mt-4"
      >
        <details class="group">
          <summary class="cursor-pointer text-sm font-medium mb-2 flex items-center gap-2 hover:opacity-80">
            <NIcon
              icon="i-carbon-chevron-right"
              class="transition-transform group-open:rotate-90"
            />
            Affected Elements ({{ violation.nodes.length }})
          </summary>
          <div class="pl-6 space-y-2 mt-2">
            <NCard
              v-for="(node, id) in violation.nodes"
              :key="node.target + '-' + id"
              class="bg-gray-500/10 transition-all"
              :class="{
                'ring-2 ring-primary': isNodeHighlighted(node),
                'cursor-pointer hover:bg-gray-500/15': isOnCurrentRoute,
                'cursor-not-allowed opacity-50': !isOnCurrentRoute,
              }"
              :tabindex="isOnCurrentRoute ? 0 : -1"
              @click.stop="handleNodeClick(node)"
              @keydown.enter.stop="handleNodeClick(node)"
              @keydown.space.prevent.stop="handleNodeClick(node)"
            >
              <div class="p-3">
                <div class="flex items-start gap-2">
                  <NIcon
                    icon="i-carbon-code"
                    class="mt-0.5 opacity-50"
                  />
                  <div class="flex-1 min-w-0">
                    <div class="overflow-x-auto max-w-full">
                      <NCodeBlock
                        :code="node.target.join(' > ')"
                        lang="css"
                        class="text-xs"
                      />
                    </div>
                    <p
                      v-if="node.failureSummary"
                      class="text-xs opacity-70 mt-2"
                    >
                      {{ node.failureSummary }}
                    </p>
                  </div>
                  <div class="flex items-center gap-2 flex-shrink-0">
                    <!-- Locator button (only show for current route) -->
                    <button
                      v-if="isNodeOnCurrentRoute(node)"
                      type="button"
                      class="flex items-center justify-center w-6 h-6 rounded transition-colors hover:bg-gray-500/20 cursor-pointer"
                      title="Scroll to element"
                      @click.stop="handleScrollToElement(node)"
                    >
                      <NIcon
                        icon="i-carbon-location"
                        class="text-sm"
                      />
                    </button>
                    <!-- ID badge -->
                    <div
                      v-if="isNodeHighlighted(node)"
                      class="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold"
                    >
                      {{ getElementId(getNodeSelector(node)) }}
                    </div>
                  </div>
                </div>
              </div>
            </NCard>
          </div>
        </details>
      </div>
    </div>
  </NCard>
</template>

<style scoped>
summary {
  list-style: none;
}

summary::-webkit-details-marker {
  display: none;
}
</style>
