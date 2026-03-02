import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  hooks: {
    'build:done'(ctx) {
      for (const warning of ctx.warnings) {
        if (warning.includes('test-utils')) {
          ctx.warnings.delete(warning)
        }
      }
    },
  },
})
