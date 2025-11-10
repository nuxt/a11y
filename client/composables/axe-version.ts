import { version as axeCoreVersion } from 'axe-core/package.json'

/**
 * Get the axe-core version (major.minor) used in this plugin
 */
export function useAxeVersion() {
  const version = axeCoreVersion.split('.').slice(0, 2).join('.')
  const docsUrl = `https://dequeuniversity.com/rules/axe/html/${version}`

  return {
    version,
    fullVersion: axeCoreVersion,
    docsUrl,
  }
}
