# `nuxt/a11y`

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

Nuxt module to provide accessibility hinting and utilties.

- [✨ &nbsp;Release Notes](/CHANGELOG.md)
<!-- - [🏀 Online playground](https://stackblitz.com/github/nuxt/a11y?file=playground%2Fapp.vue) -->
<!-- - [📖 &nbsp;Documentation](https://example.com) -->

## Quick Setup

Add `@nuxt/a11y` dependency to your project and to your `nuxt.config`

```bash
npx nuxi module add @nuxt/a11y
```

That's it! You can now use My Module in your Nuxt app ✨

## Configuration

### DevTools Options

#### `defaultHighlight`

- Type: `boolean`
- Default: `false`

Automatically highlight all accessibility violations in the DevTools when they are detected. When enabled, all violations on the current page will be pinned and highlighted with numbered badges. Users can still manually unpin individual violations by clicking on them in the DevTools.

```typescript
export default defineNuxtConfig({
  modules: ['@nuxt/a11y'],
  
  a11y: {
    defaultHighlight: true, // Auto-highlight all violations
  },
})
```

#### `logIssues`

- Type: `boolean`
- Default: `true`

Controls whether accessibility violations are logged to the browser console. When enabled, violations will be logged with appropriate styling and severity levels (errors for critical issues, warnings for others).

```typescript
export default defineNuxtConfig({
  modules: ['@nuxt/a11y'],
  
  a11y: {
    logIssues: false, // Disable console logging
  },
})
```

### Axe Configuration

You can configure the underlying axe-core runner:

```typescript
export default defineNuxtConfig({
  modules: ['@nuxt/a11y'],
  
  a11y: {
    axe: {
      options: {
        // axe-core configuration options
      },
      runOptions: {
        // axe-core run options
      },
    },
  },
})
```

## Development

```bash
# Install dependencies
pnpm install

# Generate type stubs
pnpm dev:prepare

# Develop with the playground
pnpm dev

# Build the playground
pnpm dev:build

# Run ESLint
pnpm lint

# Run Vitest
pnpm test
pnpm test:watch

# Release new version
pnpm release
```

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/@nuxt/a11y/latest.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-version-href]: https://npmjs.com/package/@nuxt/a11y

[npm-downloads-src]: https://img.shields.io/npm/dm/@nuxt/a11y.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-downloads-href]: https://npmjs.com/package/@nuxt/a11y

[license-src]: https://img.shields.io/npm/l/@nuxt/a11y.svg?style=flat&colorA=18181B&colorB=28CF8D
[license-href]: https://npmjs.com/package/@nuxt/a11y

[nuxt-src]: https://img.shields.io/badge/Nuxt-18181B?logo=nuxt.js
[nuxt-href]: https://nuxt.com
