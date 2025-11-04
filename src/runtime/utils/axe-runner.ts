import axe from 'axe-core'
import type { RunOptions, Spec } from 'axe-core'

/**
 * Configuration for the axe runner
 */
export interface AxeRunnerConfig {
  options: Spec
  runOptions: RunOptions
}

/**
 * Creates an axe runner that executes accessibility scans
 */
export function createAxeRunner(config: AxeRunnerConfig, onScanStateChange: (isRunning: boolean) => void) {
  let isScanRunning = false

  // Configure axe with provided options
  axe.configure(config.options)

  /**
   * Runs an accessibility scan on the document
   * Enforces a minimum duration to prevent UI flickering
   */
  async function run(): Promise<axe.Result[]> {
    if (isScanRunning) {
      return []
    }

    isScanRunning = true
    onScanStateChange(true)

    // Track start time to enforce minimum scan duration
    const startTime = Date.now()
    const MIN_SCAN_DURATION = 500 // 500ms minimum - ensures skeleton loader is visible

    try {
      const result = await new Promise<axe.AxeResults>((resolve, reject) => {
        axe.run({
          exclude: ['nuxt-devtools-frame'],
        }, {
          elementRef: true,
          ...config.runOptions,
        }, (error, results) => {
          if (error)
            reject(error)
          else resolve(results)
        })
      })

      // Ensure minimum scan duration
      const elapsed = Date.now() - startTime
      if (elapsed < MIN_SCAN_DURATION) {
        await new Promise(resolve => setTimeout(resolve, MIN_SCAN_DURATION - elapsed))
      }

      return result.violations
    }
    catch (error) {
      console.error('Axe scan failed:', error)
      return []
    }
    finally {
      isScanRunning = false
      onScanStateChange(false)
    }
  }

  return {
    run,
  }
}
