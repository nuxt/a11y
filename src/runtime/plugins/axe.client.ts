import axe from 'axe-core'
import { defineNuxtPlugin, nextTick, onNuxtReady, useRuntimeConfig } from '#imports'

export default defineNuxtPlugin((nuxtApp) => {
  const { options, runOptions } = useRuntimeConfig().public.axe
  axe.configure(options)

  // TODO: support introspecting individual components when they render
  async function run() {
    const { violations } = await axe.run(document, runOptions)
    for (const result of violations) {
      // TODO: support different backends (console logging, devtools, etc.)
      console.log(result)
    }
  }

  // TODO: trigger on nuxt hook or composable?
  onNuxtReady(() => { run() })
  nuxtApp.hook('page:finish', async () => {
    await nextTick()
    run()
  })
})
