import type { Nuxt, NuxtHooks } from 'nuxt/schema'
import { useNuxt } from '@nuxt/kit'

type ViteServerWs = Parameters<NuxtHooks['vite:serverCreated']>[0]['ws']

export function useViteWebSocket(nuxt: Nuxt = useNuxt()) {
  return new Promise<ViteServerWs>((_resolve) => {
    nuxt.hooks.hook('vite:serverCreated', (viteServer) => {
      _resolve(viteServer.ws)
    })
  })
}
