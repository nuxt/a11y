import { parseHTML } from 'linkedom'
import type axeCore from 'axe-core'
import type { A11yViolation, A11yViolationNode } from '../runtime/types'

export interface AxeServerOptions {
  axeOptions?: axeCore.Spec
  runOptions?: axeCore.RunOptions
}

type CreateElement = (tagName: string, options?: unknown) => unknown

/**
 * Patch linkedom's window/document with stubs that axe-core expects but linkedom doesn't provide.
 */
function patchForAxe(window: Record<string, unknown>, document: Record<string, unknown> & { createElement: CreateElement }) {
  if (!window.screen) {
    window.screen = { orientation: { angle: 0, type: 'landscape-primary' } }
  }

  // linkedom preserves case in createElement (e.g. createElement('A').localName === 'A')
  // but the HTML spec requires lowercase. axe-core uses this to detect XHTML mode.
  const origCreateElement = document.createElement.bind(document)
  document.createElement = (tagName, options) =>
    origCreateElement(tagName.toLowerCase(), options)

  if (!window.getComputedStyle) {
    window.getComputedStyle = () => ({
      getPropertyValue: () => '',
    })
  }

  if (!document.styleSheets) {
    document.styleSheets = []
  }

  if (!document.implementation) {
    document.implementation = {
      createHTMLDocument: () => {
        const { document: doc } = parseHTML('<!DOCTYPE html><html><head></head><body></body></html>')
        return doc
      },
    }
  }
}

// Cache the axe module once loaded
let axeModule: typeof axeCore | null = null
let configured = false

// Mutex to prevent concurrent axe runs (axe.setup/teardown is not reentrant)
let running: Promise<void> = Promise.resolve()

async function withMutex<T>(fn: () => Promise<T>): Promise<T> {
  const prev = running
  let resolve: () => void
  running = new Promise<void>(r => resolve = r)
  await prev
  try {
    return await fn()
  }
  finally {
    resolve!()
  }
}

/**
 * Import axe-core with the given window/document already set as globals.
 * axe-core captures window/document at module load time via its IIFE,
 * so globals must be set before the first import.
 */
async function getAxe(window: unknown, document: unknown): Promise<typeof axeCore> {
  const _global = globalThis as unknown as Record<string, unknown>

  if (!axeModule) {
    // Set globals before first import so axe-core's IIFE captures them
    const prevWindow = _global.window
    const prevDocument = _global.document
    const prevNode = _global.Node

    _global.window = window
    _global.document = document
    _global.Node = (window as { Node: unknown }).Node

    try {
      const mod = await import('axe-core')
      axeModule = mod.default || mod
    }
    finally {
      // Restore — axe has already captured the references it needs
      if (prevWindow !== undefined) _global.window = prevWindow

      else delete _global.window
      if (prevDocument !== undefined) _global.document = prevDocument

      else delete _global.document
      if (prevNode !== undefined) _global.Node = prevNode

      else delete _global.Node
    }
  }

  return axeModule
}

export async function runAxeOnHtml(html: string, route: string, options: AxeServerOptions = {}): Promise<A11yViolation[]> {
  // Skip incomplete HTML (error pages, redirects, etc.)
  if (!html.includes('<body') || !html.includes('</body>'))
    return []

  const { window, document } = parseHTML(html)

  // Check if body exists and has content
  if (!document.body || !document.body.innerHTML.trim())
    return []

  // Patch linkedom gaps for axe-core compatibility
  patchForAxe(
    window as unknown as Record<string, unknown>,
    document as unknown as Record<string, unknown> & { createElement: CreateElement },
  )

  const axe = await getAxe(window, document)

  if (options.axeOptions && !configured) {
    axe.configure(options.axeOptions)
    configured = true
  }

  // axe.setup/teardown is not reentrant — serialize runs
  return withMutex(async () => {
    axe.setup(document as unknown as Document)

    // Suppress axe-core's console.log noise (e.g. "Frame does not have a content window")
    // when it encounters iframe elements that linkedom doesn't fully support
    const origLog = console.log
    console.log = (...args: unknown[]) => {
      if (typeof args[0] === 'string' && args[0].includes('Frame does not have a content window'))
        return
      origLog(...args)
    }

    try {
      const results = await axe.run(document.documentElement as unknown as axeCore.ElementContext, options.runOptions || {})

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
      console.log = origLog
      axe.teardown()
    }
  })
}
