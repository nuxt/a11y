<script setup lang="ts">
import type { A11yViolation } from '../../src/runtime/types'

defineProps<{
  violation: A11yViolation
  impactColor: string
}>()
</script>

<template>
  <NCard class="hover:border-primary transition-colors">
    <div class="p-4">
      <div class="flex items-start justify-between gap-4 mb-3">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2">
            <NBadge
              class="uppercase"
            >
              {{ violation.impact || 'UNKNOWN' }}
            </NBadge>
            <span class="text-sm font-mono opacity-60">{{ violation.id }}</span>
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
      >
        Learn more about this issue
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
              class="bg-gray-500/10"
            >
              <div class="p-3">
                <div class="flex items-start gap-2">
                  <NIcon
                    icon="i-carbon-code"
                    class="mt-0.5 opacity-50"
                  />
                  <div class="flex-1 min-w-0">
                    <NCodeBlock
                      :code="node.target.join(' > ')"
                      lang="css"
                      class="text-xs"
                    />
                    <p
                      v-if="node.failureSummary"
                      class="text-xs opacity-70 mt-2"
                    >
                      {{ node.failureSummary }}
                    </p>
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
