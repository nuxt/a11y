import axe from 'axe-core'
import { onDevtoolsHostClientConnected, useDevtoolsHostClient } from '@nuxt/devtools-kit/host-client'
import { defineNuxtPlugin, nextTick, onNuxtReady, useRuntimeConfig } from '#imports'
import type {} from '../../../shared/declarations'

export default defineNuxtPlugin((nuxtApp) => {
  const { options, runOptions } = useRuntimeConfig().public.axe
  axe.configure(options)

  const devtools = useDevtoolsHostClient()
  let lastResult: axe.AxeResults | null = null

  // TODO: support introspecting individual components when they render
  async function run() {
    const result = await axe.run(document, {
      elementRef: true,
      ...runOptions,
    })
    lastResult = result
    for (const violation of result.violations) {
      // TODO: support different backends (console logging, devtools, etc.)
      logViolation(violation)
    }
    devtools.value?.hooks.callHook('a11y:run', result)
  }

  const warned = new Set<string>()
  const colorMap = {
    minor: '#f7e167',
    moderate: '#cf863e',
    serious: '#f25c54',
    critical: '#720026',
  }
  function logViolation(violation: axe.Result) {
    const id = violation.id + ':' + violation.impact + ':' + violation.nodes.map(i => i.target).join(',')
    if (warned.has(id))
      return
    warned.add(id)
    const elements = violation.nodes.filter(i => !i.target?.includes('html') && i.element).map(i => i.element)
    console[violation.impact === 'critical' ? 'error' : 'warn'](
      `%ca11y%c ${violation.help}\n  ${violation.helpUrl}\n`,
      `color: white; border-radius: 3px; padding: 2px 3px; font-size: 0.8em; background: ${colorMap[violation.impact || 'moderate']};`,
      '',
      ...elements,
    )
    // console.log(violation)
  }

  // TODO: trigger on nuxt hook or composable?
  onNuxtReady(() => {
    run()
  })
  onDevtoolsHostClientConnected((devtools) => {
    devtools.hooks.hook('a11y:iframe-ready', () => {
      if (lastResult) {
        devtools.hooks.callHook('a11y:run', lastResult)
      }
    })
    if (lastResult) {
      devtools.hooks.callHook('a11y:run', lastResult)
    }
  })
  nuxtApp.hook('page:finish', async () => {
    await nextTick()
    run()
  })
})
