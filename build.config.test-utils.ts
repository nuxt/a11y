import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/test-utils/index',
    'src/test-utils/setup',
    'src/test-utils/browser',
  ],
  outDir: 'dist',
  clean: false,
  declaration: 'node16',
  externals: [
    'vitest',
    'playwright-core',
    'axe-core',
    'linkedom',
  ],
})
