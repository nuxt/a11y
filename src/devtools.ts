import { existsSync } from 'node:fs'
import type { Resolver } from '@nuxt/kit'
import type { Nuxt } from 'nuxt/schema'
import type { BirpcGroup } from 'birpc'
import { addVitePlugin, useNuxt } from '@nuxt/kit'
import { extendServerRpc, onDevToolsInitialized } from '@nuxt/devtools-kit'
import type { ClientFunctions, ServerFunctions } from './rpc-types'
import type { ModuleOptions } from './module'
import { useViteWebSocket } from './util'

const DEVTOOLS_UI_ROUTE = '/__nuxt-a11y-client'
const DEVTOOLS_UI_LOCAL_PORT = 3030
const RPC_NAMESPACE = 'nuxt-a11y-rpc'

export function setupDevToolsUI(options: ModuleOptions, moduleResolve: Resolver['resolve'], nuxt: Nuxt = useNuxt()) {
  const clientPath = moduleResolve('./client')
  const isProductionBuild = existsSync(clientPath)

  addVitePlugin({
    name: 'nuxt-a11y-devtools-ui',
    config() {
      if (!isProductionBuild) {
        return {
          server: {
            // Proxy for Nuxt assets within the DevTools UI (must come first for specificity)
            proxy: { [`${DEVTOOLS_UI_ROUTE}/_nuxt`]: {
              target: `http://localhost:${DEVTOOLS_UI_LOCAL_PORT}`,
              changeOrigin: true,
              followRedirects: true,
              rewrite: path => path,
            },

            // Proxy for the main DevTools UI route
            [DEVTOOLS_UI_ROUTE]: {
              target: `http://localhost:${DEVTOOLS_UI_LOCAL_PORT}${DEVTOOLS_UI_ROUTE}`,
              changeOrigin: true,
              followRedirects: true,
              rewrite: path => path.replace(DEVTOOLS_UI_ROUTE, ''),
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

  nuxt.hook('devtools:customTabs', (tabs) => {
    tabs.push({
      // unique identifier
      name: 'nuxt-a11y',
      // title to display in the tab
      title: 'Nuxt a11y',
      // any icon from Iconify, or a URL to an image
      icon: 'iconoir:accessibility',
      // iframe view
      view: {
        type: 'iframe',
        src: DEVTOOLS_UI_ROUTE,
      },
    })
  })

  let isConnected = false
  const viteServerWs = useViteWebSocket()
  const rpc = new Promise<BirpcGroup<ClientFunctions, ServerFunctions>>((promiseResolve) => {
    onDevToolsInitialized(async () => {
      const rpc = extendServerRpc<ClientFunctions, ServerFunctions>(RPC_NAMESPACE, {
        getOptions() {
          return options
        },
        async reset() {
          const ws = await viteServerWs
          ws.send('nuxt-a11y:reset')
        },
        async connected() {
          const ws = await viteServerWs
          ws.send('nuxt-a11y:connected')
          isConnected = true
        },
        async enableConstantScanning() {
          const ws = await viteServerWs
          ws.send('nuxt-a11y:enableConstantScanning')
        },
        async disableConstantScanning() {
          const ws = await viteServerWs
          ws.send('nuxt-a11y:disableConstantScanning')
        },
        async triggerScan() {
          const ws = await viteServerWs
          ws.send('nuxt-a11y:triggerScan')
        },
        async highlightElement(selector: string, id?: number, color?: string) {
          const ws = await viteServerWs
          ws.send('nuxt-a11y:highlightElement', { selector, id, color })
        },
        async unhighlightElement(selector: string) {
          const ws = await viteServerWs
          ws.send('nuxt-a11y:unhighlightElement', selector)
        },
        async unhighlightAll() {
          const ws = await viteServerWs
          ws.send('nuxt-a11y:unhighlightAll')
        },
        async updateElementId(selector: string, id: number) {
          const ws = await viteServerWs
          ws.send('nuxt-a11y:updateElementId', { selector, id })
        },
        async removeElementIdBadge(selector: string) {
          const ws = await viteServerWs
          ws.send('nuxt-a11y:removeElementIdBadge', selector)
        },
        async scrollToElement(selector: string) {
          const ws = await viteServerWs
          ws.send('nuxt-a11y:scrollToElement', selector)
        },
      })
      promiseResolve(rpc)
    })
  })

  viteServerWs.then((ws) => {
    ws.on('nuxt-a11y:showViolations', async (payload) => {
      if (isConnected) {
        const _rpc = await rpc
        _rpc.broadcast.showViolations(payload).catch(() => {})
      }
    })
    ws.on('nuxt-a11y:scanRunning', async (payload: boolean) => {
      if (isConnected) {
        const _rpc = await rpc
        _rpc.broadcast.scanRunning(payload).catch(() => {})
      }
    })
    ws.on('nuxt-a11y:constantScanningEnabled', async (payload: boolean) => {
      if (isConnected) {
        const _rpc = await rpc
        _rpc.broadcast.constantScanningEnabled(payload).catch(() => {})
      }
    })
    ws.on('nuxt-a11y:routeChanged', async (payload: string) => {
      if (isConnected) {
        const _rpc = await rpc
        _rpc.broadcast.routeChanged(payload).catch(() => {})
      }
    })
  })
}
