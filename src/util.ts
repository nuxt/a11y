import type { Nuxt } from 'nuxt/schema'
import type { WebSocketServer } from 'vite'
import { useNuxt } from '@nuxt/kit'

export function useViteWebSocket(nuxt: Nuxt = useNuxt()) {
  return new Promise<WebSocketServer>((_resolve) => {
    nuxt.hooks.hook('vite:serverCreated', (viteServer) => {
      _resolve(viteServer.ws)
    })
  })
}
