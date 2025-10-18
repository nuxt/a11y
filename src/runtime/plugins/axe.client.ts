import axe from 'axe-core'
import { defineNuxtPlugin, useRuntimeConfig } from '#imports'
import type { A11yViolation } from '../types'
import { IMPACT_COLORS } from '../constants'

export default defineNuxtPlugin(() => {
  const { options, runOptions } = useRuntimeConfig().public.axe
  axe.configure(options)
  let isScanRunning = false

  // TODO: support introspecting individual components when they render
  async function run() {
    if (isScanRunning) return

    isScanRunning = true
    broadcast('scanRunning', isScanRunning)

    try {
      const result = await axe.run(document, {
        elementRef: true,
        ...runOptions,
      })
      sendViolationsToDevtools(result.violations)
    }
    catch (error) {
      console.error('Axe scan failed:', error)
    }
    finally {
      isScanRunning = false
      broadcast('scanRunning', isScanRunning)
    }
  }

  const warned = new Set<string>()
  function logViolation(violation: axe.Result) {
    const elements = violation.nodes.filter(i => !i.target?.includes('html') && i.element).map(i => i.element)
    const impact = violation.impact ?? 'moderate'
    const color = IMPACT_COLORS[impact]

    console[impact === 'critical' ? 'error' : 'warn'](
      `%ca11y%c ${violation.help}\n  ${violation.helpUrl}\n`,
      `color: white; border-radius: 3px; padding: 2px 3px; font-size: 0.8em; background: ${color};`,
      '',
      ...elements,
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function broadcast(event: string, payload?: any) {
    if (!import.meta.hot) {
      console.warn('No hot context')
      return
    }
    try {
      import.meta.hot.send(`nuxt-a11y:${event}`, payload)
    }
    catch {
      console.log('Failed to send via HMR')
    }
  }

  async function sendViolationsToDevtools(violations: axe.Result[]) {
    const unwarnedViolations = violations.filter((v: axe.Result) => {
      const id = `${v.id}:${v.impact}:${v.nodes.map(n => n.target).join(',')}`

      if (!warned.has(id)) {
        warned.add(id)
        // Still logs violations in console because of testing purposes
        // TODO: find a better way to test without flooding the console
        logViolation(v)
        return true
      }
      return false
    })

    const payload: A11yViolation[] = unwarnedViolations.map(v => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      helpUrl: v.helpUrl,
      description: v.description,
      nodes: v.nodes.map(n => ({
        target: n.target,
        html: n.html,
        failureSummary: n.failureSummary,
      })),
      tags: v.tags,
      timestamp: Date.now(),
    }))

    broadcast('showViolations', payload)
  }

  // don't start until we open the tab
  if (import.meta.hot) {
    import.meta.hot.on('nuxt-a11y:connected', () => {
      // TODO: now scan only runs once when the tab is opened
      // consider adding a button in the devtools to trigger scans
      // consider a constant scanning feature where it scans on every user event or on a timer
      run()
    })
  }

  // Expose run function for testing
  if (typeof window !== 'undefined') {
    (window as Window & { __nuxt_a11y_run__?: () => Promise<void> }).__nuxt_a11y_run__ = run
  }
})
