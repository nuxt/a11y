import type { NuxtDevtoolsHostClient } from '@nuxt/devtools-kit/types'
import type axe from 'axe-core'

declare global {
  interface Window {
    /**
     * Nuxt DevTools client for host app
     */
    __NUXT_DEVTOOLS_HOST__?: NuxtDevtoolsHostClient
  }
}

declare module '@nuxt/devtools-kit/types' {
  interface NuxtDevtoolsClientHooks {
    'a11y:run': (result: axe.AxeResults) => void
    'a11y:iframe-ready': () => void
  }
}
