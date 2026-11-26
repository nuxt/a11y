import { existsSync } from 'node:fs'
import type { Resolver } from '@nuxt/kit'
import type { Nuxt } from 'nuxt/schema'
import { addVitePlugin } from '@nuxt/kit'
import { NUXT_DEVTOOLS_GROUP_ID, onDevtoolsReady } from '@nuxt/devtools-kit'
import type { ClientFunctions, ServerFunctionActions, ServerFunctionQueries } from './rpc-types'
import { RPC_NAMESPACE } from './rpc-types'
import type { ModuleOptions } from './module'

const DEVTOOLS_UI_ROUTE = '/__nuxt-a11y-client'
const DEVTOOLS_UI_LOCAL_PORT = 3030

export function setupDevToolsUI(options: ModuleOptions, moduleResolve: Resolver['resolve'], nuxt: Nuxt) {
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

  onDevtoolsReady((ctx) => {
    const ws = ctx.viteServer?.ws

    if (!ws)
      return

    ctx.docks.register({
      id: 'nuxt-a11y',
      title: 'Accessibility',
      icon: 'iconoir:accessibility',
      type: 'iframe',
      url: DEVTOOLS_UI_ROUTE,
      groupId: NUXT_DEVTOOLS_GROUP_ID,
      category: 'modules',
    })

    const { rpc } = ctx.scope(RPC_NAMESPACE)

    const serverFunctionQueries: ServerFunctionQueries = {
      getOptions: () => options,
    }

    for (const [name, handler] of Object.entries(serverFunctionQueries)) {
      rpc.register({ name, type: 'query', handler })
    }

    const serverFunctionActions: ServerFunctionActions = {
      reset: () => ws.send('nuxt-a11y:reset'),
      connected: () => ws.send('nuxt-a11y:connected'),
      enableConstantScanning: () => ws.send('nuxt-a11y:enableConstantScanning'),
      disableConstantScanning: () => ws.send('nuxt-a11y:disableConstantScanning'),
      triggerScan: () => ws.send('nuxt-a11y:triggerScan'),
      highlightElement: (selector, id, color) => ws.send('nuxt-a11y:highlightElement', { selector, id, color }),
      unhighlightElement: selector => ws.send('nuxt-a11y:unhighlightElement', selector),
      unhighlightAll: () => ws.send('nuxt-a11y:unhighlightAll'),
      updateElementId: (selector, id) => ws.send('nuxt-a11y:updateElementId', { selector, id }),
      removeElementIdBadge: selector => ws.send('nuxt-a11y:removeElementIdBadge', selector),
      scrollToElement: selector => ws.send('nuxt-a11y:scrollToElement', selector),
    }

    for (const [name, handler] of Object.entries(serverFunctionActions)) {
      rpc.register({ name, type: 'action', handler })
    }

    const clientFunctions: ClientFunctions = {
      showViolations: payload => rpc.broadcast({ method: 'showViolations', args: [payload], event: true }),
      scanRunning: running => rpc.broadcast({ method: 'scanRunning', args: [running], event: true }),
      constantScanningEnabled: enabled => rpc.broadcast({ method: 'constantScanningEnabled', args: [enabled], event: true }),
      routeChanged: path => rpc.broadcast({ method: 'routeChanged', args: [path], event: true }),
      activeTabChanged: payload => rpc.broadcast({ method: 'activeTabChanged', args: [payload], event: true }),
    }

    for (const [name, handler] of Object.entries(clientFunctions)) {
      ws.on(`nuxt-a11y:${name}`, handler)
    }
  }, nuxt)
}
