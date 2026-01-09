import { JSDOM, VirtualConsole } from 'jsdom'
import axe from 'axe-core'
import type { A11yViolation, A11yViolationNode } from '../../types'

export interface AxeServerOptions {
  axeOptions?: axe.Spec
  runOptions?: axe.RunOptions
}

// Untyped global reference for axe-core DOM requirements
const _global = globalThis as unknown as Record<string, unknown>

function restoreGlobal(key: 'window' | 'document' | 'Node', prev: unknown) {
  if (prev !== undefined) _global[key] = prev
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  else delete _global[key]
}

// Mutex to prevent concurrent axe runs (globals conflict)
let running = false
const queue: Array<() => void> = []

async function withMutex<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const run = async () => {
      running = true
      try {
        const result = await fn()
        resolve(result)
      }
      catch (err) {
        reject(err)
      }
      finally {
        running = false
        const next = queue.shift()
        if (next)
          next()
      }
    }
    if (running) {
      queue.push(run)
    }
    else {
      run()
    }
  })
}

export async function runAxeOnHtml(html: string, route: string, options: AxeServerOptions = {}): Promise<A11yViolation[]> {
  // Skip incomplete HTML (error pages, etc.)
  if (!html.includes('<body') || !html.includes('</body>'))
    return []

  return withMutex(async () => {
    // Suppress jsdom console warnings (canvas, etc.)
    const virtualConsole = new VirtualConsole()

    const dom = new JSDOM(html, { url: `http://localhost${route}`, runScripts: 'outside-only', virtualConsole })
    const { window } = dom
    const { document } = window

    // Check if body exists and has content
    if (!document.body || !document.body.innerHTML.trim()) {
      dom.window.close()
      return []
    }

    // Set globals for axe-core
    const prevWindow = _global.window
    const prevDocument = _global.document
    const prevNode = _global.Node
    _global.window = window
    _global.document = document
    _global.Node = window.Node

    try {
      if (options.axeOptions)
        axe.configure(options.axeOptions)

      const results = await axe.run(document.documentElement as unknown as axe.ElementContext, options.runOptions || {})

      return results.violations.map(v => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        helpUrl: v.helpUrl,
        description: v.description,
        tags: v.tags,
        timestamp: Date.now(),
        route,
        nodes: v.nodes.map((n): A11yViolationNode => ({ target: n.target, html: n.html, failureSummary: n.failureSummary })),
      }))
    }
    finally {
      restoreGlobal('window', prevWindow)
      restoreGlobal('document', prevDocument)
      restoreGlobal('Node', prevNode)
      dom.window.close()
    }
  })
}
