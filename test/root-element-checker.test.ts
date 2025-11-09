/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { isRootElementSelector } from '../client/composables/root-element-checker'

describe('isRootElementSelector', () => {
  beforeEach(() => {
    // Setup a mock DOM structure with Nuxt root
    document.body.innerHTML = `
      <div id="__nuxt">
        <div id="app">
          <main class="container">
            <button class="btn">Click me</button>
          </main>
        </div>
      </div>
    `
  })

  describe('root element selectors', () => {
    it('returns true for html element', () => {
      expect(isRootElementSelector('html')).toBe(true)
    })

    it('returns true for body element', () => {
      expect(isRootElementSelector('body')).toBe(true)
    })

    it('returns true for html with attributes', () => {
      document.documentElement.setAttribute('lang', 'en')
      expect(isRootElementSelector('html[lang]')).toBe(true)
    })

    it('returns true for body with class', () => {
      document.body.className = 'main'
      expect(isRootElementSelector('body.main')).toBe(true)
    })
  })

  describe('non-root element selectors', () => {
    it('returns false for elements inside Nuxt root', () => {
      expect(isRootElementSelector('#app')).toBe(false)
    })

    it('returns false for nested elements', () => {
      expect(isRootElementSelector('.container')).toBe(false)
    })

    it('returns false for deeply nested elements', () => {
      expect(isRootElementSelector('.btn')).toBe(false)
    })

    it('returns false for non-existent selector', () => {
      expect(isRootElementSelector('.non-existent')).toBe(false)
    })

    it('returns false for invalid selector', () => {
      expect(isRootElementSelector('>>invalid<<')).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('treats Nuxt root element itself as a root element', () => {
      expect(isRootElementSelector('#__nuxt')).toBe(true)
    })

    it('returns false when Nuxt root is missing', () => {
      document.body.innerHTML = '<div id="app"></div>'
      expect(isRootElementSelector('html')).toBe(false)
      expect(isRootElementSelector('body')).toBe(false)
      expect(isRootElementSelector('#app')).toBe(false)
    })
  })
})
