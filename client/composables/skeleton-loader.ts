import { ref, watch } from 'vue'
import { axeViolations, isScanRunning, isRouteChangeScan } from './rpc'

const MINIMUM_SKELETON_TIME = 1500 // 1.5 seconds

export function useSkeletonLoader() {
  const isShowingSkeleton = ref(true)
  const isInitialLoad = ref(true)
  let skeletonTimer: ReturnType<typeof setTimeout> | null = null
  let skeletonStartTime = 0

  // Watch for scan state changes - show skeleton for manual scans and route changes, not auto-scans
  watch(isScanRunning, (running) => {
    if (running && (isRouteChangeScan.value || isInitialLoad.value)) {
      // Route change scan or initial load - show skeleton
      isShowingSkeleton.value = true
      skeletonStartTime = Date.now()

      // Clear any existing timer
      if (skeletonTimer) {
        clearTimeout(skeletonTimer)
      }

      // Clear initial load flag after first scan
      if (isInitialLoad.value) {
        isInitialLoad.value = false
      }
    }
  })

  // Watch for violations updates
  watch(axeViolations, () => {
    // Hide skeleton when scan is done
    if (!isScanRunning.value && isShowingSkeleton.value) {
      if (skeletonTimer) {
        clearTimeout(skeletonTimer)
      }

      const elapsed = Date.now() - skeletonStartTime
      const remainingTime = Math.max(0, MINIMUM_SKELETON_TIME - elapsed)

      skeletonTimer = setTimeout(() => {
        isShowingSkeleton.value = false
        // Reset the route change flag after hiding skeleton
        isRouteChangeScan.value = false
      }, remainingTime)
    }
  }, { deep: true })

  return {
    isShowingSkeleton,
  }
}
