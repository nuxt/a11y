import { existsSync } from 'node:fs'
import type { Resolver } from '@nuxt/kit'
import type { Nuxt } from 'nuxt/schema'
import { addVitePlugin, useNuxt } from '@nuxt/kit'
import { NUXT_DEVTOOLS_GROUP_ID, onDevtoolsReady } from '@nuxt/devtools-kit'
import { HMR_EVENT_PREFIX } from './runtime/constants'
import { RPC_NAMESPACE } from './rpc-types'
import type { ClientFunctions, PageEvents, ServerFunctions } from './rpc-types'
import type { ModuleOptions } from './module'
import { useViteWebSocket } from './util'

const DEVTOOLS_UI_ROUTE = '/__nuxt-a11y-client'
const DEVTOOLS_UI_LOCAL_PORT = 3030

export function setupDevToolsUI(options: ModuleOptions, moduleResolve: Resolver['resolve'], nuxt: Nuxt = useNuxt()) {
  const clientPath = moduleResolve('./client')
  const isProductionBuild = existsSync(clientPath)

  addVitePlugin({
    name: 'nuxt-a11y-devtools-ui',
    config() {
      if (!isProductionBuild) {
        return {
          server: {
            proxy: {
              // Proxy for Nuxt assets within the DevTools UI (must come first for specificity)
              [`${DEVTOOLS_UI_ROUTE}/_nuxt`]: {
                target: `http://localhost:${DEVTOOLS_UI_LOCAL_PORT}`,
                changeOrigin: true,
                followRedirects: true,
                rewrite: (path: string) => path,
              },
              // Proxy for the main DevTools UI route
              [DEVTOOLS_UI_ROUTE]: {
                target: `http://localhost:${DEVTOOLS_UI_LOCAL_PORT}${DEVTOOLS_UI_ROUTE}`,
                changeOrigin: true,
                followRedirects: true,
                rewrite: (path: string) => path.replace(DEVTOOLS_UI_ROUTE, ''),
              },
            },
          },
        }
      }
    },
    async configureServer(server) {
      // Serve production-built client (used when package is published)
      if (isProductionBuild) {
        const sirv = await import('sirv').then(r => r.default || r)
        server.middlewares.use(
          DEVTOOLS_UI_ROUTE,
          sirv(clientPath, { dev: true, single: true }),
        )
      }
    },
  })

  let isConnected = false
  const viteServerWs = useViteWebSocket()

  async function sendToPage<K extends keyof PageEvents>(
    event: K,
    ...[payload]: PageEvents[K] extends undefined ? [] : [PageEvents[K]]
  ) {
    const ws = await viteServerWs
    ws.send(`${HMR_EVENT_PREFIX}:${event}` as string, payload)
  }

  let broadcast: (<K extends keyof ClientFunctions>(method: K, ...args: Parameters<ClientFunctions[K]>) => Promise<void>) | undefined

  // registering
  onDevtoolsReady((ctx) => {
    ctx.docks.register({
      id: 'nuxt-a11y',
      type: 'iframe',
      title: 'Nuxt a11y',
      icon: 'iconoir:accessibility',
      url: DEVTOOLS_UI_ROUTE,
      groupId: NUXT_DEVTOOLS_GROUP_ID,
    })

    function register<K extends keyof ServerFunctions>({ name, type, handler }: {
      name: K
      type: 'query' | 'action'
      handler: ServerFunctions[K]
    }) {
      ctx.rpc.register({ name: `${RPC_NAMESPACE}:${name}`, type, handler })
    }

    register({
      name: `getOptions`,
      type: 'query',
      handler: () => options,
    })

    register({
      name: `reset`,
      type: 'action',
      handler: () => sendToPage('reset'),
    })

    register({
      name: `connected`,
      type: 'action',
      handler: async () => {
        await sendToPage('connected')
        isConnected = true
      },
    })

    register({
      name: `enableConstantScanning`,
      type: 'action',
      handler: () => sendToPage('enableConstantScanning'),
    })

    register({
      name: `disableConstantScanning`,
      type: 'action',
      handler: () => sendToPage('disableConstantScanning'),
    })

    register({
      name: `triggerScan`,
      type: 'action',
      handler: () => sendToPage('triggerScan'),
    })

    register({
      name: `highlightElement`,
      type: 'action',
      handler: (selector, id, color) => sendToPage('highlightElement', { selector, id, color }),
    })

    register({
      name: `unhighlightElement`,
      type: 'action',
      handler: selector => sendToPage('unhighlightElement', selector),
    })

    register({
      name: `unhighlightAll`,
      type: 'action',
      handler: () => sendToPage('unhighlightAll'),
    })

    register({
      name: `updateElementId`,
      type: 'action',
      handler: (selector, id) => sendToPage('updateElementId', { selector, id }),
    })

    register({
      name: `removeElementIdBadge`,
      type: 'action',
      handler: selector => sendToPage('removeElementIdBadge', selector),
    })

    register({
      name: `scrollToElement`,
      type: 'action',
      handler: selector => sendToPage('scrollToElement', selector),
    })

    broadcast = (method, ...args) => ctx.rpc.broadcast({
      method: `${RPC_NAMESPACE}:${method}` as never,
      args: args as never,
      event: true,
      optional: true,
    })
  }, nuxt)

  // forwarding
  function forwardToClient<K extends keyof ClientFunctions>(method: K) {
    viteServerWs.then((ws) => {
      ws.on(`${HMR_EVENT_PREFIX}:${method}`, (payload: Parameters<ClientFunctions[K]>[0]) => {
        if (!isConnected || !broadcast)
          return
        broadcast(method, ...([payload] as Parameters<ClientFunctions[K]>)).catch(() => {})
      })
    })
  }

  forwardToClient('showViolations')
  forwardToClient('scanRunning')
  forwardToClient('constantScanningEnabled')
  forwardToClient('routeChanged')
  forwardToClient('activeTabChanged')
}
