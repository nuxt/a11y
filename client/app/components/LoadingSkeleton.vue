<template>
  <div class="p-4">
    <!-- Stats skeleton -->
    <div class="mb-6">
      <!-- Violation count text skeleton -->
      <div class="mb-3 h-5 w-3/4 bg-gray-500/20 rounded animate-pulse" />

      <!-- Stats card skeleton -->
      <div class="bg-gray-500/10 rounded-lg p-4">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            v-for="i in 4"
            :key="i"
            class="space-y-2"
          >
            <div class="h-4 w-20 bg-gray-500/20 rounded animate-pulse" />
            <div class="h-8 w-16 bg-gray-500/20 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>

    <!-- Violation cards skeleton -->
    <div class="space-y-4">
      <div
        v-for="i in 3"
        :key="i"
        class="space-y-3"
      >
        <!-- Section header -->
        <div class="h-6 w-32 bg-gray-500/20 rounded animate-pulse" />

        <!-- Violation cards -->
        <div
          v-for="j in 2"
          :key="j"
          class="bg-gray-500/10 rounded-lg p-4 space-y-3"
        >
          <!-- Header -->
          <div class="flex items-start gap-4">
            <div class="flex-1 space-y-2">
              <div class="h-5 w-24 bg-gray-500/20 rounded animate-pulse" />
              <div class="h-4 w-full bg-gray-500/20 rounded animate-pulse" />
            </div>
          </div>

          <!-- Description lines -->
          <div class="space-y-2">
            <div class="h-4 w-full bg-gray-500/20 rounded animate-pulse" />
            <div class="h-4 w-5/6 bg-gray-500/20 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
